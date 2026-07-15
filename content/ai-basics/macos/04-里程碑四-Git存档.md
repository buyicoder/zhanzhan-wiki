---
title: 里程碑四：用 Git 给 Agent 的修改建立存档
provenance: 课程原文
maturity: 长青
content_type: 教程
reader_path: ai-basics
platform: macos
course_order: 04
---
> **阶段目标：** 获得「让 AI 大胆改，我随时能后悔」的安全网。
> **阶段成功标志：** 能在 Agent 修改前后检查项目、创建存档、恢复错误修改，并让 Agent 在分支中安全试错。
> **⏱️ 预计总用时：** 120 分钟

## 为什么需要 Git

假设你在用 Agent 写项目。第一天，程序能跑；第二天你让 AI 加个功能，程序坏了。你想回到第一天的状态——但 AI 改了很多文件，你不知道它改了什么，也不知道该恢复哪些。

再比如你写文章：改一版存一个「文章2.0」「文章3.0」，文件夹越来越乱，还不敢删——你其实在手工做「版本管理」。

Git 就是干这个的软件。把它理解为**游戏存档系统**：

```text
项目当前状态 → 创建存档点 → 继续修改 → 新存档点 → 随时查看或恢复任何存档
```

所有历史版本都藏在项目里一个隐藏的 `.git` 文件夹中，你平时看到的只是当前版本。

> 💡 学习目标不是背命令。AI 时代学 Git 的核心是：**不是成为 Git 专家，而是让 AI 可以大胆修改，同时自己永远保留回到上一版本的能力。**

---

## 4.1 建立第一个 Git 仓库

### 任务 1：检查 Git

🎯 **成功标志：** 终端输出 `git version` 和版本号，而不是「找不到命令」。

```bash
git --version
```

看到类似 `git version 2.50.1` 即通过。

> ⚠️ 提示找不到命令 → 把完整报错发给 WorkBuddy，让它安装或修复，再运行一次直到出现版本号。

### 任务 2：创建练习项目

🎯 **成功标志：** `git-practice` 文件夹里出现 `intro.txt`，内容是「这是我的第一个 Git 项目」。

在 WorkBuddy 中输入：

```text
在 `zhanzhan-ai-course` 文件夹中创建一个叫 `git-practice` 的文件夹，并在里面创建 `intro.txt`，写入"这是我的第一个 Git 项目"。不要执行 Git 命令。
```

亲自打开文件夹和文件确认。

> 💡 注意提示词里的「不要执行 Git 命令」——Git 操作这一章要**全部亲手做**。手感只能自己练出来。

### 任务 3：初始化仓库

🎯 **成功标志：** `git status` 显示 `On branch main`，`intro.txt` 出现在 `Untracked files`，而不是 `not a git repository`。

在 `git-practice` 文件夹中打开终端，输入：

```bash
git init
git branch -M main
git status
```

📸 截图 M4-3-1：git status 输出，Untracked files 区圈红

🔍 **刚才发生了什么**
`git init` 在项目里创建了隐藏的 `.git` 文件夹（想看的话：访达中按 Cmd + Shift + . 显示隐藏文件）。`Untracked` 的意思是「Git 发现了这个文件，但还没开始记录它」。另外记住：**`git status` 永远安全**——它只汇报状态、不改任何东西，可以随便运行。

---

## 4.2 创建第一个存档

Git 存档分两步：先**选择**要存档的文件（`git add`），再**正式存档**（`git commit`）。

### 任务 4：配置存档身份

🎯 **成功标志：** `git config user.name` 和 `git config user.email` 分别输出你设置的值。

```bash
git config user.name "你的名字"
git config user.email "你的邮箱"
git config user.name
git config user.email
```

> 💡 这里设置的只是「存档上的署名」，不是注册账号，也不会自动上传到互联网。

### 任务 5：把文件加入暂存区

🎯 **成功标志：** `intro.txt` 从红色变绿色，出现在 `Changes to be committed` 下方。

```bash
git add intro.txt
git status
```

### 任务 6：预览即将存档的内容

```bash
git diff --staged
```

🎯 **成功标志：** 输出中能看到 `intro.txt` 和第一行文字，新增行前面带 `+`。

### 任务 7：正式创建存档

🎯 **成功标志：** `git log --oneline` 出现「创建第一个 Git 项目」。

```bash
git commit -m "创建第一个 Git 项目"
git status          # 应显示 nothing to commit, working tree clean
git log --oneline   # 应显示一条存档记录
```

📸 截图 M4-7-1：commit + status + log 三连输出

🔍 **刚才发生了什么**
`-m` 后面是「存档说明」——写给三个月后的自己看的。`working tree clean` 是 Git 世界里最安心的一句话：当前状态和最新存档完全一致，没有未保存的修改。

🔬 **深入一层：为什么要有暂存区？**
add 和 commit 分两步，是为了让你**挑着存**：改了 5 个文件，可以只把其中 2 个放进这次存档。就像搬家打包，先把要打包的放进箱子（add），再封箱贴标签（commit）。

