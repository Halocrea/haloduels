const fs                        = require('fs')
const Guild                     = require('../schemas/Guild') 

class GuildManager {
    constructor () {
        const save          = fs.readFileSync('saves/guilds.json', 'utf8')
        const guildsJSON    = JSON.parse(save) 
        this.guilds         = []
        for (const i in guildsJSON) 
            this.guilds.push(new Guild(guildsJSON[i]))
    }

    addOrOverwrite (guild) {
        const checkIndex = this.guilds.findIndex(g => g.id === guild.id)
        if (checkIndex >= 0)
            this.guilds[checkIndex] = guild
        else 
            this.guilds.push(guild)

        const duelsFile     = fs.openSync(`saves/duels-${guild.id}.json`, 'w') 
        const duellistsFile = fs.openSync(`saves/duellists-${guild.id}.json`, 'w')
        fs.writeFileSync(`saves/duels-${guild.id}.json`, '[]', 'utf8')
        fs.writeFileSync(`saves/duellists-${guild.id}.json`, '[]', 'utf8')
        fs.closeSync(duelsFile)
        fs.closeSync(duellistsFile)
        return guild
    }

    all () {
        return this.guilds
    }

    flush () {
        try {
            const save          = fs.readFileSync('saves/guilds.json', 'utf8')
            const guildsJSON    = JSON.parse(save) 
            let guildsToSave    = []
            for (let i = 0; i < this.guilds.length; i++) {
                const inSaveGuildIndex = guildsJSON.findIndex(g => g.id === this.guilds[i].id)
                if ((inSaveGuildIndex >= 0 && new Date(guildsJSON[inSaveGuildIndex].updatedAt) < this.guilds[i].updatedAt) ||
                    inSaveGuildIndex < 0
                )
                    guildsToSave.push(this.guilds[i]._serialize())
                else 
                    guildsToSave.push(guildsJSON[inSaveGuildIndex])
            }

            guildsToSave = [...guildsToSave, ...guildsJSON.filter(d => guildsToSave.findIndex(f => f.id === d.id) < 0)]
            fs.writeFileSync('saves/guilds.json', JSON.stringify(guildsToSave), 'utf8')
        } catch (err) {
            console.log(err)
        }
    }

    getById (id) {
        return this.guilds.find(g => g.id === id)
    }

    remove (id) {
        const guildIdx = this.guilds.findIndex(g => g.id === id)

        if (guildIdx >= 0) {
            this.guilds.splice(guildIdx, 1)
            try {
                fs.unlinkSync(`saves/duels-${id}.json`)
                fs.unlinkSync(`saves/duellists-${id}.json`)
                const save              = fs.readFileSync('saves/guilds.json', 'utf8')
                const guildsJSON        = JSON.parse(save) 
                const inSaveGuildIndex  = guildsJSON.findIndex(g => g.id === id)
                if (inSaveGuildIndex >= 0) {
                    guildsJSON.splice (inSaveGuildIndex, 1)
                    fs.writeFileSync('saves/guilds.json', JSON.stringify(guildsJSON), 'utf8')
                }
            } catch (err) {
                console.log(err)
            }
        }
        return guildIdx >= 0
    }

    update (args) {
        const index = this.guilds.findIndex(g => g.id === args.id)
        if (index < 0)
            return
        
        for (let k in args) {
            if (this.guilds[index].hasOwnProperty(k)) 
                this.guilds[index][k] = args[k]
        }

        this.guilds[index].updatedAt = new Date()
    }
}

module.exports = GuildManager