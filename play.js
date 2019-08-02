var script = undefined

// 显示章节剧情
function displayStage(stage, player, vars) {
    var story = stage == undefined ? "该小节没有故事" : stage.story
    return displayCustom(stage, story, player, vars)
}

// 显示自定内容
function displayCustom(stage, defmsg, player, vars) {
    defmsg = defmsg.replace("@sender", "@" + player).replace("@title", script.title)
    Object.keys(vars).forEach(function (key) {
        defmsg = defmsg.replace("@" + key, vars[key])
    })
    Object.keys(script.constants).forEach(function (key) {
        defmsg = defmsg.replace("@" + key, script.constants[key])
    })
    var template = '#### [title]\n[story]\n'
    var output = template.replace("[title]", stage == undefined ? "未知章节" : stage.chapter).replace("[story]", defmsg)
    return output
}

// 判定相等
// "1.1" == "1.1"
// "2.2" == "2.*"
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
    input = String(input).toLowerCase()
    // 处理剧情选项/默认回复
    var process = function (choice) {
        var ret = {
            chapter: chapter,
            output: "",
            variables: vars
        }
        // 记录回合数: rounds
        var roundsVar = "rounds"
        if (variables.indexOf(roundsVar) != -1) {
            vars[roundsVar] = vars[roundsVar] == undefined ? 0 : vars[roundsVar] + 1
            ret.variables = vars
        }
        // 动态执行代码
        var evalEx = function (cmd, savechg = false) {
            var cmdLines = []
            // 因为需要初始化所有变量，所以要遍历整个变量声明列表
            variables.forEach(element => {
                cmdLines.push("var " + element + " = " + JSON.stringify(ret.variables[element]))
            })
            // 常量
            Object.keys(script.constants).forEach((key) => {
                cmdLines.push("var " + key + " = " + JSON.stringify(script.constants[key]))
            })
            cmdLines.push(cmd)
            var cmdCode = cmdLines.join(";\n")
            // console.log("\n[evalex begin]\n", cmdCode, "\n[evalex end]\n")
            var evalRet = eval(cmdCode)
            // 原地保存修改
            if (savechg) {
                variables.forEach(element => {
                    if (element != undefined && element != "") {
                        vars[element] = eval(element)
                    }
                })
            }
            return evalRet
        }
        // 执行该选项的行动
        var execute = function (choice) {
            var varChanged = false
            // action 可以是 list(一组动作)、string(单个动作)
            // param 的类型和长度要和 action 保持一致
            var actionSet, paramSet
            if (typeof choice.action == "string") {
                actionSet = [choice.action]
                paramSet = [String(choice.param)]
            } else if (typeof choice.action == "object" &&
                choice.action instanceof Array == true) {
                actionSet = choice.action
                paramSet = choice.param
            } else {
                console.log("choice action exception")
                return varChanged
            }
            // 执行
            actionSet.forEach((action, index) => {
                if (action == "goto") {
                    // 章节推进
                    ret.chapter = String(paramSet[index])
                } else if (action == "gotox") {
                    var chapterNext = evalEx(paramSet[index])
                    ret.chapter = String(chapterNext)
                } else if (action == "none") {
                    // 章节不变
                    ret.output = choice.description
                } else if (action == "incr") {
                    // 变量增加，章节不变
                    varChanged = true
                    vars[paramSet[index]] = vars[paramSet[index]] == undefined ? 1 : vars[paramSet[index]] + 1
                    ret.output = choice.description
                    ret.variables = vars
                } else if (action == "decr") {
                    // 变量减少，章节不变
                    varChanged = true
                    vars[paramSet[index]] = vars[paramSet[index]] == undefined ? 0 : vars[paramSet[index]] - 1
                    ret.output = choice.description
                    ret.variables = vars
                } else if (action == "calc") {
                    // 变量运算，章节不变
                    varChanged = true
                    // 要对哪个变量做运算
                    var varName = ""
                    variables.forEach(element => {
                        if (paramSet[index].indexOf(element) != -1) {
                            varName = element
                        }
                    })
                    if (varName != "") {
                        vars[varName] = evalEx(paramSet[index])
                    }
                    ret.output = choice.description
                    ret.variables = vars
                } else if (action == "eval") {
                    // 变量运算，章节不变
                    varChanged = true
                    // 原地保存结果
                    evalEx(paramSet[index], true)
                    ret.output = choice.description
                    ret.variables = vars
                } else if (action == "reset") {
                    // 重置章节到开头，清空变量环境
                    ret.chapter = "1.1"
                    ret.variables = {}
                } else {
                    console.log("choice action exception")
                    ret.output = "行为配置异常，游戏树崩塌"
                }
            })
            return varChanged
        }
        // 执行选项
        execute(choice)
        // 匹配动态条件
        // phase 0: 检查章节条件
        var found = false
        dynamics.forEach((dynamic) => {
            if (chapterMatch(dynamic.conditions.chapter, ret.chapter)) {
                found = true
            }
        })
        if (!found) {
            return ret
        }
        // phase 1: 检查动态条件
        var targetDynamic = -1
        dynamics.forEach((dynamic, i) => {
            var bool = evalEx(dynamic.conditions.expression)
            // 确保最后选中最先匹配到的条件
            if (bool && targetDynamic == -1) {
                targetDynamic = i
            }
        })
        if (targetDynamic == -1) {
            return ret
        }
        // 执行动态条件
        // 注意: 执行 incr、decr、calc 这两种反过来又影响了变量的条件行为时，可以改写代码，来允许再次推导动态条件。但这可能引起死循环。
        execute(dynamics[targetDynamic])
        return ret
    }
    // 查找剧情选项
    var target = -1
    loop1:
        for (var i = 0; stage != undefined && i < stage.choices.length; i++) {
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
function play(input, profile, scriptObj) {
    script = scriptObj
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
        outputText = displayStage(stage, player, vars)
    } else {
        // 处理用户输入
        var result = proceed(stage, input, chapter, vars)
        chapterAfter = result.chapter
        vars = result.variables
        if (result.chapter == chapter) {
            // 章节没有推进
            // console.log("章节没有推进")
            if (result.output == "") {
                outputText = displayStage(stage, player, vars)
            } else {
                outputText = displayCustom(stage, result.output, player, vars)
            }
        } else {
            // 章节推进了
            // console.log("章节推进了～")
            var stageNext = script.stages[chapterAfter]
            if (stageNext == undefined) {
                outputText = "新章节不存在"
            } else {
                outputText = displayStage(stageNext, player, vars)
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