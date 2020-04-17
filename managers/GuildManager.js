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

        const duelsFile     = fs.openSync(`saves/duels-${guild.id}.json`, 'a') 
        const duellistsFile = fs.openSync(`saves/duellists-${guild.id}.json`, 'a')
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
            const guildsToSave = []
            for (let i = 0; i < this.guilds.length; i++) 
                guildsToSave.push(this.guilds[i]._serialize())
            
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

        if (guildIdx >= 0) 
            this.guilds.splice(guildIdx, 1)

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
    }
}

module.exports = GuildManager