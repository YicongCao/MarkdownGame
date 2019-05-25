const fs = require('fs')
const yaml = require('yamljs')
const path = require('path')

function loadFromDisk() {
    var filename = path.join(__dirname, 'save.yaml')
    if (!fs.existsSync(filename)) {
        return undefined
    }
    var sve = yaml.parse(fs.readFileSync(filename).toString())
    return sve
}

function saveToDisk(progress) {
    fs.writeFileSync(path.join(__dirname, 'save.yaml'), yaml.stringify(progress))
}

module.exports = {
    loadFromDisk: loadFromDisk,
    saveToDisk: saveToDisk
}