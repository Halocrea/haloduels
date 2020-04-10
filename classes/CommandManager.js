require('dotenv').config()

const DuelManager               = require('./DuelManager')
const DuellistManager           = require('./DuellistManager')
const { MessageEmbed }          = require('discord.js')
const { STATUS, RESULT, TYPE }  = require('./../objects/DUEL_ENUMS')

const newDuelImg = [
    'https://i.imgur.com/0hq7YUV.gif',
    'https://i.imgur.com/Cy1fHmm.gif',
    'https://i.imgur.com/w4I6kcA.gif',
    'https://media.discordapp.net/attachments/443844498074632192/669650500463099934/ezgif.com-video-to-gif9.gif'
]
const endResultGif = [
    'https://media.discordapp.net/attachments/443844498074632192/674203710909579264/halfjaw-speech.gif',
    'https://media.discordapp.net/attachments/572511139632775204/679346631178715146/giphy.gif',
    'https://media.discordapp.net/attachments/614835042023112707/675388268598263822/ezgif.com-video-to-gif_14.gif'
]

class CommandManager {
    constructor (client) {
        this.client             = client
        this.duelManager        = new DuelManager()
        this.duellistManager    = new DuellistManager()
        this.guild              = client.guilds.resolve(process.env.GUILD_ID)
        this.mainChannel        = this.guild.channels.resolve(process.env.MAIN_CHANNEL_ID)
        this.rulesChannel       = this.guild.channels.resolve(process.env.RULES_CHANNEL_ID)
    }

    handle (message) {
        const cmdAndArgs = message.content.replace(process.env.PREFIX, '').trim().split(' ')
        const cmd        = cmdAndArgs[0]
        let args         = ''
        
        for (let i = 1; i < cmdAndArgs.length; i++) 
            args += cmdAndArgs[i] + ' '

        args.trim()

        switch (cmd) {
            case 'aide': 
                message.channel
                    .send(`Les règles du jeu, commandes disponibles et autres informations se trouvent dans le channel ${this.mainChannel}.`)
                    .catch(console.log)
                break 
            case 'attaquer':
                this.attack(message)
                break 
            case 'fermer':
                this.closeDuel(message, args)
                break
            case 'liste':
                this.listDuellists(message)
                break
            case 'pseudo': 
                this.changeNickname(message, args)
                break 
            case 'quitter': 
                this.retire(message)
                break 
            case 'ragequit': 
                this.rageQuit(message)
                break
            case 's\'enrôler':
                this.enlist(message)
                break
            case 'stats':
                this.getStatsForUser(message)
                break 
            default: 
                if (message.channel.id === this.mainChannel.id) {
                    const defender = message.mentions.members.first() 
                    if (defender) 
                        this.provoke(message, args)
                    else 
                        message.channel.send(`Je n\'ai pas compris cette commande ; pour la liste des commandes disponibles, rendez-vous sur ${this.mainChannel}.`)
                } else {
                    const duel = this.duelManager.getById(message.channel.id)
                    if (duel && duel.duellists.some(d => d.duellist.id === message.author.id)) 
                        this.attack(message)
                    else 
                        message.channel.send(`Je n\'ai pas compris cette commande ; pour la liste des commandes disponibles, rendez-vous sur ${this.mainChannel}.`)
                }
                break
        }
    }

    changeNickname (message, arg) {
        const duellist = this.duellistManager.getById(message.author.id)
        if (!duellist)
            return message.channel.send('Hmm je ne te trouve pas dans la liste des duellistes. Inscris-toi d\'abord en faisant `!duel s\'enrôler`.')

        try {
            duellist.displayName = arg.trim()
            this.duellistManager.update(duellist)
            this.duellistManager.flush()
            message.channel.send(`Ça roule, tu apparaîtras en tant que ${duellist.displayName} dans la liste des duellistes.`)
        } catch (err) {
            message.channel.send(err.message)
                .catch(console.log)
        }
    }

