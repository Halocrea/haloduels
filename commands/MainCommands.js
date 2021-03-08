require('dotenv').config()

const DuelManager       = require('../managers/DuelManager')
const SuperUserManager  = require('../managers/SuperUserManager')
const generateEmbed     = require('../utils/generateEmbed')
const I18N              = require('../utils/I18N')

class MainCommands {
    constructor (client, guild) {
        this.client             = client
        this.$t                 = new I18N(guild.locale)
        this.duelManager        = new DuelManager(guild, this.$t)
        this.superUserManager   = new SuperUserManager(guild, this.$t)
        this.discordGuild       = client.guilds.resolve(guild.id)
        this.duelGuild          = guild
    }

    async handle (message) {
        const cmdAndArgs = message.content.replace(this.duelGuild.prefix, '').trim().split(' ')
        const cmd        = cmdAndArgs[0]
        let args         = ''
        
        for (let i = 1; i < cmdAndArgs.length; i++) 
            args += cmdAndArgs[i] + ' '

        args.trim()

        switch (cmd) {
            case this.$t.get('cmdHelp'): 
                this.help(message)
                break 
            case this.$t.get('cmdAttack'):
                this.duelManager.attack(message)
                break 
            case this.$t.get('cmdClose'):
                this.superUserManager.close(message, args)
                break
            case this.$t.get('cmdInvite'):
                this.inviteBot(message)
                break
            case this.$t.get('cmdLeaderboard'):
                this.duelManager.listDuellists(message)
                break
            case this.$t.get('cmdNickname'): 
                this.duelManager.nickname(message, args)
                break 
            case this.$t.get('cmdPrefix'): 
                this.superUserManager.prefix(message, args)
                break 
            case this.$t.get('cmdRetire'): 
                this.duelManager.retire(message)
                break 
            case this.$t.get('cmdQuit'): 
                this.duelManager.rageQuit(message)
                break
            case this.$t.get('cmdStats'):
                this.duelManager.getStatsForUser(message)
                break 
            case this.$t.get('cmdSuperRole'): 
                this.superUserManager.addSuperRole(message)
                break
            case this.$t.get('cmdUninstall'):
                this.superUserManager.uninstall(message)
                break
            default: 
                if (message.channel.id === this.duelGuild.mainChanId) {
                    const defender = message.mentions.members.first() 
                    if (defender) 
                        this.duelManager.challenge(message, args)
                    else {
                        if (this.duelGuild.rulesChanId) {
                            const rulesChannel = await message.client.channels.fetch(this.duelGuild.rulesChanId)
                            message.channel.send(this.$t.get('errorCommandNotFoundRuleChan', { rulesChannel }))
                        } else 
                            message.channel.send(this.$t.get('errorCommandNotFound', { prefix: this.duelGuild.prefix, cmdHelp: this.$t.get('cmdHelp') }))
                    }
                } else {
                    const duel = this.duelManager.getDuelById(message.channel.id)
                    if (duel && duel.duellists.some(d => d.duellist.id === message.author.id)) 
                        this.duelManager.attack(message)
                    else {
                        if (this.duelGuild.rulesChanId) {
                            const rulesChannel = await message.client.channels.fetch(this.duelGuild.rulesChanId)
                            message.channel.send(this.$t.get('errorCommandNotFoundRuleChan', { rulesChannel }))
                        } else 
                            message.channel.send(this.$t.get('errorCommandNotFound', { prefix: this.duelGuild.prefix, cmdHelp: this.$t.get('cmdHelp') }))
                    }
                }
                break
        }
    }

    async help (message) {
        const commands = Object.keys(this.$t.translations)
            .filter(key => key.startsWith('cmd'))
            .reduce((obj, key) => {
                obj[key] = this.$t.translations[key]
                return obj
            }, {})

        let description = ''
        if (this.duelGuild.rulesChanId) {
            const rulesChannel = await message.client.channels.fetch(this.duelGuild.rulesChanId)
            description = `${this.$t.get('howToPlayDescRulesChan', { rulesChannel })}\n`
        }

        description += this.$t.get('helpText', Object.assign({
                prefix          : this.duelGuild.prefix,
                discordInvite   : 'https://discord.gg/74UAq84'
            }, commands))

        message.channel.send(generateEmbed({
            color       : '#43b581',
            description, 
            footer      : 'made with ♥️ by Halo Création',
            thumbnail   : 'https://i.imgur.com/JdNIPOk.png',
            title       : this.$t.get('helpTitle')
        }))
    }

    inviteBot (message) {
        message.channel.send(this.$t.get('inviteCmdText', { link : `https://discordapp.com/oauth2/authorize?client_id=${message.client.user.id}&scope=bot&permissions=8` }))
    }

    resetDailyGiftsForAll (message) {
        this.duelManager.resetDailyGiftsForAll(message)
    }
}

module.exports = MainCommands
