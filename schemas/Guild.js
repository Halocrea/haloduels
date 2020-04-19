require('dotenv').config()

class Guild {
    constructor (args) {
        this.categoryId         = args.categoryId || ''
        this.id                 = args.id 
        this.joinedAt           = args.joinedAt || new Date()
        this.lastGiftsRenewal   = args.lastGiftsRenewal ? new Date(args.lastGiftsRenewal) : new Date()
        this.updatedAt          = args.updatedAt ? new Date(args.updatedAt) : new Date()
        this.locale             = args.locale || 'en'
        this.mainChanId         = args.mainChanId || ''
        this.name               = args.name 
        this.prefix             = args.prefix || process.env.PREFIX
        this.rulesChanId        = args.rulesChanId ||''
        this.setupCompleted     = !!this.categoryId && !!this.mainChanId && !!args.setupCompleted
        this.setupStep          = args.setupStep || 1
        this.superRoles         = args.superRoles || []
        this.waitingSetupAnswer = args.waitingSetupAnswer || false 
    }

    getPrefix () {
        return this.prefix
    }

    _serialize () {
        return {
            categoryId      : this.categoryId, 
            id              : this.id, 
            joinedAt        : this.joinedAt, 
            lastGiftsRenewal: this.lastGiftsRenewal, 
            updatedAt       : this.updatedAt,
            locale          : this.locale, 
            mainChanId      : this.mainChanId, 
            name            : this.name, 
            prefix          : this.prefix, 
            rulesChanId     : this.rulesChanId, 
            setupStep       : this.setupStep, 
            setupCompleted  : this.setupCompleted, 
            superRoles      : this.superRoles
        }
    }
}

module.exports = Guild