    async closeDuel (message, arg) {
        const member = await this.guild.members.fetch(message.author)
        if (!member.roles.cache.some(r => process.env.SUPER_ROLES.split(',').includes(r.id))) 
            return message.channel.send('Vous n\'avez pas les permissions nécessaires pour effectuer cette action. \nPour fuire un duel, tapez `!duel ragequit` dans le channel correspondant.')
        
        const channelId         = arg.replace('<#', '').replace('>', '').trim()
        const channelToClose    = !channelId ? message.channel : await this.guild.channels.resolve(channelId)

        if (!channelToClose)
            return message.channel.send('Je n\'ai pas trouvé le channel que vous m\'avez indiqué.')

        const duel = this.duelManager.getById(channelToClose.id)
        if (!duel)
            return message.channel.send('Apparemment, je ne peux pas supprimer ce channel.')

        const playerNames = []
        duel.duellists.forEach(d => {
            playerNames.push(d.duellist.displayName)
            d.duellist.status = STATUS.IDLE
            this.duellistManager.update(d.duellist)
        })
        this.duellistManager.flush()
        duel.hasEnded = true 
        this.duelManager.update(duel)
        this.duelManager.flush()
        channelToClose.delete()
            .then(async () => {
                this.mainChannel.send(`Le duel entre **${playerNames[0]}** et **${playerNames[1]}** a été annulé.`)
                this.duelManager.endDuel(duel)
            })
            .catch(console.log)
    }

    async enlist (message) {
        try {
            const member    = await this.guild.members.fetch(message.author)
            const duellist  = this.duellistManager.add(member)
            this.duellistManager.flush()
            const embed     = this._genEmbed({
                description : `Félicitations ${message.author}, vous faites maintenant partie des têtes brûlées !`, 
                thumbnail   : message.author.avatarURL({ format: 'jpg', dynamic: true, size: 128 }), 
                title       : 'Un nouveau combattant dans l\'arène !', 
                fields      : [
                    { name: 'Comment jouer ?', value: `Toutes les infos se trouvent dans ${this.rulesChannel}.` },
                    { name: 'Où jouer ?', value: `Rendez-vous dans ${this.mainChannel} pour provoquer quelqu'un en duel.` }
                ]
            })
            message.channel.send(embed)
                .catch(console.log)
            
            return duellist
        } catch (err) {
            message.channel.send(err.message)
                .catch(console.log)
        }
    }

    listDuellists (message) {
        const duellists = this.duellistManager.all().filter(d => !d.tmp)
        const sorted    = duellists.sort((a, b) => {
            if (a.stats.victories > b.stats.victories) 
                return -1 
            else if (b.stats.victories < b.stats.victories) 
                return 1 
            else 
                return 0
        })

        let prevNumber  = 1
        let prevCount   = 0
        const fields    = []
        sorted.forEach((duellist, index) => {
            if (index === 0) 
                prevCount = (duellist.stats.victories - duellist.stats.defeats)

            const number    = (duellist.stats.victories - duellist.stats.defeats) === prevCount ? prevNumber : prevNumber + 1
            prevCount       = (duellist.stats.victories - duellist.stats.defeats)
            prevNumber      = number 
            let rank        = ''
            switch (number) {
                case 1: 
                    rank = `${number}. 🥇`
                    break
                case 2: 
                    rank = `${number}. 🥈`
                    break
                case 3: 
                    rank = `${number}. 🥉`
                    break
                default: 
                    rank = `${number}.`
                    break
            }
            let ratio   = '' 
            const total = duellist.stats.victories + duellist.stats.defeats
            if (total > 0)
                ratio = `${Math.round((duellist.stats.victories/(total))*10000)/100}% de victoires`
            else 
                ratio = `pas de combat`

            fields.push({ name: `**${rank} ${duellist.displayName}**`, value: `${ratio} | ${total} duel${total > 1 ? 's' : ''}` })
        })

        try {
            const embed = this._genEmbed({
                title       : 'CLASSEMENT DES DUELLISTES',
                thumbnail   : 'https://i.imgur.com/G6Bpy9x.png', 
                color       : '#43b581', 
                description : 'Le classement est fait en fonction du nombre absolu de victoires.',
                fields
            })

            message.channel.send(embed)
                .catch(console.log)
        } catch (err) {
            message.channel.send(err.message)
                .catch(console.log)
        }
    }

