const bonuses           = require('../utils/bonuses')
const I18N              = require ('../utils/I18N')
const DuellistManager   = require ('../managers/DuellistManager')
const { RESULT, STATUS }= require('../utils/DUEL_ENUMS')

class Duel {
    constructor (args, guild) {
        this.$t         = new I18N(guild.locale || 'en')
        this.id         = args.id // channelId
        this.name       = args.name 
        
        this.startedAt  = new Date(args.startedAt) || new Date()
        this.updatedAt  = new Date(args.updatedAt) || new Date()
        this.hasEnded   = args.hasEnded || false
        this.busy       = args.busy || false
        this.count      = args.count || {
            rounds      : 0,
            roundWinners: []
        }
        this.duellists  = [] 
        const duellistManager = new DuellistManager(guild)
        args.duellists.forEach(d => {
            if (typeof d.duellist === 'string') {
                this.duellists.push({ color: d.color, duellist: duellistManager.getById(d.duellist) }) 
            } else {
                d.duellist.status  = STATUS.FIGHTING
                const duellist = duellistManager.update(d.duellist)
                this.duellists.push({ color: d.color, duellist: duellist })
            }
        })
        this.bonuses = args.bonuses || this.setFate()
        duellistManager.flush()
    }

    removeBonus (bonus) {
        const index = this.bonuses.findIndex(b => b.bonus.id === bonus.id)
        if (index >= 0) 
            this.bonuses.splice(index, 1)
    }

    setFate () {
        const gifts = []
        const noTauntBonuses = bonuses.filter(b => b.worksIf === RESULT.DEFEAT)
        for (let i = 0; i < this.duellists.length; i++) 
            gifts.push({
                receiverId  : this.duellists[i].duellist.id,
                donorName   : this.$t.get('luck'),
                bonus       : Object.assign({ id: Math.random().toString(16).slice(2) }, noTauntBonuses[Math.floor(Math.random() * noTauntBonuses.length)])
            })

        return gifts
    }

    _serialize () {
        const duel = {
            bonuses     : this.bonuses, 
            busy        : this.busy,
            count       : this.count, 
            duellists   : [], 
            hasEnded    : this.hasEnded, 
            id          : this.id, 
            name        : this.name, 
            startedAt   : this.startedAt, 
            updatedAt   : this.updatedAt
        }
        this.duellists.forEach(d => duel.duellists.push({ color: d.color, duellist: d.duellist.id }))

        return duel
    }
}

module.exports = Duel