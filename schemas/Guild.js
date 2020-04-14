class Guild {
    constructor (args) {
        this.categoryId     = args.categoryId || ''
        this.id             = args.id 
        this.joinedAt       = args.joinedAt || new Date()
        this.locale         = args.locale || 'en-US'
        this.mainChanId     = args.mainChanId || ''
        this.name           = args.name 
        this.prefix         = args.prefix || '!duel'
        this.rulesChanId    = args.rulesChanId ||''
        this.setupCompleted = !!this.categoryId && !!this.mainChanId && !!args.setupCompleted
        this.superRoles     = args.superRoles || []
    }

    _serialize () {
        return {
            categoryId      : this.categoryId,     
            id              : this.id,             
            joinedAt        : this.joinedAt,       
            locale          : this.locale,         
            mainChanId      : this.mainChanId,     
            name            : this.name,           
            prefix          : this.prefix,         
            rulesChanId     : this.rulesChanId,    
            setupCompleted  : this.setupCompleted,
            superRoles      : this.superRoles
        }
    }
}

module.exports = Duel