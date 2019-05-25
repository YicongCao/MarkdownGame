const script = require('./script_loader') // 使用 loader
// const script = require('./script') // 使用 导出成js的信息

// 显示章节剧情
function displayStage(stage, player) {
    var story = stage.story
    return displayCustom(stage, story, player)
}

// 显示自定内容
function displayCustom(stage, defmsg, player) {
    defmsg = defmsg.replace("@sender", "@" + player).replace("@title", script.title)
    var template = '#### [title]\n[story]\n'
    var output = template.replace("[title]", stage.chapter).replace("[story]", defmsg)
    return output
}

// 判定相等
function chapterMatch(template, compare) {
    if (template == undefined || template.trim() == "*") {
        return true
    } else if (template.indexOf(".*") != -1) {
        template = template.replace(".*", "").trim()
        var templateNum = Number(template)
        var compareNum = Number(compare)
        return (templateNum - compareNum) * (templateNum - compareNum) < 1
    } else {
        return template.trim() == compare.trim()
    }
}

// 根据输入推进剧情
function proceed(stage, input, chapter, vars) {
    var defaults = script.defaults
    var dynamics = script.dynamics
    var variables = script.variables
    // 处理剧情选项/默认回复
    var process = function (choice) {
        var ret = {
            chapter: chapter,
            output: "",
            variables: vars
        }
        // 执行行动
        if (choice.action == "goto") {
            // 章节推进
            ret.chapter = choice.param
        } else if (choice.action == "none") {
            // 章节不变
            ret.output = choice.description
        } else if (choice.action == "incr") {
            // 变量增加，章节不变
            vars[choice.param] = vars[choice.param] == undefined ? 1 : vars[choice.param] + 1
            ret.output = choice.description
            ret.variables = vars
        } else if (choice.action == "decr") {
            // 变量减少，章节不变
            vars[choice.param] = vars[choice.param] == undefined ? 0 : vars[choice.param] - 1
            ret.output = choice.description
            ret.variables = vars
        } else if (choice.action == "reset") {
            ret.chapter = "1.1"
            ret.variables = {}
        } else {
            console.log("choice action exception")
            ret.output = "行为配置异常，游戏树崩塌"
        }
        // 匹配动态条件
        // phase 0: 过滤章节条件
        var found = false
        dynamics.forEach((dynamic) => {
            if (chapterMatch(dynamic.conditions.chapter, ret.chapter)) {
                found = true
            }
        })
        if (!found) {
            return ret
        }
        // phase 1: 生成变量环境
        var cmdLine = ""
        variables.forEach(element => {
            cmdLine += "var " + element + " = " + ret.variables[element] + "\n"
        })
        // phase 2: 执行检查条件
        var targetDynamic = -1
        dynamics.forEach((dynamic, i) => {
            var bool = eval(cmdLine + dynamic.conditions.expression)
            // 确保最后选中最先匹配到的条件
            if (bool && targetDynamic == -1) {
                targetDynamic = i
            }
        })
        if (targetDynamic == -1) {
            return ret
        }
        // 执行动态条件
        // 注意: 执行 incr、decr 这两种反过来又影响了变量的条件行为时，可以改写代码，来允许再次推导动态条件。但这可能引起死循环。
        if (dynamics[targetDynamic].action == "goto") {
            // 章节推进
            ret.chapter = dynamics[targetDynamic].param
        } else if (dynamics[targetDynamic].action == "none") {
            // 章节不变
            ret.output = dynamics[targetDynamic].description
        } else if (dynamics[targetDynamic].action == "incr") {
            // 变量增加，章节不变
            vars[dynamics[targetDynamic].param] = vars[dynamics[targetDynamic].param] == undefined ? 1 : vars[dynamics[targetDynamic].param] + 1
            ret.output = dynamics[targetDynamic].description
            ret.variables = vars
        } else if (dynamics[targetDynamic].action == "decr") {
            // 变量减少，章节不变
            vars[dynamics[targetDynamic].param] = vars[dynamics[targetDynamic].param] == undefined ? 0 : vars[dynamics[targetDynamic].param] - 1
            ret.output = dynamics[targetDynamic].description
            ret.variables = vars
        } else {
            console.log("dynamic action exception")
            ret.output = "动态条件配置异常，游戏树崩塌"
        }
        return ret
    }
    // 查找剧情选项
    var target = -1
    loop1:
        for (var i = 0; i < stage.choices.length; i++) {
            if (stage.choices[i].keywords.length == 0) {
                target = i
                break loop1
            }
            for (var j = 0; j < stage.choices[i].keywords.length; j++) {
                if (input.indexOf(stage.choices[i].keywords[j]) != -1) {
                    target = i
                    break loop1
                }
            }
        }
    // 遍历缺省选项
    if (target == -1) {
        // 查找缺省回复
        loop2: for (var x = 0; x < defaults.length; x++) {
            if (chapterMatch(defaults[x].conditions.chapter, chapter)) {
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
                output: "无匹配分支，游戏树崩塌",
                variables: vars
            }
        }
        // 执行缺省回复
        return process(defaults[target])
    }
    // 处理章节选项
    else {
        // 执行选择
        return process(stage.choices[target])
    }
}

// 玩
function play(input, profile) {
    var chapter = profile.chapter
    var player = profile.player
    var vars = profile.variables
    // console.log("玩家:", player, "当前章节:", chapter, "输入:", input)
    var chapterAfter = chapter
    var outputText = ""
    var stage = script.stages[chapter]
    if (String(input).trim() == "") {
        // 播放当前剧情
        // console.log("用户无输入，播放当前剧情")
        outputText = displayStage(stage, player)
    } else {
        // 处理用户输入
        var result = proceed(stage, input, chapter, vars)
        chapterAfter = result.chapter
        vars = result.variables
        if (result.chapter == chapter) {
            // 章节没有推进
            // console.log("章节没有推进")
            if (result.output == "") {
                outputText = displayStage(stage, player)
            } else {
                outputText = displayCustom(stage, result.output, player)
            }
        } else {
            // 章节推进了
            // console.log("章节推进了～")
            var stageNext = script.stages[chapterAfter]
            if (stageNext == undefined) {
                outputText = "新章节不存在"
            } else {
                outputText = displayStage(stageNext, player)
            }
        }
    }

    return {
        chapter: chapterAfter,
        output: outputText,
        variables: vars
    }
}

module.exports = play

// console.log("\n" + play("1.1", "").output)
// console.log("\n" + play("1.1", "回家").output)
// console.log("\n" + play("1.1", "打开").output)
// console.log("\n" + play("10.1", "重置").output)
// console.log("\n" + play("10.1", "帮助").output)