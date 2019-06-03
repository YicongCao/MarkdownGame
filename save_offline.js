const fs = require('fs')
const yaml = require('yamljs')
const path = require('path')

function loadFromDisk(fileName) {
    var filename = path.join(path.resolve('./'), fileName)
    if (!fs.existsSync(filename)) {
        return undefined
    }
    var sve = yaml.parse(fs.readFileSync(filename).toString())
    return sve
}

function saveToDisk(fileName, progress) {
    // console.log("[DEBUG] saving to:", fileName)
    fs.writeFileSync(path.join(path.resolve('./'), fileName), yaml.stringify(progress))
}

module.exports = {
    loadFromDisk: loadFromDisk,
    saveToDisk: saveToDisk
}