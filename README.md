# 占占的数字花园

我的公开知识库，站点：https://buyicoder.github.io/zhanzhan-wiki

这不是文章合集，是**私人记忆库的公开投影**。每篇内容公开标注创作方式（✍️ 手写 / 🗣️ 口述整理 / 🤝 AI 起草我重写 / 🤖 AI 生成我背书）和成熟度（🌱 种子 / 🌿 生长中 / 🌲 长青），规则见 [content/conventions.md](content/conventions.md)。

## 发布管道

```text
私人记忆库（唯一源头，不在本仓库）
  → 每周蒸馏时标 publish: true
  → 外化改写（补背景、去内部引用、本人逐段认领）
  → 敏感信息扫描（人名、金额、未脱敏信息）
  → 落入本仓库 content/ → GitHub Actions 构建 → GitHub Pages
```

红线：人物卡、日记、流水账、财务数据**永久不进入本仓库**——靠管道的目录白名单保证，不靠自觉。

## 本地开发

基于 [Quartz 5](https://quartz.jzhao.xyz)。

```bash
npm ci
npx quartz plugin install
npx quartz build --serve   # 本地预览 http://localhost:8080
```

`main` 分支的每次 push 触发 `.github/workflows/deploy.yml` 自动构建部署。

## 内容结构

```text
content/
  index.md        门面
  conventions.md  诚实规则（标签图例）
  now.md          我现在在做什么（每月更新）
  works/          长青作品
  garden/         数字花园（概念与判断）
  logs/           制作日志（过程记录）
  projects/       项目档案
```
