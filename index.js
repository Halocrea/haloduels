require('dotenv').config()

const Discord           = require('discord.js')
const client            = new Discord.Client()
const CommandManager    = require('./classes/CommandManager')
const DuellistManager   = require('./classes/DuellistManager')

let commandManager  = null
let currentDay      = null
client.on('ready', () => {
    console.log('the bot is ready')
    commandManager = new CommandManager(client)
})

client.on('message', async message => {
    if (message.content.startsWith(process.env.PREFIX)) 
        commandManager.handle(message)
    
    if (currentDay !== (new Date()).getDay()) {
        currentDay = new Date().getDay()
        commandManager.resetDailyGiftsForAll()
        client.guilds.resolve(process.env.GUILD_ID).channels.resolve(process.env.MAIN_CHANNEL_ID)
            .send('Hop ! Nouvelle journée, nouvelle fournée de bonus que vous pouvez donner !')
    }  
})

console.log('Sarting the bot...')
client.login(process.env.DISCORD_TOKEN)