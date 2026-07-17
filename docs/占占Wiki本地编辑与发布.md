# 占占 Wiki 本地编辑与发布

## 我平时从哪里写

首选入口是 Finder 中的：

`/Users/m/Documents/占占Wiki网站内容`

这是映射，不是副本。里面的中文目录全部指向唯一源码仓库
`/Users/m/Documents/部署mac/zhanzhan-wiki/content`，从 Finder 或 Obsidian 保存后，改动会直接落到源码文件。

不要移动或复制这个目录里的链接目标，也不要在 `public/`、`public-self-host/` 中编辑文章；它们是构建产物。底层唯一内容目录始终是：

`/Users/m/Documents/部署mac/zhanzhan-wiki/content`

中文作者视图可以安全重建：

```bash
cd /Users/m/Documents/部署mac/zhanzhan-wiki
node scripts/rebuild-author-view.mjs
```

脚本只创建或校验符号链接。遇到同名真实文件或目录会停止，不会删除或覆盖真实内容。

## 写完以后

1. 在本地预览：

   ```bash
   cd /Users/m/Documents/部署mac/zhanzhan-wiki
   npm ci
   npx quartz plugin install
   npx quartz build --serve
   ```

2. 浏览器打开 `http://localhost:8080`，检查文章、目录、搜索和手机宽度。
3. 对 Jarvis 说：`发布占占 Wiki`。

这句话不是“直接上线”。Jarvis 的发布契约是：审查差异与公开边界 → 只提交确认过的文件 → 普通推送 → 用 self-host profile 确定性构建 → 冻结 artifact 与 SHA → 交给 release owner 部署 → 线上浏览器验收 → 记录可回滚的上一 release。任何一步失败都停止，不把未验收版本切到正式站。

## 发布前边界

公开仓库不得包含密码、密钥、账号凭据、本机绝对路径、私人关系、未脱敏业务数据、日记、人物卡、财务流水或未经本人确认可公开的长期记忆。草稿和私密材料留在私人知识库，不要先放进本仓库再期待发布脚本替你保密。

## 查看本地、GitHub 与线上是否一致

```bash
cd /Users/m/Documents/部署mac/zhanzhan-wiki
node scripts/wiki-author-status.mjs
```

该命令只读：不会 stage、commit、push、构建或部署。

## 确定性 self-host 构建

正式站只使用现有 profile，不建立第二条发布路径：

```bash
cd /Users/m/Documents/部署mac/zhanzhan-wiki
node scripts/build-selfhost-release.mjs /tmp/zhanzhan-wiki-self-host /tmp/zhanzhan-wiki-self-host.release-manifest.json
```

该脚本从当前 `HEAD` 建立临时、只读语义的 detached worktree，再调用既有 self-host profile 构建；因此当前工作目录里的未提交草稿不会混入 artifact。它拒绝覆盖已有输出，构建后执行现有 artifact 验证，并生成按路径排序的逐文件 SHA-256 manifest，记录 source commit、文件数和整个 artifact tree SHA-256。交付 release owner 时必须同时交付 artifact 目录与该 manifest；owner 以 `source_commit + tree_sha256` 命名 release、在服务器复算后再原子切换。向 GitHub 推送会更新过渡期 GitHub Pages，但不会自动修改 `wiki.zhanzhanai.com` 的 self-host release。
