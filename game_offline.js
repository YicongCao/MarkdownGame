#!/usr/bin/env node

const readline = require("readline-sync")
const program = require("commander")
const path = require("path")
const loadScript = require('./script_loader') // 使用 loader
const save = require("./save_offline")
const play = require("./play")
const scriptHub = "https://github.com/YicongCao/MarkdownGame/tree/master/scripts"

program
    .version("0.0.1", "-v, --version")
    .option("-s, --script <剧本文件>", "指定剧本文件(剧本下载:<" + scriptHub + ">)")
    .option("-p, --profile <存档文件>", "指定存档文件(非必须,会自动创建)", "")
    .parse(process.argv);

var scriptFileName = program.script
var profileFileName = program.profile
if (!scriptFileName || scriptFileName == "") {
    console.error("必须指定一个剧本\n剧本获取: " + scriptHub + "\n")
    return -1
}

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

if (!profileFileName || profileFileName == "") {
    if (endsWith(scriptFileName, ".yaml")) {
        profileFileName = scriptFileName.replace(".yaml", ".save")
    } else {
        profileFileName = scriptFileName + ".save"
    }
}
// console.log("[DEBUG] args, script:", scriptFileName, "profile:", profileFileName)
var script = loadScript(scriptFileName)
if (!script) {
    console.error("剧本加载失败")
    return -1
}
var profile = save.loadFromDisk(profileFileName)
// 新开存档
if (profile == undefined) {
    var player = readline.question("\n> 请输入您的大名: ")
    if (player == undefined || String(player).trim() == "") {
        console.log("那就用默认名称吧～")
        player = "玩家"
    }
    profile = {
        player: player,
        chapter: "1.1",
        variables: {},
        inputs: []
    }
    save.saveToDisk(profileFileName, profile)
}
// 继续游戏
var scene = play("", profile, script)
console.log(scene.output)
while (true) {
    var input = readline.question("\n> 请输入您的操作: ")
    if (input == "exit" || input == "quit" || input == "退出") {
        break
    }
    // 对局
    profile.inputs.push(input)
    save.saveToDisk(profileFileName, profile)
    scene = play(input, profile, script)
    // 存档
    profile.chapter = scene.chapter
    profile.variables = scene.variables
    save.saveToDisk(profileFileName, profile)
    // 展示剧情
    console.log("-----------------")
    console.log(scene.output)
}