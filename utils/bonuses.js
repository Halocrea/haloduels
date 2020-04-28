const { RESULT, TYPE }  = require('./enums.js')

module.exports = [
    {
        type        : TYPE.VEHICLE,
        worksIf     : RESULT.DEFEAT, 
        key         : 'bonusArmorLock', 
        image       : 'https://i.imgur.com/hvhbFvj.gif',
        effect      : 2 
    },
    {
        type        : TYPE.EXPLOSIVE,
        worksIf     : RESULT.DEFEAT, 
        key         : 'bonusDeflect',
        image       : 'https://i.imgur.com/s0D11QM.gif',
        effect      : 2 
    },
    {
        type        : TYPE.VEHICLE,
        worksIf     : RESULT.DEFEAT, 
        key         : 'bonusTripMine', 
        image       : 'https://i.imgur.com/dX4F2yM.gif',
        effect      : 1 
    },
    {
        type        : TYPE.WEAPON,
        worksIf     : RESULT.DEFEAT, 
        key         : 'bonusRegen', 
        image       : 'https://i.imgur.com/cTCpzRb.gif',
        effect      : 1
    },
    {
        type        : TYPE.EXPLOSIVE,
        worksIf     : RESULT.DEFEAT, 
        key         : 'bonusBubbleShield', 
        image       : 'https://i.imgur.com/M1YMQ18.gif',
        effect      : 1 
    },
    {
        type        : TYPE.SPECIAL,
        worksIf     : RESULT.DEFEAT, 
        key         : 'bonusLag', 
        image       : 'https://i.imgur.com/BXNEURR.gif',
        effect      : 1
    },
    {
        type        : TYPE.VEHICLE,
        worksIf     : RESULT.VICTORY, 
        key         : 'bonusPassenger',
        image       : 'https://i.imgur.com/PgZdCut.gif',
        effect      : 0
    },
    {
        type        : TYPE.WEAPON,
        worksIf     : RESULT.VICTORY, 
        key         : 'bonusTeabag', 
        image       : 'https://i.imgur.com/z6PuA75.gif',
        effect      : 0
    },
    {
        type        : TYPE.EXPLOSIVE,
        worksIf     : RESULT.VICTORY, 
        key         : 'bonusTilt', 
        image       : 'https://i.imgur.com/rM7ScKG.gif',
        effect      : 0
    },
]
