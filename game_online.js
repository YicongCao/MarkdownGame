const botsdk = require("@tencent/botsdk")
const play = require("./play")
const save = require("./save_online")

module.exports = async function (context) {
    // 上下文
    var respMsg = ""
    // 初始化 SDK
    var online = new botsdk.OnlineServiceFactory();
    var initSDKResult = await online.init(context);
    if (initSDKResult) {
        console.log("init sdk succ\n======\n");
        var kv = online.createStorageService()
        var msg = online.getMessage()
        msg.message = msg.message.replace("@科兴大冒险", "").trim()
        // 检查存档
        var chapter = await save.loadFromCloud(kv, msg.sender)
        console.log(msg.sender, "at pre:", chapter)
        if (chapter === undefined) {
            console.log(msg.sender, "create new: 1.1")
            chapter = "1.1"
        }
        // 处理用户输入
        console.log(msg.sender, "at suf:", chapter)
        console.log(msg.sender, "inputs:", msg.message)
        var scene = play(chapter, msg.message.trim(), msg.sender)
        respMsg = scene.output
        // 存档
        var saveRet = await save.saveToCloud(kv, msg.sender, scene.chapter)
        console.log(msg.sender, "save result:", saveRet)
        console.log(msg.sender, "arrives:", scene.chapter)
    } else {
        console.log("init sdk fail");
        respMsg = "SDK OL Init Failed"
    }
    // 返回结果
    return online.makeMarkdownResponse(respMsg)
};