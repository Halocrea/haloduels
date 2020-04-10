require('dotenv').config()

const fs                        = require('fs')
const statements                = require('./../objects/statements')
const toolsOfDestruction        = require('./../objects/toolsOfDestruction')
const { TYPE, STATUS, RESULT }  = require('./../objects/DUEL_ENUMS')
const Duel                      = require('./Duel') 

class DuelManager {
    constructor () {
        const save      = fs.readFileSync('saves/duels.json', 'utf8')
        const duelsJSON = JSON.parse(save) 
        this.duels      = []
        for (const i in duelsJSON) if (!duelsJSON[i].hasEnded)
            this.duels.push(new Duel(duelsJSON[i]))
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
            ]
        })
        this.duels.push(duel)

        return duel
    }

    endDuel (duel) {
        const index = this.duels.findIndex(d => d.id === duel.id)
        if (index < 0) 
            return 
        
        try {
            // const save      = fs.readFileSync('saves/archives-duels.json', 'utf8')
            // const duelsJSON = JSON.parse(save) 
            // duelsJSON.push(this.duels[index])
            // fs.writeFileSync('saves/archives-duels.json', JSON.stringify(duelsJSON), 'utf8')
            this.duels.splice(index, 1)
        } catch (error) {
            throw new Error('Je n\'ai pas pu archiver le duel')
        }
    }

    flush () {
        try {
            const duelsToSave = []
            for (let i = 0; i < this.duels.length; i++) 
                duelsToSave.push(this.duels[i]._serialize())
            
            fs.writeFileSync('saves/duels.json', JSON.stringify(duelsToSave), 'utf8')
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
        
        switch (type) {
            case TYPE.WEAPON:
            case TYPE.VEHICLE:
            case TYPE.EXPLOSIVE:
                imageURL    = tool.image
                result      = `${offender.duellist.displayName} ${statements[headsOrTails][type]().replace('{opponent}', defender.duellist.displayName)} ${tool.description}.`
                break 
            case TYPE.SPECIAL:
                let statement   = statements[headsOrTails][type]()
                imageURL        = statement.match(/<!(.*)>/).pop().replace('<!', '').replace('>', '')
                result          = `${offender.duellist.displayName} ${statement.replace(`<!${imageURL}>`, '').replace('{opponent}', defender.duellist.displayName)}.`
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
            const bonusIdx = duel.bonuses.findIndex(b => b === bonus)
            if (bonusIdx)
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