const readline = require('readline-sync');
const play = require("./play")
const save = require("./save_offline")

var profile = save.loadFromDisk()
// 新开存档
if (profile == undefined) {
    var player = readline.question("请输入您的大名: ")
    if (player == undefined || player == "") {
        console.log("那就用默认名称吧～")
        player = "玩家"
    }
    profile = {
        player: player,
        chapter: "1.1",
        variables: {}
    }
    save.saveToDisk(profile)
}
// 继续游戏
var scene = play("", profile)
console.log(scene.output)
while (true) {
    var input = readline.question("请输入您的操作: ")
    if (input == "exit" || input == "quit" || input == "退出") {
        break
    }
    // 对局
    scene = play(input, profile)
    // 存档
    profile.chapter = scene.chapter
    profile.variables = scene.variables
    save.saveToDisk(profile)
    // 展示剧情
    console.log(scene.output)
}
console.log("游戏即将退出")