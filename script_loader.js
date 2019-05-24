const fs = require('fs')
const yaml = require('yamljs')
const path = require('path')

var script = yaml.parse(fs.readFileSync(path.join(__dirname, 'script.yaml')).toString())

// console.log(JSON.stringify(script))

module.exports = script