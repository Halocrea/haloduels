const fs                = require('fs')
const Duellist          = require ('./Duellist')

class DuellistManager {
    constructor () {
        const save          = fs.readFileSync('saves/duellists.json', 'utf8')
        const duellistsJSON = JSON.parse(save) 
        this.duellists      = []
        for (const i in duellistsJSON)
            this.duellists.push(new Duellist(duellistsJSON[i]))
    }

    add (member) {
        const index     = this.duellists.findIndex(d => d.id === member.id)
        let duellist    = null 
        if (index < 0) {
            duellist = new Duellist(member)
            this.duellists.push(duellist)
        } else 
            throw new Error('Vous vous êtes déjà enrôlé ! Pour prendre votre retraite, tapez `!duel quitter`.') 

        return duellist
    }

    addTmp (member) {
        const index     = this.duellists.findIndex(d => d.id === member.id)
        let duellist    = null 
        if (index < 0) {
            duellist = new Duellist(member, true)
            this.duellists.push(duellist)
        } else 
            throw new Error('Vous vous êtes déjà enrôlé ! Pour prendre votre retraite, tapez `!duel quitter`.') 

        return duellist
    }

    all () {
        return this.duellists
    }

    flush () {
        try {
            const duellistsToSave   = []
            for (let i = 0; i < this.duellists.length; i++) 
                duellistsToSave.push(this.duellists[i]._serialize())
            
            fs.writeFileSync('saves/duellists.json', JSON.stringify(duellistsToSave), 'utf8')
        } catch (err) {
            console.log(err)
        }
    }
    
    getByDisplayName (displayName) {
        return this.duellists.find(d => d.displayName === displayName)
    }

    getById (id) {
        return this.duellists.find(d => d.id === id)
    }

    unset (id) {
        const index     = this.duellists.findIndex(d => d.id === id)
        if (index >= 0) {
            const duellist  = this.duellists[index]
            this.duellists.splice(index, 1)
            return duellist
        } else 
            throw new Error('Mais ! Tu n\'étais pas enrôlé, petit farceur. Tape `!duel s\'enrôler` pour rejoindre la partie.')
    }

    update (args) {
        const index = this.duellists.findIndex(d => d.id === args.id)
        for (let k in args) {
            if (this.duellists[index].hasOwnProperty(k)) 
                this.duellists[index][k] = args[k]
        }

        return this.duellists[index]
    }
}

module.exports = DuellistManager