const fs = require('fs')
const yaml = require('yamljs')
const path = require('path')

global.script = yaml.parse(fs.readFileSync(path.join(__dirname, 'script.yaml')).toString())

var dataStr = JSON.stringify(global.script)
var prefix = "var script = "
var suffix = "module.exports = script"
var whole = prefix + dataStr + "\n\n" + suffix
console.log(whole)

fs.writeFileSync(path.join(__dirname, 'script.js'), whole)
console.log("finished")