const fs = require('fs')
const yaml = require('yamljs')
const path = require('path')

function loadScript(fileName) {
    var fullPath = path.join(path.resolve('./'), fileName)
    // console.log("[DEBUG] script full path:", fullPath)
    if (!fs.existsSync(fullPath)) {
        console.error("[DEBUG] script file not found")
        return undefined
    }
    try {
        var script = yaml.parse(fs.readFileSync(fullPath).toString())
        return script
    } catch (e) {
        console.error("[DEBUG] script parse failed", e)
        return undefined
    }
}

module.exports = loadScript