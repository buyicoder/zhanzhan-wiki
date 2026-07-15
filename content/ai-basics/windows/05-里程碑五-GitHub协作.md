---
title: 里程碑五：用 GitHub 保存项目和参与协作
provenance: 课程原文
maturity: 长青
content_type: 教程
reader_path: ai-basics
platform: windows
course_order: 05
---
> **阶段目标：** 把项目送上云端，学会「需求驱动开发」的协作方式，并开始积累你的第一批数字资产。
> **阶段成功标志：** 能把本地项目上传 GitHub、在别的文件夹重新下载运行，并完成一次 Issue → 分支 → Pull Request → 合并 的完整协作闭环。
> **⏱️ 预计总用时：** 150–180 分钟
> 🔗 快捷网址：GitHub https://github.com ｜ 注册 https://github.com/signup ｜ 新建仓库 https://github.com/new

## GitHub 是什么，为什么值得你认真对待

GitHub 是帮你管理**远程仓库**的网站。把项目推送上去，它有四层价值，一层比一层大：

1. **保险柜**：工作电脑坏了，项目还在。养成「做完一段就推送」的习惯，你可以随时换电脑工作。
2. **协作场**：别人可以复制（Fork）你的仓库、做修改、请求合并（Pull Request）。你同意后，你们就成了共同开发者。被采纳的 PR 叫「贡献」。
3. **军火库**：GitHub 上有巨量开源项目。**每次让 AI 解决工程问题之前，先检索有没有现成的成熟方案。** 开源贡献者比你想象的更热情——开源精神万岁！
4. **你的名片**：你做过的所有项目都在 GitHub 上可查——它们是你的个人资产、能力证明和成长记录。马斯克说 "Show me your code"，很多人的简历就是 GitHub 主页。

> 💡 从今天开始，把你的所有项目推送到 GitHub 上。这句话在里程碑八会再次出现，那时它的分量你会看得更清楚。

---

## 5.1 认识 GitHub

### 任务 1：看懂一个 GitHub 项目

🎯 **成功标志：** 能亲手点开一个项目的 README、任意文件、Commits 记录和下载入口。
⏱️ 预计用时：20 分钟

**操作步骤**

1. 注册并登录 GitHub（🔗 https://github.com/signup）。
   > 📸 操作截图尚未补齐：注册页
2. 打开一个简单的开源项目，找到：
   - 项目名称和简介
   - `README.md`（项目说明书，页面下方自动展示）
   - `Commits`（点进去看这个项目经历过哪些修改）
   - 任意一个 commit（绿色 = 新增的行，红色 = 删除的行）
   - 绿色 `Code` 按钮（下载入口，先不要下载）
   > 📸 操作截图尚未补齐：项目主页各区域标注图
   > 📸 操作截图尚未补齐：一个 commit 的红绿对比图
**挑战：** 说出这个项目最近一次修改的标题、改了哪个文件、指出至少一行红色或绿色。

### 任务 2：六个概念配对

🎯 **成功标志：** 不看答案，给下面六个概念各配一个正确用途。

| 概念 | 用途（先遮住右边自测） |
|------|------|
| 公开仓库 | 所有人可见，展示和分享 |
| 私有仓库 | 只有自己和受邀者可见 |
| 开源 | 公开源代码，允许别人使用和改进 |
| Issue | 提出问题或需求的「工单」 |
| Fork | 复制别人的仓库到自己名下 |
| Pull Request | 请求把自己的修改合并进对方项目 |

---

## 5.2 上传和同步自己的项目

### 任务 3：创建第一个远程仓库

🎯 **成功标志：** GitHub 出现名为 `ai-beginner-practice` 的仓库，带 `Private` 标识，页面给出仓库地址。

**操作步骤**

