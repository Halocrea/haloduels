require('dotenv').config()

const Discord           = require('discord.js')
const client            = new Discord.Client()
const CommandManager    = require('./managers/CommandManager')
const GuildManager      = require('./managers/GuildManager')
const SetupManager      = require('./managers/SetupManager')
const I18N              = require('./utils/I18N')

let guildManager    = null

client.on('ready', () => {
    console.log('the bot is ready')
    guildManager   = new GuildManager()
})

client.on('message', async message => {
    if (!message.guild) // mps
        return 
    
    const currentGuild  = guildManager.getById(message.guild.id)
    const prefix        = currentGuild ? currentGuild.getPrefix() : '!duel'

    if (message.content.startsWith(prefix)) {
        if (currentGuild && currentGuild.setupCompleted) {
            const commandManager = new CommandManager(client, currentGuild)
            commandManager.handle(message, currentGuild)
        } else {
            // checking if the author of the message is allowed to do what he's trying to do
            const member = await message.guild.members.fetch(message.author)
            if (member.hasPermission('ADMINISTRATOR')) {
                const setupManager = new SetupManager(guildManager) 
                setupManager.handle(message, currentGuild)
            } else {
                const $t    = new I18N(currentGuild ? currentGuild.locale : 'en') 
                const embed = new Discord.MessageEmbed()
                    .setTitle($t.get('errorConfigureMeFirst'))
                    .setColor('#ff0000')
                    .setDescription($t.get('errorNotFullySetUpYet'))
                    .setImage('https://i.imgur.com/ZIfiTGO.gif')
                message.channel.send(embed)
            }
        }
    }

    if (currentGuild && 
        currentGuild.waitingSetupAnswer && 
        currentGuild.waitingSetupAnswer.authorId === message.author.id && 
        currentGuild.waitingSetupAnswer.channelId === message.channel.id
    ) {
        const setupManager = new SetupManager(guildManager) 
        setupManager.handleAnswer(message, currentGuild)
    }
    
    if (message.author.id !== client.user.id && 
        currentGuild && 
        currentGuild.setupCompleted && 
        (new Date()).getDay() !== new Date(currentGuild.lastGiftsRenewal).getDay()
    ) {
        const commandManager = new CommandManager(client, currentGuild)
        commandManager.resetDailyGiftsForAll()
        message.guild.channels.resolve(currentGuild.mainChanId)
            .send('Hop ! Nouvelle journée, nouvelle fournée de bonus que vous pouvez donner !')
        currentGuild.lastGiftsRenewal = new Date()
        guildManager.update(currentGuild)
        guildManager.flush()
    }  
})

console.log('Sarting the bot...')
client.login(process.env.DISCORD_TOKEN)