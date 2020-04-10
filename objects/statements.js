// ex. const result = statements[victory][type]().replace('{opponent}', opponentName)
module.exports = [
    // defeats
    [
        () => 'a été tué par {opponent} à coups',
        () => 'a été écrasé par {opponent} avec',
        () => 's\'est fait exploser par {opponent} avec',
        () => {
            const specialStatements = [
                '<!https://i.imgur.com/07GvywA.gif>s\'est fait refaire le portrait par {opponent} à coups de Fusil Sniper',
                '<!https://i.imgur.com/2p3HCx2.gif>s\'est fait refaire le portrait par {opponent} à coups de Needler',
                '<!https://i.imgur.com/ZIfiTGO.gif>a été tué par les Gardiens',
                '<!https://i.imgur.com/5geK2iE.gif>s\'est suicidé en essayant de tuer {opponent}. Pas d\'bol',
                '<!https://i.imgur.com/Jn5oKER.gif>s\'est fait "accidentellement" trahir par Mr Dioss',
                '<!https://i.imgur.com/UKNF8KX.gif>s\'est pris un sombrero en voulant assassiner {opponent}'
            ]

            return specialStatements[Math.floor(Math.random() * specialStatements.length)]
        }
    ],
    // victories
    [
        // 0 = weapon, 1 = vehicle, 2 = explosive, 3 = special
        () => 'a tué {opponent} à coups',
        () => 'a écrasé {opponent} avec',
        () => 'a explosé {opponent} avec',
        () => {
            const specialStatements = [
                '<!https://i.imgur.com/07GvywA.gif>a refait le portrait de {opponent} à coups de Fusil Sniper',
                '<!https://i.imgur.com/2p3HCx2.gif>a refait le portrait de {opponent} à coups de Needler',
                '<!https://i.imgur.com/2x3jBoC.gif>a laserisé {opponent}',
                '<!https://i.imgur.com/3IYR0UR.gif>a réussi à tuer {opponent} à coups de Pistolet plasma. Quel badass',
                '<!https://i.imgur.com/zqbRHw3.gif>a assassiné {opponent}'
            ]

            return specialStatements[Math.floor(Math.random() * specialStatements.length)]
        }
    ]
]