    rageQuit (message) {
        let answer = ''
        message.channel
            .send(`Attention ! Cette action donnera la victoire à votre adversaire. Réagissez avec ✅ confirmer, ou ❎ pour annuler.`)
            .then(msg => {
                msg.react('✅')
                msg.react('❎')
                msg.awaitReactions(
                    (reaction, user) => ['✅', '❎'].includes(reaction.emoji.name) && user.id === message.author.id, 
                    { 
                        max     : 1, 
                        time    : (5 * 60000), 
                        errors  : ['time'] 
                    }
                )
                    .then(collected => {
                        const reaction  = collected.first()

                        if (reaction.emoji.name === '✅') {
                            // 1. mettre à jour les stats des joueurs (forcer la victoire à celui qui n'a pas quitté)
                            // 2. passer le duel en "hasEnded"
                            // 3. passer les duellistes en "idle"
                            const duel = this.duelManager.getById(message.channel.id)
                            if (!duel)
                                return 
                            duel.duellists.forEach(d => {
                                if (d.duellist.id === message.author.id)
                                    d.duellist.stats.defeats += 1
                                else 
                                    d.duellist.stats.victories += 1
                                
                                d.duellist.status = STATUS.IDLE
                                this.duellistManager.update(d.duellist)
                            })
                            this.duellistManager.flush()
                            duel.hasEnded = true 
                            this.duelManager.update(duel)
                            this.duelManager.flush()
                            message.channel.delete()
                                .then(async () => {
                                    const winner = duel.duellists.find(d => d.duellist.id !== message.author.id)
                                    const looser = duel.duellists.find(d => d.duellist.id === message.author.id)
                                    const fields = []
                                    duel.duellists.forEach(d => {
                                        const countVictories    = duel.count.roundWinners.filter(id => id === d.duellist.id).length
                                        let niceDots            = countVictories > 0 ? '' : '-'
                                        for (let i = 0; i < countVictories; i++)
                                            niceDots += d.color === 'red' ? '🟥 ' : '🟦 '
                                        fields.push({
                                            name    : d.duellist.displayName,
                                            value   : niceDots,
                                            inline  : true
                                        })
                                    })
                                    const winnerDiscordUser = await this.client.users.fetch(winner.duellist.id)
                                    this.mainChannel.send(this._genEmbed({
                                        title       : `${looser.duellist.displayName.toUpperCase()} A ragequit SON DUEL CONTRE ${winner.duellist.displayName.toUpperCase()} !`,
                                        color       : '#43b581',
                                        thumbnail   : winnerDiscordUser.avatarURL({ format: 'jpg', dynamic: true, size: 128 }),
                                        description : `${looser.duellist.displayName} n'a pas su résister à la pression dans son combat contre ${winner.duellist.displayName} et a pris la fuite !`,
                                        fields,
                                    }))
                                    this.duelManager.endDuel(duel)
                                })
                                .catch(console.log)
                        } else
                            answer = 'Ah ouf ! Tu m\'as fait peur !'

                        message.channel.send(answer)
                    })
            })
    }

    retire (message) {
        let answer = ''
        message.channel
            .send(`Attention ! Cette action effacera vos statistiques de façon irréversible. Réagissez avec ✅ confirmer, ou ❎ pour annuler.`)
            .then(msg => {
                msg.react('✅')
                msg.react('❎')
                msg.awaitReactions(
                    (reaction, user) => ['✅', '❎'].includes(reaction.emoji.name) && user.id === message.author.id, 
                    { 
                        max     : 1, 
                        time    : (5 * 60000), 
                        errors  : ['time'] 
                    }
                )
                    .then(collected => {
                        const reaction  = collected.first()

                        if (reaction.emoji.name === '✅') {
                            try {
                                const duellist = this.duellistManager.unset(message.author.id)
                                answer = `Bye bye ${duellist.displayName}`
                                this.duellistManager.flush()
                            } catch (err) {
                                answer = err.message
                            }
                        } else
                            answer = 'Ah ouf ! Tu m\'as fait peur !'

                        message.channel.send(answer)
                    })
            })
    }

