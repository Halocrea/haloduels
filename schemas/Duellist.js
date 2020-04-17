const bonuses           = require('../utils/bonuses')
const { STATUS }        = require('../utils/DUEL_ENUMS')

class Duellist {
    constructor (args, tmp = false) {
        this.dailyGifts     = args.dailyGifts || this.genDailyGifts()
        this.displayName    = args.displayName
        this.enroledAt      = new Date(args.enroledAt) || new Date()
        this.id             = args.id
        this.lastDuel       = args.lastDuel || null
        this.stats          = args.stats || {
            defeats     : 0,
            victories   : 0
        }
        this.status         = args.status || STATUS.IDLE
        this.tmp            = args.tmp || tmp
        this.updatedAt      = new Date(args.updatedAt) || new Date()

    }

    genDailyGifts () {
        const gifts = []
        for (let i = 0; i < 2; i++) 
            gifts.push(Object.assign({ id: Math.random().toString(16).slice(2) }, bonuses[Math.floor(Math.random() * bonuses.length)]))

        return gifts
    }

    _serialize () {
        return {
            dailyGifts  : this.dailyGifts, 
            displayName : this.displayName, 
            enroledAt   : this.enroledAt,
            id          : this.id,
            lastDuel    : this.lastDuel, 
            stats       : this.stats, 
            status      : this.status, 
            tmp         : this.tmp,
            updatedAt   : this.updatedAt
        }
    }
}

module.exports = Duellist