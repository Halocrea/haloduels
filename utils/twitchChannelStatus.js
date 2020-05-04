require('dotenv').config()

// to retrieve a channel's id = https://api.twitch.tv/kraken/users?login=halo_creation 
// halo_creation id: 36866296
// current test id : 185514715

const twitchChannelStatus = async (client) => {
    if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CHANNEL_ID) 
        return false 

    const axios     = require('axios')
    try {
        const { data }  = await axios.get(`https://api.twitch.tv/kraken/streams/${process.env.TWITCH_CHANNEL_ID}`, {
            headers: {
                "Accept": "application/vnd.twitchtv.v5+json",
                "Client-ID": process.env.TWITCH_CLIENT_ID
            }
        })

        if (data && data.stream && data.stream !== null) {
            client.user.setActivity(data.stream.game || 'Halo', {
                type: "STREAMING",
                url : data.stream.channel.url
            })  
        } else {
            client.user.setActivity('!duel | halocrea.com', {
                type: 'PLAYING',
                url : 'https://halocrea.com/'
            }) 
        }
    } catch (err) {
        process.dLogger.log(err)
    }
}

module.exports = twitchChannelStatus


