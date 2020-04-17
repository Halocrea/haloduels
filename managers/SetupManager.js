const generateEmbed = require('./../utils/generateEmbed')
const Guild         = require('./../schemas/Guild')
const I18N          = require('./../utils/I18N')

class SetupManager {
    constructor (guildManager) {
        this.guildManager = guildManager
    }

    handle (message, guild = null) {
        this.guild  = guild || new Guild({
            id  : message.guild.id, 
            name: message.guild.name 
        })
        this.$t     = new I18N(this.guild.locale)

        switch (this.guild.setupStep) {
            case 1: // language
                this._step1(message)
                break 
            case 2: // prefix
                this._step2(message)
                break 
            case 3: // type of setup
                this._step3(message)
                break 
            case 4: // if manual setup, root category ID
                this._step4(message)
                break 
            case 5: // if manual setup, rules channel ID (can be skipped)
                this._step5(message)
                break 
            case 6: // if manual setup, main channel ID 
                this._step6(message)
                break 
        } 
    }

    handleAnswer (message, duelGuild) {
        this.guild  = duelGuild 
        this.$t     = new I18N(this.guild.locale)
        switch (this.guild.setupStep) {
            case 2:
                this._answerStep2(message)
                break
            case 4: 
                this._answerStep4(message)
                break 
            case 5: 
                this._answerStep5(message)
                break 
            case 6: 
                this._answerStep6(message)
                break 
            default: 
                message.channel.send(this.$t.get('errorCommandNotFound', { prefix: this.guild.prefix, cmdHelp: this.$t.get('cmdHelp') }))
        }
    }

