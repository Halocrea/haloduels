const { MessageEmbed } = require('discord.js')

module.exports = ({color, description, fields, footer, image, thumbnail, title}) => {
    const embed = new MessageEmbed()
        .setTitle(title || '')
        .setColor(color || '#faa61a')
        .setDescription(description || '')

    if (thumbnail)
        embed.setThumbnail(thumbnail)

    for (let i in fields)
        embed.addField(fields[i].name, fields[i].value, !!fields[i].inline)

    if (image)
        embed.setImage(image)

    if (footer)
        embed.setFooter(footer)

    return embed
}
