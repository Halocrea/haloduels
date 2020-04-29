const Database  = require('better-sqlite3')
const Duellist  = require ('../schemas/Duellist')

class Duellists {
    constructor (guild) {
        try {
            this.db = new Database(`data/duellists-${guild.id}.db`)

            const createDuellistsTable = `CREATE TABLE IF NOT EXISTS duellists (
                id VARCHAR(30) PRIMARY KEY,
                displayName VARCHAR(255),
                enroledAt DATETIME,
                lastDuel DATETIME,
                status INTEGER,
                tmp BOOLEAN,
                updatedAt DATETIME,
                dailyGifts TEXT,
                stats TEXT
            );`;
            this.db.exec(createDuellistsTable)
        } catch (err) {
            process.dLogger.log(err)
        }
    }

    add (member, temporary = false) {
        const checkExistence = this.getById(member.id)
        
        if (checkExistence) 
            return new Duellist(checkExistence)
        
        try {
            let duellist    = new Duellist(member, temporary)
            let queryStr    = 'INSERT INTO duellists '
            let rowNames    = ''
            let namedValues = '' 

            for (let k in duellist._serialize()) {
                rowNames    += `${k},`
                namedValues += `@${k},`
            }

            rowNames        = rowNames.substring(0, rowNames.length - 1)
            namedValues     = namedValues.substring(0, namedValues.length - 1)
            queryStr        += `(${rowNames}) VALUES (${namedValues})`
            const statement = this.db.prepare(queryStr)
            
            statement.run(duellist._serialize())

            return duellist
        } catch (err) {
            process.dLogger.log(err)
        }
    }

    all () {
        const duellistsRaw     = this.db.prepare('SELECT * FROM duellists').all()
        const duellists        = []
        for (const i in duellistsRaw) 
            duellists.push(new Duellist(duellistsRaw[i]))

        return duellists
    }

    getById (id) {
        const duellistRaw = this.db.prepare('SELECT * FROM duellists WHERE id = ? LIMIT 1').get(id)

        return duellistRaw ? new Duellist(duellistRaw) : null
    }

    unset (id) {
        const info = this.db.prepare('DELETE FROM duellists WHERE id = ? LIMIT 1').run(id)

        return info.changes >= 0
    }

    update (args) {
        const currentDuellist = this.getById(args.id)

        if (!currentDuellist)
            return false 
        
        args.updatedAt = new Date() 

        let queryStr = 'UPDATE duellists SET '
        for (let k in args._serialize()) if (currentDuellist.hasOwnProperty(k) && k !== 'id') 
            queryStr += `${k}=@${k},`
        queryStr = `${queryStr.substring(0, queryStr.length - 1)} WHERE id=@id`

        this.db.prepare(queryStr).run(args._serialize())

        return args
    }
}

module.exports = Duellists
