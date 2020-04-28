// ex. const result = get(RESULT.VICTORY, TYPE.WEAPON, opponent)
class Statements {
    constructor (translations) {
        this.$t         = translations
        
        // 0 = defeat, 1 = victory
        this.statements = [
            [
                // 0 = weapon, 1 = vehicle, 2 = explosive, 3 = special
                opponent => this.$t.get('wasKilledBy', { opponent }),
                opponent => this.$t.get('wasSplatteredBy', { opponent }),
                opponent => this.$t.get('wasExplodedBy', { opponent }),
                opponent => {
                    const specialStatements = [
                        opponent => this.$t.get('specialSniperLoss', { opponent }),
                        opponent => this.$t.get('specialNeedlerLoss', { opponent }),
                        opponent => this.$t.get('specialGuardians', { opponent }),
                        opponent => this.$t.get('specialSuicide', { opponent }),
                        opponent => this.$t.get('specialBetrayal', { opponent }),
                        opponent => this.$t.get('specialSombrero', { opponent })
                    ]
        
                    return specialStatements[Math.floor(Math.random() * specialStatements.length)](opponent)
                }
            ],
            [
                // 0 = weapon, 1 = vehicle, 2 = explosive, 3 = special
                opponent => this.$t.get('killed', { opponent }),
                opponent => this.$t.get('splattered', { opponent }),
                opponent => this.$t.get('exploded', { opponent }),
                opponent => {
                    const specialStatements = [
                        opponent => this.$t.get('specialSniperWin', { opponent }),
                        opponent => this.$t.get('specialNeedlerWin', { opponent }),
                        opponent => this.$t.get('specialLaser', { opponent }),
                        opponent => this.$t.get('specialPlasmaPistol', { opponent }),
                        opponent => this.$t.get('specialAssassination', { opponent })
                    ]
        
                    return specialStatements[Math.floor(Math.random() * specialStatements.length)](opponent)
                }
            ]
        ]
    }

    get (resultIdx, typeIdx, opponent) {
        return this.statements[resultIdx][typeIdx](opponent)
    }
}

module.exports = Statements