1. 打开 🔗 https://github.com/new
2. 仓库名：`ai-beginner-practice`；描述：`我的AI小白实战练习`
3. 选择 **Private**（练习内容不必公开）
4. **不要**勾选自动创建 README
5. 点 `Create repository`，看到一页上传指引——这就是你的远程仓库地址所在页。
   📸 截图 M5-3-1：新建仓库表单（Private 圈红）
   📸 截图 M5-3-2：创建后的指引页（仓库地址圈红）

🔍 **刚才发生了什么**
你在云端建了一个**空**仓库。本地文件还没上传——远程仓库和本地仓库是两个独立的存在，接下来要把它们连起来。

### 任务 4：连接本地与远程

🎯 **成功标志：** `git remote -v` 显示两行 `origin`，地址与你刚创建的仓库一致。

在包含 `add.py`、`max.py` 的练习文件夹终端中：

```bash
git remote add origin 你的仓库地址
git remote -v
```

然后让 WorkBuddy 检查：

```text
检查当前项目是否已经连接到我的 GitHub 仓库，只检查，不要上传或修改文件。
```

### 任务 5：第一次上传（push）

🎯 **成功标志：** 刷新 GitHub 页面，能看到 `add.py`、`max.py` 和 README。

```bash
git status
git log --oneline
git branch -M main
git push -u origin main
```

如果 GitHub 要求登录，按浏览器提示完成授权。上传后到网页验证：文件齐全、`add.py` 内容正常显示、commit 记录和本地一致。
> 📸 操作截图尚未补齐：push 成功的终端输出
📸 截图 M5-5-2：GitHub 网页上出现的文件列表

> 💡 反复刷新网页不会重复上传。只有再次 `git push`，新的提交才会进入 GitHub。

### 任务 6：修改后再次上传

🎯 **成功标志：** GitHub 同时保留修改前后两次提交，旧版本仍然可查。

1. 让 WorkBuddy 修改：

   ```text
   修改 add.py，让程序输出计算结果后，再显示"计算完成"。不要修改其他文件。
   ```

2. 亲自走固定动作：

   ```bash
   git status
   git diff
   git add add.py
   git commit -m "增加计算完成提示"
   git push
   ```

3. 到 GitHub 检查：最新文件有「计算完成」；Commits 数量 +1；点开旧 commit 还能看到修改前的版本。

🔍 **刚才发生了什么**
`push` 上传的是**已提交的版本**，不是自动同步整个文件夹的每次变化。这就是为什么固定动作里 commit 在 push 之前。

### 任务 7：从云端下载（clone）

🎯 **成功标志：** 在另一个文件夹下载项目并成功运行 `add.py`，`git log` 保留全部历史。

```bash
cd ~/Desktop
git clone 你的仓库地址 ai-beginner-practice-copy
cd ai-beginner-practice-copy
ls
python add.py
git log --oneline
```

**挑战：** 删除这个副本文件夹，再 `git clone` 一次——体会「只要仓库地址在，项目永远可以恢复」。

### 任务 8：理解 push 和 pull

🎯 **成功标志：** A 文件夹推送修改后，B 文件夹 `git pull` 能拿到完全相同的内容。

1. 在**原项目**修改 README 并推送：

   ```bash
   git add README.md
   git commit -m "更新项目说明"
   git push
   ```

2. 进入**副本**文件夹：

   ```bash
   git pull
   ```

3. 打开副本的 README，确认新内容出现了。

**建立这张心智图：**

```text
git push  ：本地 → GitHub
git pull  ：GitHub → 本地
git clone ：第一次完整下载
```

---

## 5.3 用 GitHub 管理需求和审查修改

> 从这一节起，你的开发方式升级为**需求驱动**：先写清楚要什么（Issue），再让 AI 做，最后按需求验收。这就是专业软件团队的工作方式。

### 任务 9：用 Issue 提出并完成一个需求

🎯 **成功标志：** Issue 内有可验收的需求；`subtract.py` 用两组数据测试正确；相关 commit 已推送；Issue 状态为 Closed。

