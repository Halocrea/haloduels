const bonuses               = require('../utils/bonuses')
const I18N                  = require ('../utils/I18N')
const Duellists             = require ('../crud/Duellists')
const { RESULT, STATUS }    = require('../utils/enums.js')

class Duel {
    constructor (args, guild) {
        this.$t         = new I18N(guild.locale || 'en')
        this.id         = args.id // channelId
        this.name       = args.name 
        
        this.startedAt  = args.startedAt ? new Date(args.startedAt) : new Date()
        this.updatedAt  = args.updatedAt ? new Date(args.updatedAt) : new Date()
        this.hasEnded   = !!args.hasEnded
        this.busy       = !!args.busy

        if (args.count) {
            if (typeof args.count === 'string') 
                this.count = JSON.parse(args.count)
            else 
                this.count = args.count
        } else 
            this.count = { rounds: 0, roundWinners: [] }

        this.duellists      = [] 
        let duellistsRaw    = []
        if (args.duellists) {
            if (typeof args.duellists === 'string') 
                duellistsRaw = JSON.parse(args.duellists)
            else 
                duellistsRaw = args.duellists
        }

        const duellists = new Duellists(guild)
        duellistsRaw.forEach(d => {
            if (typeof d.duellist === 'string') {
                this.duellists.push({ color: d.color, duellist: duellists.getById(d.duellist) }) 
            } else {
                d.duellist.status  = STATUS.FIGHTING
                const duellist = duellists.update(d.duellist)
                this.duellists.push({ color: d.color, duellist: duellist })
            }
        })

        if (args.bonuses) {
            if (typeof args.bonuses === 'string') 
                this.bonuses = JSON.parse(args.bonuses)
            else 
                this.bonuses = args.bonuses
        } else 
            this.bonuses = this.setFate(this.duellists)
    }

    removeBonus (bonus) {
        const index = this.bonuses.findIndex(b => b.bonus.id === bonus.id)
        if (index >= 0) 
            this.bonuses.splice(index, 1)
    }

    setFate (duellists) {
        const gifts = []
        const noTauntBonuses = bonuses.filter(b => b.worksIf === RESULT.DEFEAT)
        for (let i = 0; i < duellists.length; i++) 
            gifts.push({
                receiverId  : duellists[i].duellist.id,
                donorName   : this.$t.get('luck'),
                bonus       : Object.assign({ id: Math.random().toString(16).slice(2) }, noTauntBonuses[Math.floor(Math.random() * noTauntBonuses.length)])
            })

        return gifts
    }

    _serialize () {
        const duellists = []
        this.duellists.forEach(d => duellists.push({ color: d.color, duellist: d.duellist.id }))

        const duel      = {
            bonuses     : JSON.stringify(this.bonuses), 
            busy        : this.busy ? 1 : 0,
            count       : JSON.stringify(this.count), 
            duellists   : JSON.stringify(duellists), 
            hasEnded    : this.hasEnded ? 1 : 0, 
            id          : this.id, 
            name        : this.name, 
            startedAt   : this.startedAt.toISOString(), 
            updatedAt   : this.updatedAt.toISOString()
        }

        return duel
    }
}

module.exports = Duel
