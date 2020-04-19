require('dotenv').config()

const Discord           = require('discord.js')
const client            = new Discord.Client({
    ws: { intents: [
        'GUILDS', 
        'GUILD_MESSAGES', 
        'GUILD_MESSAGE_REACTIONS', 
        'GUILD_INVITES', 
        'GUILD_INTEGRATIONS'
    ]}
})
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
        const commandManager            = new CommandManager(client, currentGuild)
        currentGuild.lastGiftsRenewal   = new Date()
        guildManager.update(currentGuild)
        guildManager.flush()
        commandManager.resetDailyGiftsForAll(message)
    }  
})

client.on('guildCreate', guild => {
    client.users.fetch(process.env.MAINTAINER)
        .then(u => u.send(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!\nI'm serving ${client.guilds.cache.size} servers now.`))
        .catch(console.log)
})

client.on('guildDelete', guild => {
    client.users.fetch(process.env.MAINTAINER)
        .then(u => u.send(`${guild.name} (id: ${guild.id}) removed me.\nI'm serving ${client.guilds.size} servers now.`))
        .catch(console.log)
})

console.log('Sarting the bot...')
client.login(process.env.DISCORD_TOKEN)