    getStatsForUser (message) {
        const duellist = this.duellistManager.getById(message.author.id)
        if (!duellist)
            return message.channel.send('Hmm je ne te trouve pas dans la liste des duellistes. Inscris-toi en faisant `!duel s\'enrôler` avant de vouloir flex sur tes stats.')
        
        let ratio = '' 
        if (duellist.stats.victories + duellist.stats.defeats > 0)
            ratio = `${Math.round((duellist.stats.victories/(duellist.stats.victories + duellist.stats.defeats))*10000)/100}%`
        else 
            ratio = `N/A`
        
        const embed = this._genEmbed({
            color       : '#43b581',
            description : 'Allez, on va voir si tu peux flex :',
            fields      : [
                { name: 'Inscription', value : new Date(duellist.enroledAt).toLocaleDateString('fr-FR'), inline: true },
                { name: 'Dernier combat', value : duellist.lastDuel ? new Date(duellist.lastDuel).toLocaleDateString('fr-FR') : 'N/A', inline: true },
                { name: 'Nombre de duels', value : duellist.stats.victories + duellist.stats.defeats, inline: false },
                { name: 'Victoires', value : duellist.stats.victories, inline: true },
                { name: 'Défaites', value : duellist.stats.defeats, inline: true },
                { name: 'Ratio', value : ratio, inline: true }
            ],
            footer      : `Statistiques générées le ${new Date().toLocaleDateString('fr-FR')}`, 
            title       : `Statistiques de ${duellist.displayName}`,
            thumbnail   :  message.author.avatarURL({ format: 'jpg', dynamic: true, size: 128 })
        })

        message.channel.send(embed)
            .catch(console.log)
    }

    async provoke (message, arg) {
        let offender = this.duellistManager.getById(message.author.id)
        if (!offender) 
            offender = await this.enlist(message)

        switch (offender.status) {
            case STATUS.FIGHTING: 
            return message.channel.send('Termine déjà ton autre duel avant d\'en lancer un nouveau !')
                break 
            case STATUS.WAITING_DUEL_APPROVAL:
                return message.channel.send('Tu attends toujours une réponse pour un duel ; tu dois attendre 5 minutes, ou que ton adversaire y réponde, avant de pouvoir lancer un nouveau duel.')
                break 
            default:
                break
        }

        const defenderMember = message.mentions.members.first() 
        if (!defenderMember) 
            return message.channel.send('Hmm je ne trouve pas ton adversaire ; tu es sûr d\'avoir fait la mention correctement ?')
        
        let defenderDuellist = this.duellistManager.getById(defenderMember.id)
        if (!defenderDuellist) {
            defenderDuellist = this.duellistManager.addTmp(defenderMember)
        }
        if (defenderDuellist.status === STATUS.FIGHTING) 
            return message.channel.send('Ton adversaire est déjà en plein duel, attends que cet autre combat se termine avant de pouvoir entamer celui-là.')
        
        if (offender.id === defenderMember.id) 
            return message.channel.send('Eeuuuh ... Tu essaies vraiment de t\'auto-provoquer en duel ?')

        this.duellistManager.flush()
        const embed = this._genEmbed({
            title       : '❗ NOUVELLE PROVOCATION EN DUEL ❗',
            thumbnail   : 'https://i.imgur.com/G6Bpy9x.png', 
            description : `${defenderMember}, **${offender.displayName}** vous provoque en duel ! Réagissez avec 🤺 pour accepter, ou 🚷 pour refuser.` ,
            image       : 'https://i.imgur.com/H6ZsESX.gif'
        })
        this.mainChannel.send(embed)
            .then(msg => {
                offender.status = STATUS.WAITING_DUEL_APPROVAL
                this.duellistManager.update(offender)
                this.duellistManager.flush()

                msg.react('🤺')
                msg.react('🚷')
                msg.awaitReactions(
                    (reaction, user) => ['🤺', '🚷'].includes(reaction.emoji.name) && user.id === defenderMember.id, 
                    { 
                        max     : 1, 
                        time    : (5 * 60000), 
                        errors  : ['time'] 
                    }
                )
                    .then(collected => {
                        const reaction  = collected.first()
                        let answer      = ''

                        if (reaction.emoji.name === '🤺') {
                            try { 
                                if (defenderDuellist.tmp) {
                                    defenderDuellist.tmp = false 
                                    this.duellistManager.update(defenderDuellist)
                                    this.duellistManager.flush()
                                    const embed = this._genEmbed({
                                        description : `Félicitations ${defenderMember}, vous faites maintenant partie des têtes brûlées !`, 
                                        thumbnail   : defenderMember.user.avatarURL({ format: 'jpg', dynamic: true, size: 128 }), 
                                        title       : 'Un nouveau combattant dans l\'arène !', 
                                        fields      : [
                                            { name: 'Comment jouer ?', value: `Toutes les infos se trouvent dans ${this.rulesChannel}.` },
                                            { name: 'Où jouer ?', value: `Rendez-vous dans ${this.mainChannel} pour provoquer quelqu'un en duel.` }
                                        ]
                                    })
                                    this.mainChannel.send(embed)
                                        .catch(console.log)
                                }
                                this._setupNewDuel(
                                    { discordUser: message.author, duelUser: offender }, 
                                    { discordUser: defenderMember.user, duelUser: defenderDuellist }, 
                                    message
                                )
                            } catch (err) {
                                message.channel.send(err.message)
                            }
                        } else {
                            offender.status = STATUS.IDLE
                            this.duellistManager.update(offender)
                            if (defenderDuellist.tmp) 
                                this.duellistManager.unset(defenderDuellist.id)
                            
                            this.duellistManager.flush()
                            message.channel.send('_Mfffpmffpfmfff c\'est ce qu\'on appelle un vent !_')
                        }
                    })
                    .catch(err => {
                        offender.status = STATUS.IDLE
                        this.duellistManager.update(offender)
                        if (defenderDuellist.tmp) 
                            this.duellistManager.unset(defenderDuellist.id)

                        this.duellistManager.flush()
                        msg.channel.send(`${message.author}, ${defenderDuellist.displayName} a mis trop de temps à relever le défi que tu lui as lancé ; réessaie peut-être un peu plus tard ?`)
                    })
            })
    }

