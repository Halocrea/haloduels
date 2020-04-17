require('dotenv').config()

const fs                    = require('fs')
const Statements            = require('../utils/Statements')
const toolsOfDestruction    = require('./../utils/toolsOfDestruction')
const { TYPE, RESULT }      = require('./../utils/DUEL_ENUMS')
const Duel                  = require('./../schemas/Duel') 

class DuelManager {
    constructor (guild, translations) {
        this.guild      = guild
        this.filePath   = `saves/duels-${guild.id}.json`
        this.duels      = []
        this.$t         = translations
        const save      = fs.readFileSync(this.filePath, 'utf8')
        const duelsJSON = JSON.parse(save) 
        
        for (const i in duelsJSON) if (!duelsJSON[i].hasEnded)
            this.duels.push(new Duel(duelsJSON[i], guild))
    }

    all () {
        return this.duels
    }

    create (channel, offender, defender) {
        const duel = new Duel({
            id          : channel.id,
            name        : channel.name,
            duellists   : [
                { color: 'red', duellist: offender },
                { color: 'blue', duellist: defender }
            ],
            busy        : true
        }, this.guild)
        this.duels.push(duel)

        return duel
    }

    endDuel (duel) {
        const index = this.duels.findIndex(d => d.id === duel.id)
        if (index < 0) 
            return 
        
        this.duels.splice(index, 1)
    }

    flush () {
        try {
            const duelsToSave = []
            for (let i = 0; i < this.duels.length; i++) 
                duelsToSave.push(this.duels[i]._serialize())
            
            fs.writeFileSync(this.filePath, JSON.stringify(duelsToSave), 'utf8')
        } catch (err) {
            console.log(err)
        }
    }

    getById(id) {
        return this.duels.find(d => d.id === id)
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
            
            const bonusIdx = duel.bonuses.findIndex(b => b.id === bonus.id)
            
            if (bonusIdx >= 0) 
                duel.bonuses.splice(bonusIdx, 1)
        }

        duel.count.rounds += 1
        if (winner)
            duel.count.roundWinners.push(winner)

        this.update(duel)
        this.flush()

        return {
            winner,
            duel
        }
    }

    update (args) {
        const index = this.duels.findIndex(d => d.id === args.id)
        if (index < 0)
            return
        
        for (let k in args) {
            if (this.duels[index].hasOwnProperty(k)) 
                this.duels[index][k] = args[k]
        }
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