---

## 4.3 观察和保存 Agent 的修改

### 任务 8：让 Agent 修改，你来检查

🎯 **成功标志：** `git status` 把 `intro.txt` 标记为 `modified`，`git diff` 清楚显示 Agent 新增的那一行。

1. 让 WorkBuddy 执行：

   ```text
   在 git-practice/intro.txt 最后一行增加"我正在学习如何使用 Git"，不要执行任何 Git 命令。
   ```

2. 亲自运行：

   ```bash
   git status
   git diff
   ```

   📸 截图 M4-8-1：git diff 输出，+ 开头的新增行圈绿

🔍 **刚才发生了什么**
`git diff` 不只告诉你「文件变了」，还告诉你**具体哪一行**变了。这是你审查 AI 修改的透视镜——从此 AI 改了什么，一目了然。

### 任务 9：创建第二个存档

🎯 **成功标志：** `git log --oneline` 恰好两条记录，新的在上、旧的在下。

```bash
git add intro.txt
git diff --staged
git commit -m "记录 Git 学习进度"
git log --oneline
```

---

## 4.4 恢复错误修改（后悔药）

### 任务 10：主动把文件改坏

1. 让 WorkBuddy 执行：

   ```text
   删除 intro.txt 中的所有内容，改成"这个文件已经被改坏了"。不要执行 Git 命令。
   ```

2. 运行 `git diff`，确认 Git 同时显示：旧内容被删除（`-` 行）、错误内容被加入（`+` 行）。

### 任务 11：一键恢复

🎯 **成功标志：** 错误文字消失，文件回到上次存档的两行内容，`git status` 重新显示 clean。

```bash
git restore intro.txt
```

打开 `intro.txt` 亲眼确认，再跑 `git status`。

> ⚠️ **`git restore` 会丢弃所有尚未存档的修改，且无法撤销。** 运行前必须先 `git diff` 看清楚要丢弃的是什么。

### 任务 12：取消暂存 ≠ 删除修改

🎯 **成功标志：** `git restore --staged` 之后，新增文字**还在文件里**，只是回到了「已修改但未暂存」状态。

1. 给 `intro.txt` 手动加一行：`这是一段暂时不想存档的内容`
2. 依次运行：

   ```bash
   git add intro.txt
   git status                        # 进入暂存区（绿色）
   git restore --staged intro.txt
   git status                        # 回到未暂存（红色），内容未丢
   ```

🔍 **刚才发生了什么**

```text
git restore --staged  = 取消"准备存档"，修改还在
git restore           = 丢弃修改，回到上次存档
```

一个是把东西从打包箱里拿出来，一个是直接扔掉。分清这两个，你就不会误伤自己的工作了。

---

## 4.5 在分支中安全试错

### 任务 13：创建实验分支

🎯 **成功标志：** `git branch` 显示 `main` 和 `experiment` 两个分支，`*` 在 `experiment` 前面。

确认当前修改已提交（`git status` 是 clean），然后：

```bash
git switch -c experiment
git branch
```

### 任务 14：在实验分支修改并提交

1. 让 WorkBuddy 执行：

   ```text
   在 intro.txt 中增加一行"这段内容来自 experiment 分支"，不要执行 Git 命令。
   ```

2. 亲自提交：

   ```bash
   git add .
   git commit -m "在实验分支增加内容"
   ```

### 任务 15：见证平行世界

🎯 **成功标志：** 切到 `main` 时实验文字**消失**；切回 `experiment` 时它**重新出现**。

```bash
git switch main        # 打开 intro.txt：实验行不见了
git switch experiment  # 再打开：实验行回来了
```

📸 截图 M4-15-1：两个分支下同一文件的对比

🔍 **刚才发生了什么**
分支不是抽象概念，而是**同一个项目的不同版本平行存在**。让 AI 在实验分支里随便折腾，主分支永远是安全的。

### 任务 16：合并实验成果

🎯 **成功标志：** `main` 里也能看到实验文字，`git status` clean，日志保留实验提交。

```bash
git switch main
git merge experiment
git log --oneline
```

---

## 本章最重要的产出：一套固定动作

从今天起，凡是让 AI 改项目，肌肉记忆是：

```text
Agent 修改前：git status     （确认干净的起点）
Agent 修改后：git diff       （看清它改了什么）
确认正确：   git add + git commit
高风险实验： 先创建分支
出现错误：   先 git diff 看差异，再决定是否 git restore
```

## 里程碑四 · 毕业检查

- [ ] git-practice 里至少有两次存档、一个实验分支、一次合并记录
- [ ] 我能说出 status / diff / add / commit / restore / switch 各自干什么
- [ ] 我分得清 `restore` 和 `restore --staged`
- [ ] 上面那套固定动作我能不看手册背出来

**下一站 →** [[ai-basics/macos/05-里程碑五-GitHub协作|里程碑五：用 GitHub 保存项目和参与协作]]