    attack (message) {
        const duel = this.duelManager.getById(message.channel.id)
        if (!duel)
            return message.channel.send(`Hmm il semblerait que vous tentiez ça dans le mauvais channel ; pour provoquer un joueur en duel, tapez \`!duel @Joueur\` dans ${this.mainChannel}.`).catch(console.log)
        
        const itvl = setInterval(async () => {
            if (duel.busy)
                return 

            clearInterval(itvl)
            duel.busy           = true
            const round         = this.duelManager.generateNewRound(duel, message.author.id)
            
            const winner        = duel.duellists.find(d => d.duellist.id === round.winner)
            const winnerMember  = await this.guild.members.fetch(round.winner)
            const embed         = this._genEmbed({
                title       : `${winner.duellist.displayName.toUpperCase()} DOMINE CETTE MANCHE !`,
                color       : winner.color === 'red' ? '#fa1212' : '#1da1f2',
                description : round.statement,
                thumbnail   : winnerMember.user.avatarURL({ format: 'jpg', dynamic: true, size: 128 }),
                image       : round.image
            })
            message.channel
                .send(embed)
                .then(async () => {
                    const loserBonus    = duel.bonuses.find(b => b.receiverId !== round.winner && b.bonus.worksIf === RESULT.DEFEAT && b.bonus.type === round.type) 
                    const loser         = duel.duellists.find(d => d.duellist.id !== round.winner)
                    const loserMember   = await this.guild.members.fetch(loser.duellist.id)

                    if (loserBonus) {
                        const bonusEmbed    = this._genEmbed({
                            title       : `MAIS ${loser.duellist.displayName.toUpperCase()} NE S'AVOUE PAS VAINCU SI VITE!`,
                            thumbnail   : loserMember.user.avatarURL({ format: 'jpg', dynamic: true, size: 128 }),
                            color       : loser.color === 'red' ? '#fa1212' : '#1da1f2',
                            description : loserBonus.bonus.description.replace('{duellist}', loser.duellist.displayName).replace('{donator}', loserBonus.donorName).replace('{opponent}', winner.duellist.displayName),
                            image       : loserBonus.bonus.image
                        })
                        setTimeout(() => {
                            message.channel
                            .send(bonusEmbed)
                            .then(() => {
                                const duelWithWinner = this.duelManager.newRoundDone(duel, round, loserBonus)
                                setTimeout(() => {
                                    message.channel.send(this._genEndRoundEmbed(duelWithWinner))
                                    .then(() => {
                                        this._newRoundOrEndGame(message, duelWithWinner)
                                    })
                                    .catch(console.log)
                                }, 2000)
                            })
                            .catch(console.log)
                        }, 2000)
                    } else {
                        const winnerBonus = duel.bonuses.find(b => b.receiverId === round.winner && b.bonus.worksIf === RESULT.VICTORY && b.bonus.type === round.type) 
                        
                        if (winnerBonus) {
                            const bonusEmbed    = this._genEmbed({
                                title       : `ET ÇA TAUNT, EN PLUS !`,
                                thumbnail   : winnerMember.user.avatarURL({ format: 'jpg', dynamic: true, size: 128 }),
                                color       : winner.color === 'red' ? '#fa1212' : '#1da1f2',
                                description : winnerBonus.bonus.description.replace('{duellist}', loser.duellist.displayName).replace('{donator}', winnerBonus.donorName).replace('{opponent}', winner.duellist.displayName),
                                image       : winnerBonus.bonus.image
                            })
                            setTimeout(() => {
                                message.channel
                                .send(bonusEmbed)
                                .then(() => {
                                    const duelWithWinner = this.duelManager.newRoundDone(duel, round, winnerBonus)
                                    setTimeout(() => {
                                        message.channel.send(this._genEndRoundEmbed(duelWithWinner))
                                            .then(() => {
                                                this._newRoundOrEndGame(message, duelWithWinner)
                                            })
                                            .catch(console.log)
                                    })
                                })
                                .catch(console.log)
                            }, 2000)
                        } else {
                            const duelWithWinner = this.duelManager.newRoundDone(duel, round)
                            setTimeout(() => {
                                message.channel.send(this._genEndRoundEmbed(duelWithWinner))
                                    .then(() => {
                                        this._newRoundOrEndGame(message, duelWithWinner)
                                    })
                                    .catch(console.log)
                            }, 2000)
                        }
                    }
                })
        }, 500)
    }

