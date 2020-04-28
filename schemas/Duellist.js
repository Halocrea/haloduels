const bonuses           = require('../utils/bonuses')
const { STATUS }        = require('../utils/enums.js')

class Duellist {
    constructor (args, tmp = false) {
        this.displayName    = args.displayName
        this.enroledAt      = args.enroledAt ? new Date(args.enroledAt) : new Date()
        this.id             = args.id
        this.lastDuel       = args.lastDuel || null
        this.status         = args.status || STATUS.IDLE
        this.tmp            = args.tmp || tmp
        this.updatedAt      = args.updatedAt ? new Date(args.updatedAt) : new Date()

        if (args.dailyGifts) {
            if (typeof args.dailyGifts === 'string') 
                this.dailyGifts = JSON.parse(args.dailyGifts)
            else 
                this.dailyGifts = args.dailyGifts
        } else 
            this.dailyGifts = this.genDailyGifts()
            
        if (args.stats) {
            if (typeof args.stats === 'string') 
                this.stats = JSON.parse(args.stats)
            else 
                this.stats = args.stats
        } else 
            this.stats = { defeats: 0, victories: 0 }
    } 

    genDailyGifts () {
        const gifts = []
        for (let i = 0; i < 2; i++) 
            gifts.push(Object.assign({ id: Math.random().toString(16).slice(2) }, bonuses[Math.floor(Math.random() * bonuses.length)]))

        return gifts
    }

    _serialize () {
        const lastDuel = this.lastDuel ? typeof this.lastDuel === 'string' ? new Date(this.lastDuel) : this.lastDuel : null
        return {
            dailyGifts  : JSON.stringify(this.dailyGifts), 
            displayName : this.displayName, 
            enroledAt   : this.enroledAt.toISOString(),
            id          : this.id,
            lastDuel    : lastDuel ? lastDuel.toISOString() : null, 
            stats       : JSON.stringify(this.stats), 
            status      : this.status, 
            tmp         : this.tmp ? 1 : 0,
            updatedAt   : this.updatedAt ? new Date().toISOString() : this.updatedAt.toISOString()
        }
    }
}

module.exports = Duellist
