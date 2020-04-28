require('dotenv').config()

const Database              = require('better-sqlite3')
const Statements            = require('../utils/Statements')
const toolsOfDestruction    = require('./../utils/toolsOfDestruction')
const { TYPE, RESULT }      = require('./../utils/DUEL_ENUMS')
const Duel                  = require('./../schemas/Duel') 

class DuelManager {
    constructor (guild, translations) {
        this.guild  = guild
        this.$t     = translations
        try {
            this.db = new Database(`data/duels-${guild.id}.db`)

            const createDuelsTable = `CREATE TABLE IF NOT EXISTS duels (
                id VARCHAR(30) PRIMARY KEY,
                bonuses TEXT,
                busy BOOLEAN,
                count TEXT,
                duellists TEXT, 
                hasEnded BOOLEAN,
                name VARCHAR(255),
                startedAt DATETIME,
                updatedAt DATETIME
            );`;
            this.db.exec(createDuelsTable)
        } catch (err) {
            console.log(err)
        }
    }

    all () {
        const duelsRaw     = this.db.prepare('SELECT * FROM duels').all()
        const duels        = []
        for (const i in duelsRaw) 
            duels.push(new Duel(duelsRaw[i], this.guild))

        return duels
    }

    create (channel, offender, defender) {
        try {
            const checkExistence = this.getById(channel.id)
            if (checkExistence)
                return checkExistence
            
            const duel = new Duel({
                id          : channel.id,
                name        : channel.name,
                duellists   : [
                    { color: 'red', duellist: offender },
                    { color: 'blue', duellist: defender }
                ],
                busy        : true
            }, this.guild)
            
            let queryStr    = 'INSERT INTO duels '
            let rowNames    = ''
            let namedValues = '' 

            for (let k in duel._serialize()) {
                rowNames    += `${k},`
                namedValues += `@${k},`
            }

            rowNames    = rowNames.substring(0, rowNames.length - 1)
            namedValues = namedValues.substring(0, namedValues.length - 1)
            queryStr    += `(${rowNames}) VALUES (${namedValues})`

            const statement = this.db.prepare(queryStr)

            statement.run(duel._serialize())

            return duel
        } catch (err) {
            console.log(err)
        }
    }

    endDuel (duel) {
        try {
            const info = this.db.prepare('DELETE FROM duels WHERE id = ? LIMIT 1').run(duel.id)
            return info.changes
        } catch (err) {
            console.log(err)
        }

        return false
    }

    getById(id) {
        const duelRaw = this.db.prepare('SELECT * FROM duels WHERE id = ? LIMIT 1').get(id)

        return duelRaw ? new Duel(duelRaw, this.guild) : null
    }
    
    generateNewRound (duel, offenderId) {
        const headsOrTails  = [0, 1][Math.floor(Math.random() * 2)] // 0 = victory for offender, 1 = defeat for offender
        const type          = this._getRandomRoundType()
        let result          = ''
        let imageURL        = ''
        const tool          = this._getRandomToolOfDestruction(type)
        const offender      = duel.duellists.find(d => d.duellist.id === offenderId)
        const defender      = duel.duellists.find(d => d.duellist.id !== offenderId)
        const statements    = new Statements(this.$t)
        switch (type) {
            case TYPE.WEAPON:
            case TYPE.VEHICLE:
            case TYPE.EXPLOSIVE:
                imageURL    = tool.image
                result      = `${offender.duellist.displayName} ${statements.get(headsOrTails, type, defender.duellist.displayName)} ${this.$t.get(tool.key)}.`
                break 
            case TYPE.SPECIAL:
                let st          = statements.get(headsOrTails, type, defender.duellist.displayName)
                imageURL        = st.match(/<!(.*)>/).pop().replace('<!', '').replace('>', '')
                result          = `${offender.duellist.displayName} ${st.replace(`<!${imageURL}>`, '')}.`
                break     
        }

        return {
            type        : type, 
            winner      : headsOrTails > 0 ? offender.duellist.id : defender.duellist.id,
            statement   : result,
            image       : imageURL 
        }
    }

    newRoundDone (duel, round, bonus = null) {
        let winner = round.winner
        if (bonus) {
            if (bonus.bonus.worksIf === RESULT.DEFEAT) {
                switch (bonus.bonus.effect) {
                    case 1: // makes a tie
                        winner = null
                        break
                    case 2: // transforms a defeat into a victory
                        winner = duel.duellists.find(d => d.duellist.id !== round.winner).duellist.id
                        break
                    default:
                        break
                }
            }
            
            duel.removeBonus(bonus.bonus)
        }

        duel.count.rounds += 1
        if (winner)
            duel.count.roundWinners.push(winner)

        this.update(duel)

        return {
            winner,
            duel
        }
    }

    update (args) {
        const currentDuel = this.getById(args.id)

        if (!currentDuel)
            return false 
        
        args.updatedAt = new Date() 

        let queryStr = 'UPDATE duels SET '
        for (let k in args._serialize()) if (currentDuel.hasOwnProperty(k) && k !== 'id') 
            queryStr += `${k}=@${k},`
        queryStr = `${queryStr.substring(0, queryStr.length - 1)} WHERE id=@id`

        return this.db.prepare(queryStr).run(args._serialize())
    }

    _getRandomRoundType () {
        const randomKey = Object.keys(TYPE)[Math.floor(Math.random() * Object.keys(TYPE).length)]
        return TYPE[randomKey]
    }

    _getRandomToolOfDestruction (type) {
        return toolsOfDestruction[type][Math.floor(Math.random() *  toolsOfDestruction[type].length)]
    }
}

module.exports = DuelManager