    _genEmbed (args) {
        const embed = new MessageEmbed()
            .setTitle(args.title || '')
            .setColor(args.color || '#faa61a')
            .setDescription(args.description || '')

        if (args.thumbnail)
            embed.setThumbnail(args.thumbnail)

        for (let i in args.fields)
            embed.addField(args.fields[i].name, args.fields[i].value, !!args.fields[i].inline)

        if (args.image)
            embed.setImage(args.image)

        if (args.footer)
            embed.setFooter(args.footer)

        return embed
    }

    _genEndRoundEmbed (duelWithWinner) {
        let description = 'Cette manche est une **égalité** !'
        let color       = '#faa61a' 
        let title       = ''
        if (duelWithWinner.winner) {
            const winner    = duelWithWinner.duel.duellists.find(d => d.duellist.id === duelWithWinner.winner)
            color           = winner.color === 'red' ? '#fa1212' : '#1da1f2'
            description     = `Cette manche a été remportée par **${winner.duellist.displayName}** !`
        }

        const fields = []
        duelWithWinner.duel.duellists.forEach(d => {
            const countVictories    = duelWithWinner.duel.count.roundWinners.filter(id => id === d.duellist.id).length
            let niceDots            = countVictories > 0 ? '' : '-'
            for (let i = 0; i < countVictories; i++)
                niceDots += d.color === 'red' ? '🟥 ' : '🟦 '
            fields.push({
                name    : d.duellist.displayName,
                value   : niceDots,
                inline  : true
            })
            if (d.color === 'red')
                title = `🟥 ${d.duellist.displayName.toUpperCase()} ${countVictories} - ` + title
            else 
                title += `${countVictories} ${d.duellist.displayName.toUpperCase()} 🟦`
        })

        return this._genEmbed({
                color,
                description,
                fields,
                title, 
                footer      : `Résultat de la manche ${duelWithWinner.duel.count.rounds}`,
                thumbnail   : 'https://i.imgur.com/G6Bpy9x.png', 
            })
    }

