const script = require('./script_loader') // 使用 loader
// const script = require('./script') // 使用 导出成js的信息

function displayStage(stage, player) {
    var story = stage.story
    return displayCustom(stage, story, player)
}

function displayCustom(stage, defmsg, player) {
    defmsg = defmsg.replace("@sender", "@" + player).replace("@title", script.title)
    var template = "### [title]\n[story]\n"
    var output = template.replace("[title]", stage.chapter).replace("[story]", defmsg)
    return output
}

function proceed(stage, input, chapter) {
    var defaults = script.defaults
    var target = -1
    loop1:
        for (var i = 0; i < stage.choices.length; i++) {
            for (var j = 0; j < stage.choices[i].keywords.length; j++) {
                if (input.indexOf(stage.choices[i].keywords[j]) != -1) {
                    target = i
                    break loop1
                }
            }
        }
    if (target == -1) {
        // 处理默认回复
        loop2: for (var x = 0; x < defaults.length; x++) {
            if (defaults[x].conditions.chapter == "*" || chapter == defaults[x].conditions.chapter) {
                if (defaults[x].conditions.keywords.length == 0) {
                    target = x
                    break loop2
                }
                for (var y = 0; y < defaults[x].conditions.keywords.length; y++) {
                    if (input.indexOf(defaults[x].conditions.keywords[y]) != -1) {
                        target = x
                        break loop2
                    }
                }
            }
        }
        if (target == -1) {
            return {
                chapter: chapter,
                output: "无匹配分支，游戏树崩塌"
            }
        }

        if (defaults[target].action == "goto") {
            // 章节跳转
            console.log("默认分支 - 章节跳转")
            return {
                chapter: defaults[target].param,
                output: ""
            }
        } else if (defaults[target].action == "none") {
            // 章节不变
            console.log("默认分支 - 章节不变")
            return {
                chapter: chapter,
                output: defaults[target].description
            }
        } else {
            console.log("默认分支 - 行为异常")
            return {
                chapter: chapter,
                output: "缺省配置异常，游戏树崩塌"
            }
        }
    }
    else {
        // 选择结果
        if (stage.choices[target].action == "goto") {
            // 章节推进
            console.log("选择分支 - 章节推进")
            return {
                chapter: stage.choices[target].param,
                output: ""
            }
        } else if (stage.choices[target].action == "none") {
            // 章节不变
            console.log("选择分支 - 章节不变")
            return {
                chapter: chapter,
                output: stage.choices[target].description
            }
        } else {
            console.log("选择分支 - 行为异常")
            return {
                chapter: chapter,
                output: "行为配置异常，游戏树崩塌"
            }
        }
    }
}

function play(chapter, input, player = "player") {
    console.log("玩家:", player, "当前章节:", chapter, "输入:", input)
    var chapterAfter = chapter
    var outputText = ""
    var stage = script.stages[chapter]
    if (String(input).trim() == "") {
        // 播放当前剧情
        console.log("用户无输入，播放当前剧情")
        outputText = displayStage(stage, player)
    } else {
        // 处理用户输入
        var result = proceed(stage, input, chapter)
        if (result.chapter == chapter) {
            // 章节没有推进
            console.log("章节没有推进")
            outputText = displayCustom(stage, result.output)
        } else {
            // 章节推进了
            console.log("章节推进了～")
            var stageNext = script.stages[result.chapter]
            if (stageNext == undefined) {
                outputText = "新章节不存在"
            } else {
                outputText = displayStage(stageNext, player)
            }
        }
    }

    return {
        chapter: chapterAfter,
        output: outputText
    }
}

console.log("\n" + play("1.1", "").output)
console.log("\n" + play("1.1", "回家").output)
console.log("\n" + play("1.1", "打开").output)
console.log("\n" + play("10.1", "重置").output)
console.log("\n" + play("10.1", "帮助").output)