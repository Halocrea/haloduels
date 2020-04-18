require('dotenv').config()

const DuelCommands      = require('./../commands/DuelCommands')
const generateEmbed     = require('./../utils/generateEmbed')
const I18N              = require('./../utils/I18N')

class CommandManager {
    constructor (client, guild) {
        this.client             = client
        this.$t                 = new I18N(guild.locale)
        this.duelCommands       = new DuelCommands(guild, this.$t)
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
                this.duelCommands.attack(message)
                break 
            case this.$t.get('cmdClose'):
                this.duelCommands.close(message, args)
                break
            case this.$t.get('cmdLeaderboard'):
                this.duelCommands.listDuellists(message)
                break
            case this.$t.get('cmdNickname'): 
                this.duelCommands.nickname(message, args)
                break 
            case this.$t.get('cmdRetire'): 
                this.duelCommands.retire(message)
                break 
            case this.$t.get('cmdQuit'): 
                this.duelCommands.rageQuit(message)
                break
            case this.$t.get('cmdStats'):
                this.duelCommands.getStatsForUser(message)
                break 
            default: 
                if (message.channel.id === this.duelGuild.mainChanId) {
                    const defender = message.mentions.members.first() 
                    if (defender) 
                        this.duelCommands.challenge(message, args)
                    else {
                        if (this.duelGuild.rulesChanId) {
                            const rulesChannel = await message.client.channels.fetch(this.duelGuild.rulesChanId)
                            message.channel.send(this.$t.get('errorCommandNotFoundRuleChan', { rulesChannel }))
                        } else 
                            message.channel.send(this.$t.get('errorCommandNotFound'))
                    }
                } else {
                    const duel = this.duelCommands.getDuelById(message.channel.id)
                    if (duel && duel.duellists.some(d => d.duellist.id === message.author.id)) 
                        this.duelCommands.attack(message)
                    else {
                        if (this.duelGuild.rulesChanId) {
                            const rulesChannel = await message.client.channels.fetch(this.duelGuild.rulesChanId)
                            message.channel.send(this.$t.get('errorCommandNotFoundRuleChan', { rulesChannel }))
                        } else 
                            message.channel.send(this.$t.get('errorCommandNotFound'))
                    }
                }
                break
        }
    }

    help (message) {
        const commands = Object.keys(this.$t.translations)
            .filter(key => key.startsWith('cmd'))
            .reduce((obj, key) => {
                obj[key] = this.$t.translations[key]
                return obj
            }, {})
        
        message.channel.send(generateEmbed({
            color       : '#43b581',
            description : this.$t.get('helpText', Object.assign({
                prefix          : this.duelGuild.prefix,
                discordInvite   : 'https://discord.gg/74UAq84'
            }, commands)),
            footer      : 'made with ♥️ by Halo Création',
            thumbnail   : 'https://i.imgur.com/JdNIPOk.png',
            title       : this.$t.get('helpTitle')
        }))
    }

    resetDailyGiftsForAll () {
        this.duelCommands.resetDailyGiftsForAll()
    }
}

module.exports = CommandManager