    _newRoundOrEndGame (message, duelWithWinner) {
        let duelWinner                  = false 
        let countWinningsPerDuellist    = {}
        if (duelWithWinner.duel.count.rounds >= 4) {
            duelWithWinner.duel.count.roundWinners.forEach(w => {
                if (countWinningsPerDuellist[w])
                    countWinningsPerDuellist[w] += 1
                else 
                    countWinningsPerDuellist[w] = 1

                if (countWinningsPerDuellist[w] >= 4)
                    duelWinner = w
            })
        } 
        setTimeout(async () => {
            if (!!duelWinner) {
                duelWithWinner.duel.duellists.forEach(d => {
                    if (d.duellist.id !== duelWinner)
                        d.duellist.stats.defeats += 1
                    else 
                        d.duellist.stats.victories += 1
                    
                    d.duellist.status = STATUS.IDLE
                    this.duellistManager.update(d.duellist)
                })
                this.duellistManager.flush()
                duelWithWinner.duel.hasEnded = true 
                this.duelManager.update(duelWithWinner.duel)
                this.duelManager.flush()
                
                const winner = duelWithWinner.duel.duellists.find(d => d.duellist.id === duelWinner)
                const looser = duelWithWinner.duel.duellists.find(d => d.duellist.id !== duelWinner)
                const fields = []
                duelWithWinner.duel.duellists.forEach(d => {
                    const countVictories    = duelWithWinner.duel.count.roundWinners.filter(id => id === d.duellist.id).length
                    let niceDots            = countVictories > 0 ? '' : '-'
                    for (let i = 0; i < countVictories; i++)
                        niceDots += d.color === 'red' ? '🟥 ' : '🟦 '
                    fields.push({
                        name    : d.duellist.displayName,
                        value   : niceDots,
                        inline  : true
                    })
                })
                const winnerDiscordUser = await this.client.users.fetch(winner.duellist.id)
                const endEmbed = this._genEmbed({
                    title       : `${winner.duellist.displayName.toUpperCase()} A REMPORTÉ SON DUEL CONTRE ${looser.duellist.displayName.toUpperCase()} !`,
                    color       : '#43b581',
                    thumbnail   : winnerDiscordUser.avatarURL({ format: 'jpg', dynamic: true, size: 128 }),
                    description : `${winner.duellist.displayName} a su imposer sa grosse chance dans ce combat acharné contre ${looser.duellist.displayName} ; bravo à lui !`,
                    image       : endResultGif[Math.floor(Math.random() * endResultGif.length)], 
                    fields,
                })
                this.duelManager.endDuel(duelWithWinner.duel)
                message.channel.send(endEmbed)
                    .then(() => {
                        message.channel.send(`Ce channel va maintenant être fermé, puis supprimé, mais le résultat sera affiché dans ${this.mainChannel}.`)
                            .then(() => {
                                this.mainChannel.send(endEmbed)
                                setTimeout(() => message.channel.delete(), 10000)
                            })
                    })
            } else {
                message.channel.send(this._genEmbed({
                    title       : '🔔 NOUVELLE MANCHE 🔔',
                    description : 'Tapez `!duel attaquer` pour lancer les hostilités !'
                }))
            }
            duelWithWinner.duel.busy = false
            this.duelManager.update(duelWithWinner.duel)
            this.duelManager.flush()
        }, 2000)
    }