**操作步骤**

1. 打开仓库的 `Issues` 页 → `New issue`
2. 标题：`增加减法程序`；正文写清验收标准：
   - 文件名 `subtract.py`
   - 输入两个数字，输出相减结果
   - 可以重复运行测试
   📸 截图 M5-9-1：写好的 Issue
3. 提交后复制 Issue 链接，发给 WorkBuddy：

   ```text
   阅读这个 GitHub Issue：<粘贴链接>。先复述需求，不要立即修改代码。
   ```

4. 确认它复述正确后再让它实现。你亲自用两组数据测试。
5. 测试通过后提交推送：

   ```bash
   git add subtract.py
   git commit -m "实现减法程序"
   git push
   ```

6. 回到 GitHub 关闭这个 Issue。

> 💡 「先复述需求，再动手」这个咒语值得记住——它能消灭一大半 AI 理解偏差造成的返工。

### 任务 10：用 Pull Request 完成代码审查

🎯 **成功标志：** GitHub 上存在一个已合并的 PR，`Files changed` 里能看到 `multiply.py`，本地 `main` pull 之后程序可运行。

**操作步骤**

1. 创建功能分支：

   ```bash
   git switch -c feature/multiply
   ```

2. 让 WorkBuddy 创建 `multiply.py`（乘法程序），亲自测试通过后：

   ```bash
   git add multiply.py
   git commit -m "增加乘法程序"
   git push -u origin feature/multiply
   ```

3. 到 GitHub：点 `Compare & pull request` → 标题「增加乘法程序」→ 正文写清「改了什么、如何测试」→ 创建 PR。
   📸 截图 M5-10-1：PR 创建页
4. 打开 `Files changed` 标签，像审查员一样看一遍代码变更。
   📸 截图 M5-10-2：Files changed 红绿对比
5. 确认无误 → `Merge pull request`。
6. 回到本地收尾：

   ```bash
   git switch main
   git pull
   ```

---

## 5.4 综合挑战：file-organizer

🎯 **成功标志：** 一条完整的协作链——Issue → 分支 → Agent 实现 → 人工测试 → PR → 合并 → 异地 clone 后按 README 可用。
⏱️ 预计用时：60 分钟

**只给要求，步骤自己组织（可回翻前文）：**

1. 创建 GitHub 私有仓库 `file-organizer`
2. 创建 Issue：描述「根据文件类型整理文件」的需求（写清输入文件、分类规则、预期输出）
3. 本地 `git clone`，创建功能分支
4. 让 WorkBuddy 编写整理程序（要求它能识别待整理目录，而不是只输出说明文字）
5. 准备一个测试文件夹：放至少三种格式的文件
6. 多次运行：三种文件都进对分类；**第二次运行不丢失、不重复**
7. `git diff` 检查 Agent 的修改，说出至少一处变化的作用
8. 提交、推送、创建 PR（写清变更说明和测试方法）、合并
9. 换一个新文件夹重新 clone，**只看 README** 完成一次文件整理

**这一章最后只需要记住一张图：**

```text
Issue 提出任务 → 创建分支 → Agent 修改代码 → 自己运行测试
      → git diff 检查 → add + commit → push → PR 审查合并
```

这就是「人提出任务、Agent 执行、人验收、GitHub 保存协作过程」的完整工作模型。

## 里程碑五 · 毕业检查

- [ ] GitHub 上有 `ai-beginner-practice` 和 `file-organizer` 两个仓库
- [ ] 我能不看手册说出 push / pull / clone 的方向
- [ ] 我完成过一次 Issue 从创建到 Closed 的全流程
- [ ] 我完成过一次 PR 从创建到 Merged 的全流程
- [ ] 异地 clone 后按 README 跑通过程序

**下一站 →** [[ai-basics/windows/06-里程碑六-毕业项目贪吃蛇|里程碑六：毕业项目·贪吃蛇]]
