const fs = require('fs')
const yaml = require('yamljs')
const path = require('path')

global.script = yaml.parse(fs.readFileSync(path.join(__dirname, 'script.yaml')).toString())

console.log(JSON.stringify(global.script))