    _setupNewDuel (offender, defender, message) {
        this.guild.channels.create(`🔫${offender.duelUser.displayName.toLowerCase().replace(/\s+/g, '-')}-vs-${defender.duelUser.displayName.toLowerCase().replace(/\s+/g, '-')}`, {
                parent              : process.env.CATEGORY_ID, 
                topic               : 'Que le combat commence !',
                permissionOverwrites: [
                    {
                        id      : this.guild.id,
                        allow   : ['VIEW_CHANNEL', 'READ_MESSAGE_HISTORY'], 
                        deny    : ['SEND_MESSAGES', 'SEND_TTS_MESSAGES', 'MANAGE_MESSAGES']
                    },
                    {
                        id      : offender.discordUser.id,
                        allow   : ['SEND_MESSAGES', 'READ_MESSAGE_HISTORY'] 
                    },
                    {
                        id      : defender.discordUser.id,
                        allow   : ['SEND_MESSAGES', 'READ_MESSAGE_HISTORY'] 
                    },
                    {
                        id      : this.client.user.id,
                        allow   : ['SEND_MESSAGES', 'MANAGE_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY'] 
                    },
                ],
                rateLimitPerUser: 5
            })
            .then(channel => {
                message.channel.send(`C'est parti pour un nouveau duel entre **${offender.duelUser.displayName}** et **${defender.duelUser.displayName}** dans ${channel} ! Tout le monde peut réagir, et les autres duellistes peuvent faire des dons d'équipement !`)
                const duel = this.duelManager.create(channel, offender.duelUser, defender.duelUser)
                this.duelManager.flush() 
                const welcomeEmbed = this._genEmbed({
                    title       : 'C\'EST L\'HEURE DU DUEL !',
                    description : `${offender.discordUser}, ${defender.discordUser}, c'est ici que vous allez déterminer lequel de vous deux est le meilleur ... Dans un jeu totalement aléatoire en 4 manches gagnantes ! \n\nPour jouer, rien de plus simple : tapez \`!duel attaquer\`, et priez pour que le destin vous soit favorable. Bonne chance ! \n\n**POUR LES SPECTATEURS**\nSi vous vous êtes enrolés, vous pouvez faire don d'un bonus à l'un des duellistes, dans la limite de 2 par jour. Pour ce faire, réagissez avec 💌 au message d'introduction de votre copain.`,
                    image       : newDuelImg[Math.floor(Math.random() * newDuelImg.length)],
                    thumbnail   : 'https://i.imgur.com/G6Bpy9x.png', 
                })
                channel.send(`${offender.discordUser}, ${defender.discordUser} !`)
                    .then(() => {
                        channel.send(welcomeEmbed)
                            .then(() => {
                                duel.duellists.forEach(d => {
                                    const thisDiscordUser = d.duellist.id === offender.discordUser.id ? offender.discordUser : defender.discordUser
                                    
                                    let ratio = '' 
                                    if (d.duellist.stats.victories + d.duellist.stats.defeats > 0)
                                        ratio = `${Math.round((d.duellist.stats.victories/(d.duellist.stats.victories + d.duellist.stats.defeats))*10000)/100}% de victoires`
                                    else 
                                        ratio = `pas de combat`
                                    
                                    channel.send(this._genEmbed({
                                        title       : `${d.color === 'red' ? '🟥 ATTAQUANT' : '🟦 DÉFENSEUR' } : ${d.duellist.displayName.toUpperCase()}`, 
                                        color       : d.color === 'red' ? '#fa1212' : '#1da1f2', 
                                        thumbnail   : thisDiscordUser.avatarURL({ format: 'jpg', dynamic: true, size: 128 }),
                                        fields      : [
                                            { name: 'Inscription', value : new Date(d.duellist.enroledAt).toLocaleDateString('fr-FR'), inline: true },
                                            { name: 'Dernier combat', value : d.duellist.lastDuel ? new Date(d.duellist.lastDuel).toLocaleDateString('fr-FR') : 'N/A', inline: true },
                                            { name: 'Nombre de duels', value : d.duellist.stats.victories + d.duellist.stats.defeats, inline: false },
                                            { name: 'Victoires', value : d.duellist.stats.victories, inline: true },
                                            { name: 'Défaites', value : d.duellist.stats.defeats, inline: true },
                                            { name: 'Ratio', value : ratio, inline: true }
                                        ],
                                    }))
                                        .then(msg => {
                                            msg.react('💌')
                                            const filter    = (reaction, user) => reaction.emoji.name === '💌' && [this.client.user.id, offender.duelUser.id, defender.duelUser.id].indexOf(user.id) < 0
                                            const collector = msg.createReactionCollector(() => true, { time: 5 * 60000 })
                                            collector.on('collect', async (reaction, reactionCollector) => {
                                                const user      = reaction.users.cache.last()
        
                                                if (user.id === this.client.user.id)
                                                    return 
        
                                                let donator     = this.duellistManager.getById(user.id)
                                                if (!donator) {
                                                    const member    = await this.guild.members.fetch(user.id)
                                                    donator         = this.duellistManager.addTmp(member)
                                                }
                                                if (donator && donator.dailyGifts.length > 0) {
                                                    duel.bonuses.push({
                                                        receiverId  : d.duellist.id,
                                                        donorName   : donator.displayName,   
                                                        bonus       : JSON.parse(JSON.stringify(donator.dailyGifts[0]))
                                                    })
                                                    donator.dailyGifts.splice(0, 1)
                                                    this.duellistManager.update(donator)
                                                    this.duelManager.update(duel)
                                                    this.duellistManager.flush() 
                                                    this.duelManager.flush()                                           
                                                    msg.channel.send(`_${donator.displayName} a fait don d'un équipement à ${d.duellist.displayName} !_`)
                                                    reaction.users.remove(user)
                                                } else if (user) {
                                                    user.send('Vous avez déjà dépensé tous vos bonus de la journée.')
                                                    reaction.users.remove(user)
                                                }
                                            })
                                        })  
                                })
                            })
                            .catch(console.log)
                    })
                    .catch(console.log)
            })
    }
}

module.exports = CommandManager