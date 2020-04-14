const bonuses           = require('../objects/bonuses')
const DuellistManager   = require ('../classes/DuellistManager')
const { RESULT, STATUS }= require('../objects/DUEL_ENUMS')

class Duel {
    constructor (args) {
        this.id         = args.id // channelId
        this.name       = args.name 
        
        this.startedAt  = args.startedAt || new Date()
        this.hasEnded   = args.hasEnded || false
        this.busy       = args.busy || false
        this.count      = args.count || {
            rounds      : 0,
            roundWinners: []
        }
        this.duellists  = [] 
        const duellistManager = new DuellistManager()
        args.duellists.forEach(d => {
            if (typeof d.duellist === 'string') {
                this.duellists.push({ color: d.color, duellist: duellistManager.getById(d.duellist) }) 
            } else {
                d.duellist.status  = STATUS.FIGHTING
                const duellist = duellistManager.update(d.duellist)
                this.duellists.push({ color: d.color, duellist: duellist })
            }
        })
        this.bonuses    = args.bonuses || this.setFate()
        duellistManager.flush()
    }

    removeBonus (bonus) {
        const index = this.bonuses.findIndex(b => b.id === bonus.id)
        if (index) 
            this.bonuses.splice(index, 1)
    }

    setFate () {
        const gifts = []
        const noTauntBonuses = bonuses.filter(b => b.worksIf === RESULT.DEFEAT)
        for (let i = 0; i < this.duellists.length; i++) 
            gifts.push({
                receiverId  : this.duellists[i].duellist.id,
                donorName   : 'la chance',
                bonus       : Object.assign({ id: Math.random().toString(16).slice(2) }, noTauntBonuses[Math.floor(Math.random() * noTauntBonuses.length)])
            })

        return gifts
    }

    _serialize () {
        const duel = {
            id          : this.id, 
            name        : this.name, 
            duellists   : [], 
            bonuses     : this.bonuses, 
            startedAt   : this.startedAt, 
            hasEnded    : this.hasEnded, 
            count       : this.count,
            busy        : this.busy
        }
        this.duellists.forEach(d => duel.duellists.push({ color: d.color, duellist: d.duellist.id }))

        return duel
    }
}

module.exports = Duel