    _answerStep2 (message) {
        const strippedContent = message.content.replace(/#| |@|`/g, '')
        if (strippedContent.length < 1) {
            return message.channel.send(generateEmbed({
                color       : '#ff0000',
                description : this.$t.get('setupDefinePrefix'), 
                title       : this.$t.get('errorInvalidPrefix')
            }))
        }
        this.guild.prefix               = strippedContent
        this.guild.waitingSetupAnswer   = false
        this.guild.setupStep            = 3
        this.guildManager.update(this.guild)
        this.guildManager.flush()
        message.channel.send(generateEmbed({
            color       : '#43b581', 
            title       : this.$t.get('setupPrefixSuccess', { prefix: this.guild.prefix })
        }))
            .then(() => this._step3(message))
    }

    async _answerStep4 (message) {
        let category = null

        try {
            category = await message.client.channels.fetch(message.content.trim())
        } catch (error) {
            return message.channel.send(generateEmbed({
                color       : '#ff0000',
                description : this.$t.get('errorCantFindCategoryDesc'),
                title       : this.$t.get('errorCantFindCategory')
            }))
        }

        if (!category) {
            return message.channel.send(generateEmbed({
                color       : '#ff0000',
                description : this.$t.get('errorCantFindCategoryDesc'),
                title       : this.$t.get('errorCantFindCategory')
            }))
        }

        if (category.type !== 'category') {
            return message.channel.send(generateEmbed({
                color       : '#ff0000',
                description : this.$t.get('errorNotACategoryDesc'),
                title       : this.$t.get('errorNotACategory')
            }))
        }

        this.guild.categoryId           = category.id 
        this.guild.waitingSetupAnswer   = false 
        this.guild.setupStep            = 5
        this.guildManager.update(this.guild)
        this.guildManager.flush()
        await message.channel.send('OK!')
        this._step5(message)
    }
    
    async _answerStep5 (message) {
        if (message.content.trim().toLowerCase() !== 'none') {
            const channel = await this._fetchChannelFromMessage(message)
            
            if (!channel) {
                return message.channel.send(generateEmbed({
                    color       : '#ff0000',
                    description : this.$t.get('errorCantFindChannelDesc'),
                    title       : this.$t.get('errorCantFindChannel')
                }))
            }
            this.guild.rulesChanId = channel.id
        }
        this.guild.waitingSetupAnswer   = false 
        this.guild.setupStep            = 6
        this.guildManager.update(this.guild)
        this.guildManager.flush()
        await message.channel.send('OK!')
        this._step6(message)
    }

    async _answerStep6 (message) {
        const channel = await this._fetchChannelFromMessage(message)
        
        if (!channel) {
            return message.channel.send(generateEmbed({
                color       : '#ff0000',
                description : this.$t.get('errorCantFindChannelDesc'),
                title       : this.$t.get('errorCantFindChannel')
            }))
        }
        this.guild.mainChanId           = channel.id
        this.guild.waitingSetupAnswer   = false 
        this.guildManager.update(this.guild)
        this.guildManager.flush()
        await message.channel.send('OK!')

        const successEmbed = generateEmbed({
            color       : '#43b581', 
            description : this.$t.get('setupAutoCompletedDesc', { prefix: this.guild.prefix }),
            title       : this.$t.get('setupAutoCompleted')
        })
        
        if (this.guild.rulesChanId) {
            const sendingRules = await message.channel.send(generateEmbed({
                description : this.$t.get('setupAutoStep4'),
                title       : this.$t.get('setupPostingRules'),
                thumbnail   : 'https://i.imgur.com/vLTtGRJ.gif'
            }))
            const rulesChannel = await message.client.channels.fetch(this.guild.rulesChanId)
            const rules        = await this._postRules(rulesChannel, channel, this.guild.prefix)
            sendingRules.delete()
                .then(() => {
                    this.guild.setupCompleted = true
                    this.guildManager.update(this.guild)
                    this.guildManager.flush()
                    message.channel.send(successEmbed)
                })
        } else {
            this.guild.setupCompleted = true
            this.guildManager.update(this.guild)
            this.guildManager.flush()
            message.channel.send(successEmbed)
        }
    }

    async _autoSetup (message) {
        let loadingMsg  = null
        let category    = null
        let mainChan    = null 
        let rulesChan   = null
        try {
            loadingMsg              = await message.channel.send(generateEmbed({
                title       : this.$t.get('setupAutoInProgress', { step: '0%' }), 
                description : this.$t.get('setupAutoStep1'),
                thumbnail   : 'https://i.imgur.com/vLTtGRJ.gif'
            }))
            category                = await message.guild.channels.create(this.$t.get('categoryTitle'), { type: 'category' })
            this.guild.categoryId   = category.id
            loadingMsg              = await loadingMsg.edit(generateEmbed({
                title       : this.$t.get('setupAutoInProgress', { step: '25%' }), 
                description : this.$t.get('setupAutoStep2'),
                thumbnail   : 'https://i.imgur.com/vLTtGRJ.gif'
            }))
            rulesChan               = await message.guild.channels.create(this.$t.get('rulesChanTitle'), { 
                parent              : category,
                topic               : this.$t.get('rulesChanTopic'),
                permissionOverwrites: [
                    {
                        id      : this.guild.id,
                        allow   : ['VIEW_CHANNEL', 'READ_MESSAGE_HISTORY'], 
                        deny    : ['SEND_MESSAGES', 'SEND_TTS_MESSAGES', 'MANAGE_MESSAGES']
                    },
                    {
                        id      : message.client.user.id,
                        allow   : ['SEND_MESSAGES', 'MANAGE_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY'] 
                    }
                ]
            })
            
            this.guild.rulesChanId = rulesChan.id
            loadingMsg              = await loadingMsg.edit(generateEmbed({
                title       : this.$t.get('setupAutoInProgress', { step: '50%' }), 
                description : this.$t.get('setupAutoStep3'),
                thumbnail   : 'https://i.imgur.com/vLTtGRJ.gif'
            }))
            mainChan                = await message.guild.channels.create(this.$t.get('mainChanTitle'), {
                parent              : category,
                topic               : this.$t.get('mainChanTopic')
            })
            this.guild.mainChanId  = mainChan.id
            loadingMsg.edit(generateEmbed({
                description : this.$t.get('setupAutoStep4'),
                title       : this.$t.get('setupAutoInProgress', { step: '75%' }), 
                thumbnail   : 'https://i.imgur.com/vLTtGRJ.gif'
            }))
            await this._postRules(rulesChan, mainChan, this.guild.prefix)
            this.guild.setupCompleted = true 
            this.guildManager.update(this.guild)
            this.guildManager.flush()
            loadingMsg.delete()
                .then(() => {
                    message.channel.send(generateEmbed({
                        color       : '#43b581', 
                        description : this.$t.get('setupAutoCompletedDesc', { prefix: this.guild.prefix }),
                        title       : this.$t.get('setupAutoCompleted')
                    }))
                })
        } catch (error) {
            console.log(error)
            const errorEmbed = generateEmbed({
                title       : this.$t.get('errorGeneric'),
                color       : '#ff0000',
                description : `${this.$t.get('errorSetupAuto')}\n\n **Error:** ${error.message}`
            })
            if (loadingMsg)
                loadingMsg.edit(errorEmbed).catch(console.log)
            else 
                message.channel.send(errorEmbed).catch(console.log)
            
            if (category)
                category.delete().catch(console.log)
            
            if (mainChan)
                mainChan.delete().catch(console.log)

            if (rulesChan)
                rulesChan.delete().catch(console.log)

            return false
        }

        return true
    }

    async _fetchChannelFromMessage(message) {
        const targetChannel = message.content.match(/<#(.*)>/)

        if (targetChannel) {
            const channelId = targetChannel.pop()
            const channel   = await message.client.channels.fetch(channelId)
            return channel 
        }

        return false
    }

    async _postRules (rulesChannel, mainChannel, prefix, index = 1) {
        let spacer = {}
        if ([2, 6, 8, 16, 18, 20].includes(index)) 
            spacer = { files: ['assets/spacer.gif'] }
        
        const rule  = this.$t.get(`rules${index}`)
        let message = null 
        if (rule !== `rules${index}`) { 
            if (rule.startsWith('assets/')) {
                message = await rulesChannel.send('', {
                    files: [rule]
                })
            } else 
                message = await rulesChannel.send(this.$t.get(`rules${index}`, { mainChannel, prefix }), spacer)
            
            index += 1
            await this._postRules(rulesChannel, mainChannel, prefix, index)
        } else 
            return true
    }

    _step1 (message) {
        message.channel.send(generateEmbed({
            title       : 'FIRST STEP',
            description : `Welcome to the **Halo Duels** installation wizard! First things first, please select in reaction to this message the bot's language for this server:\n• 🇺🇸 English (USA)\n• 🇫🇷 Français (France)`,
            thumbnail   : 'https://i.imgur.com/JdNIPOk.png'
        }))
            .then(async msg => {
                msg.react('🇺🇸')
                msg.react('🇫🇷')
                const filter = (reaction, user) => {
                    const firstCheck = ['🇺🇸', '🇫🇷'].includes(reaction.emoji.name)
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
                        switch (reaction.emoji.name) {
                            case '🇫🇷':
                                this.guild.locale = 'fr'
                                break 
                            default: 
                                this.guild.locale = 'en'
                                break 
                        }
                        this.guild.setupStep    = 2
                        this.$t                 = new I18N(this.guild.locale)
                        this.guildManager.addOrOverwrite(this.guild)
                        this.guildManager.flush()
                        message.channel.send(this.$t.get('setupLanguageValidated'))
                            .then(this._step2(message))
                    })
                    .catch(() => {
                        message.channel.send(this.$t.get('errorSetupTimeout'))
                    })
            })
    }

    _step2 (message) {
        const keep      = '✅'
        const change    = '⚙️'
        message.channel.send(generateEmbed({
            title       : this.$t.get('setupChoosePrefix'),
            description : this.$t.get('setupChoosePrefixDesc', { keep, change, prefix: this.guild.prefix })
        }))
            .then(msg => {
                msg.react(keep)
                msg.react(change)
                const filter = (reaction, user) => {
                    const firstCheck = [keep, change].includes(reaction.emoji.name)
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
                        switch (reaction.emoji.name) {
                            case change:
                                this.guild.waitingSetupAnswer = { authorId: message.author.id, channelId: message.channel.id }
                                this.guildManager.update(this.guild)
                                this.guildManager.flush()
                                message.channel.send(this.$t.get('setupDefinePrefix'))
                                break 
                            default: 
                                this.guild.setupStep = 3
                                this.guildManager.update(this.guild)
                                this.guildManager.flush()
                                this._step3(message)
                                break 
                        }
                    })
                    .catch(() => {
                        message.channel.send(this.$t.get('errorSetupTimeout'))
                    })
            })
    }

