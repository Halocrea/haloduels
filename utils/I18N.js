const fs = require('fs')

class I18N {
    constructor (langKey = 'en') {
        try {
            const langFile      = fs.readFileSync(`i18n/${langKey}.json`, 'utf8')
            this.translations   = JSON.parse(langFile)
        } catch (err) {
            const langFile      = fs.readFileSync('i18n/en.json', 'utf8')
            this.translations   = JSON.parse(langFile)
        }
    }

    get (key, args = {}, amount = 1) {
        let value = this.translations[key] || key
        for (const a in args) {
            const regex = new RegExp(`{${a}}`, 'g')
            value       = value.replace(regex, args[a])
        }

        if (value.indexOf(' | ') >= 0) {
            const valueArr = value.split(' | ')
            if (amount <= 1) 
                value = valueArr[0]
            else 
                value = valueArr[1]
        }

        return value 
    }
}

module.exports = I18N
