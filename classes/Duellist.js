const fs                = require('fs')
const bonuses           = require('./../objects/bonuses')
const { STATUS }        = require('./../objects/DUEL_ENUMS')

class Duellist {
    constructor (args, tmp = false) {
        this.id             = args.id
        this.displayName    = args.displayName

        this.status = args.status || STATUS.IDLE
        this.stats  = args.stats || {
            defeats     : 0,
            victories   : 0
        }

        this.enroledAt      = args.enroledAt || new Date()
        this.lastDuel       = args.lastDuel || null
        this.dailyGifts     = args.dailyGifts || this.setDailyGifts()
        this.tmp            = args.tmp || tmp
    }

    persist () {
        try {
            const save      = fs.readFileSync('saves/duellists.json', 'utf8')
            const duellists = JSON.parse(save) 
            const index     = duellists.findIndex(d => d.id === this.id)
            
            if (index >= 0) 
                duellists[index] = this._serialize()
            else 
                duellists.push(this._serialize())
            
            fs.writeFileSync('saves/duellists.json', JSON.stringify(duellists), 'utf8')
        } catch (err) {
            console.log(err)
        }
    }

    setDailyGifts () {
        const gifts = []
        for (let i = 0; i < 2; i++) 
            gifts.push(bonuses[Math.floor(Math.random() * bonuses.length)])

        return gifts
    }

    update (args) {
        for (let k in args) {
            if (this.hasOwnProperty(k)) 
                this[k] = args[k]
        }
    }
    
    _serialize () {
        return {
            id          : this.id,
            displayName : this.displayName, 
            status      : this.status, 
            stats       : this.stats, 
            enroledAt   : this.enroledAt,
            lastDuel    : this.lastDuel, 
            dailyGifts  : this.dailyGifts, 
            tmp         : this.tmp
        }
    }
}

module.exports = Duellist