    _step3 (message) {
        const auto      = '🤖'
        const manual    = '🛠️'
        message.channel.send(generateEmbed({
            title       : this.$t.get('setupTypeOfInstallationTitle'),
            description : this.$t.get('setupTypeOfInstallationDesc', { auto, manual })
        }))
            .then(async msg => {
                msg.react(auto)
                msg.react(manual)
                const filter = (reaction, user) => {
                    const firstCheck = [auto, manual].includes(reaction.emoji.name)
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
                        switch (reaction.emoji.name) {
                            case manual:
                                this.guild.setupStep = 4
                                this._step4(message)
                                break 
                            default: 
                                this._autoSetup(message)
                                break 
                        }
                    })
                    .catch(() => {
                        message.channel.send(this.$t.get('errorSetupTimeout'))
                    })
            })
    }

    _step4 (message) {
        message.channel.send(generateEmbed({
            description : this.$t.get('setupCategoryDesc'),
            title       : this.$t.get('setupCategory')
        }))
            .then(() => {
                this.guild.waitingSetupAnswer = { authorId: message.author.id, channelId: message.channel.id }
                this.guildManager.update(this.guild)
                this.guildManager.flush()
            })
    }

    _step5 (message) {
        message.channel.send(generateEmbed({
            description : this.$t.get('setupRulesChannelDesc'),
            title       : this.$t.get('setupRulesChannel')
        }))
            .then(() => {
                this.guild.waitingSetupAnswer = { authorId: message.author.id, channelId: message.channel.id }
                this.guildManager.update(this.guild)
                this.guildManager.flush()
            })
    }

    _step6 (message) {
        message.channel.send(generateEmbed({
            description : this.$t.get('setupMainChannelDesc'),
            title       : this.$t.get('setupMainChannel')
        }))
            .then(() => {
                this.guild.waitingSetupAnswer = { authorId: message.author.id, channelId: message.channel.id }
                this.guildManager.update(this.guild)
                this.guildManager.flush()
            })
    }
}

module.exports = SetupManager