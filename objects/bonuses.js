const { RESULT, TYPE }  = require('./DUEL_ENUMS')

module.exports = [
    {
        type        : TYPE.VEHICLE,
        worksIf     : RESULT.DEFEAT, 
        description : 'Grâce à **{donator}**, {duellist} dispose d\'une carapace et l\'active juste à temps !',
        image       : 'https://i.imgur.com/hvhbFvj.gif',
        effect      : 2 
    },
    {
        type        : TYPE.EXPLOSIVE,
        worksIf     : RESULT.DEFEAT, 
        description : 'D\'un coup de Marteau Antigrav donné par **{donator}**, {duellist} parvient à dévier miraculeusement l\'explosif, qui revient droit dans la tronche de {opponent} !',
        image       : 'https://i.imgur.com/s0D11QM.gif',
        effect      : 2 
    },
    {
        type        : TYPE.VEHICLE,
        worksIf     : RESULT.DEFEAT, 
        description : 'Grâce à **{donator}**, {duellist} avait placé une mine sur le chemin, et {opponent} passe dessus !',
        image       : 'https://i.imgur.com/dX4F2yM.gif',
        effect      : 1 
    },
    {
        type        : TYPE.WEAPON,
        worksIf     : RESULT.DEFEAT, 
        description : 'Grâce à **{donator}**, {duellist} est équipé d\'un régénérateur et s\'est en fait protégé !',
        image       : 'https://i.imgur.com/cTCpzRb.gif',
        effect      : 1
    },
    {
        type        : TYPE.EXPLOSIVE,
        worksIf     : RESULT.DEFEAT, 
        description : 'Grâce à **{donator}**, {duellist} est équipé d\'une bulle protectrice et s\'est protégé juste à temps !',
        image       : 'https://i.imgur.com/M1YMQ18.gif',
        effect      : 1 
    },
    {
        type        : TYPE.SPECIAL,
        worksIf     : RESULT.DEFEAT, 
        description : 'Ah non, {duellist} a laggé à cause de la connexion pourrie de **{donator}**, et en fait tout va bien pour lui⋅elle.',
        image       : 'https://i.imgur.com/BXNEURR.gif',
        effect      : 1
    },
    {
        type        : TYPE.VEHICLE,
        worksIf     : RESULT.VICTORY, 
        description : 'En plus, {duellist} avait {donator} en passager pour profiter de la vue. Ça n\'a aucun effet.',
        image       : 'https://i.imgur.com/PgZdCut.gif',
        effect      : 0
    },
    {
        type        : TYPE.WEAPON,
        worksIf     : RESULT.VICTORY, 
        description : '{duellist} et {donator} font preuve de fair-play et vont teabagger {opponent}. Ça n\'a aucun impact sur le duel, mais ils⋅elles le font quand même.',
        image       : 'https://i.imgur.com/z6PuA75.gif',
        effect      : 0
    },
    {
        type        : TYPE.EXPLOSIVE,
        worksIf     : RESULT.VICTORY, 
        description : 'En plus, **{donator}** avait activé le crâne Tilt, donc l\'explosion était décuplée. Ça n\'a aucun effet, mais c\'est beau.',
        image       : 'https://i.imgur.com/rM7ScKG.gif',
        effect      : 0
    },
]