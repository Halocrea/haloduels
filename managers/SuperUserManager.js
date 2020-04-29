const Duellists     = require('../crud/Duellists')
const Duels         = require('../crud/Duels')
const generateEmbed = require('../utils/generateEmbed')
const Guilds        = require('../crud/Guilds')
const { STATUS }    = require('../utils/enums.js') 

class SuperUserManager {
    constructor (duelGuild, translations) { 
        this.guilds     = new Guilds() 
        this.duels      = new Duels(duelGuild, translations) 
        this.duellists  = new Duellists(duelGuild, translations) 
        this.duelGuild  = duelGuild 
        this.$t         = translations
    }

    async addSuperRole (message) {
        const canDoThis = await this._checkAuthorization(message)
        if (!canDoThis)
            return 

        if (!message.mentions) {
            message.channel.send(generateEmbed({
                color       : '#ff0000',
                description : this.$t.get('errorCommandNotFound'),
                title       : this.$t.get('errorGeneric')
            }))
        }
        const usersAdded = []
        const rolesAdded = []
        if (message.mentions.members && message.mentions.members.size > 0) {
            // try to get users from mention and save them
            message.mentions.members.forEach(m => {
                const indexIfAlreadyAdded = this.duelGuild.superRoles.indexOf(m.id)
                if (indexIfAlreadyAdded < 0) {
                    this.duelGuild.superRoles.push(m.id)
                    usersAdded.push(m.displayName)
                }
            })
        }

        if (message.mentions.roles && message.mentions.roles.size > 0) {
            // try to get users from mention and save them
            message.mentions.roles.forEach(r => {
                const indexIfAlreadyAdded = this.duelGuild.superRoles.indexOf(r.id)
                if (indexIfAlreadyAdded < 0) {
                    this.duelGuild.superRoles.push(r.id)
                    rolesAdded.push(r.name)
                }
            })
        }
        
        this.guilds.update(this.duelGuild)

        message.channel.send(generateEmbed({
            color       : '#43b581',
            description : this.$t.get('successfullyAddedSuperRoles', { list: [...usersAdded, ...rolesAdded].join(', ') }),
            title       : this.$t.get('success')
        }))
    }

    async close (message, arg) {
        const canDoThis     = await this._checkAuthorization(message)
        if (!canDoThis)
            return 
        
        const discordGuild      = message.guild
        const channelId         = arg.replace('<#', '').replace('>', '').trim()
        const channelToClose    = !channelId ? message.channel : await discordGuild.channels.resolve(channelId)

        if (!channelToClose)
            return message.channel.send(this.$t.get('errorCantFindChannelDesc'))

        const duel = this.duels.getById(channelToClose.id)
        if (!duel)
            return message.channel.send(this.$t.get('errorCantDeleteThisChannel'))

        const playerNames = []
        duel.duellists.forEach(d => {
            playerNames.push(d.duellist.displayName)
            d.duellist.status = STATUS.IDLE
            this.duellists.update(d.duellist)
        })
        
        duel.hasEnded = true 
        this.duels.update(duel)
        
        channelToClose.delete()
            .then(async () => {
                const mainChannel = await message.client.channels.fetch(this.duelGuild.mainChanId)
                mainChannel.send(this.$t.get('challengeCanceled', { player1: playerNames[0], player2: playerNames[1] }))
                this.duels.endDuel(duel)
            })
            .catch(process.dLogger.log)
    }

    async prefix (message, arg) {
        const canDoThis = await this._checkAuthorization(message)
        if (!canDoThis)
            return 

        const strippedContent = arg.replace(/#| |@|`/g, '')
        if (strippedContent.length < 1) {
            return message.channel.send(generateEmbed({
                color       : '#ff0000',
                description : this.$t.get('setupDefinePrefix'), 
                title       : this.$t.get('errorInvalidPrefix')
            }))
        }
        this.duelGuild.prefix               = strippedContent
        this.duelGuild.waitingSetupAnswer   = false
        this.duelGuild.setupStep            = 3
        this.guilds.update(this.duelGuild)
        
        message.channel.send(generateEmbed({
            color       : '#43b581', 
            title       : this.$t.get('setupPrefixSuccess', { prefix: this.duelGuild.prefix })
        }))
    }

    async uninstall (message) {
        const canDoThis = await this._checkAuthorization(message)
        if (!canDoThis)
            return 
            
        const confirm   = '✅'
        const cancel    = '❎'
        const msg = await message.channel.send(generateEmbed({
            description : this.$t.get('confirmUninstall', { confirm, cancel }), 
            title       : this.$t.get('confirmUninstallTitle')
        }))
        msg.react(confirm)
        msg.react(cancel)
        const filter = (reaction, user) => {
            const firstCheck = [confirm, cancel].includes(reaction.emoji.name)
            if (!firstCheck)
                return false 

            return user.id === message.author.id
        }
        msg.awaitReactions(filter, { 
                max     : 1, 
                time    : (5 * 60000), 
                errors  : ['time'] 
            }
        )
            .then(collected => {
                const reaction  = collected.first()

                if (reaction.emoji.name === confirm) {
                    message.channel.send('See you, space cowboy!')
                        .then(() => {
                            this.guilds.remove(this.duelGuild.id)
                            message.guild.leave()
                        })

                } else
                    message.channel.send(this.$t.get('goodCancel'))

                
            })
            .catch(process.dLogger.log)
    }

    async _checkAuthorization (message) {
        const discordGuild  = message.guild
        const member        = await discordGuild.members.fetch(message.author)
        if (!member.roles.cache.some(r => this.duelGuild.superRoles.includes(r.id)) && !this.duelGuild.superRoles.includes(member.id) && !member.hasPermission('ADMINISTRATOR')) {
            message.channel.send(this.$t.get('errorNotAllowed', { prefix: this.duelGuild.prefix, cmdQuit: this.$t.get('cmdQuit') }))
            return false
        }
        
        return true
    }
}
module.exports = SuperUserManager
