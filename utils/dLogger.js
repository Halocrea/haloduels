const dLogger = {
    async init (client) { 
        this.maintainer = await client.users.fetch(process.env.MAINTAINER)
        process.dLogger = this
    },
    
    log (message) {
        this.maintainer
            .send(message)
            .catch(console.error)
    }
}

module.exports = dLogger
