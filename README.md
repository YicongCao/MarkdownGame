# 科兴大冒险

欢迎来到**科兴大冒险**，这是一个**文字冒险游戏**，你通过输入**动作**或**指令**来推进剧情、获取帮助。这个游戏讲述的是发生在科兴科学园的深夜加班故事，也许你就是这个故事的见证者，见证无数互联网人的苦乐悲欢。希望这个游戏能为加班一族带来些许快乐。

## 使用方法

准备一个 node.js 的运行环境，然后运行 `game_offline.js` 即可。

```bash
npm install
node game_offline.js
```

## 代码结构

```bash
├── game_offline.js  # 进行游戏
├── package.json
├── play.js     # 对局逻辑
├── save.js     # 存档逻辑
├── script.yaml # 剧本
├── script_export.js    # 剧本 yaml 转 json 的工具（可选）
└── script_loader.js    # 加载 yaml 剧本的工具（默认）
```