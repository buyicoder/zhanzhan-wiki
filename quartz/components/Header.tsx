import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { FullSlug, pathToRoot, resolveRelative } from "../util/path"

const NAV_LINKS = [
  ["开始这里", "start/index"],
  ["AI 小白入门实战", "ai-basics/index"],
  ["AI 时代学习方法", "learning/index"],
  ["AI 工作与商业", "business/index"],
  ["真实案例", "cases/index"],
  ["占占的判断", "thinking/index"],
] as const

const HEADER_SCRIPT = `
const readerJourneyOrder = ["start", "ai-basics", "learning", "business", "cases", "thinking"]
const legacyRoots = new Set(["works", "garden", "logs", "projects"])
const journeyNext = {
  "ai-basics/高考完之后-焚决": ["ai-basics/index", "learning/ai时代的七条基础能力", "下一步：AI 时代的七条基础能力"],
  "learning/ai时代的七条基础能力": ["learning/index", "learning/ai时代最不重要的能力恰恰是大家最焦虑的", "下一步：三层能力模型"],
  "learning/ai时代最不重要的能力恰恰是大家最焦虑的": ["learning/index", "cases/我给ai小白课埋了六个坑", "下一步：看真实课程案例"],
  "business/ai赋能的方向是工作不是娱乐": ["business/index", "business/个人知识库不是给自己看的", "下一步：个人知识库如何对外交付"],
  "business/个人知识库不是给自己看的": ["business/index", "cases/ai写小说的真相", "下一步：一次 AI 写作失败复盘"],
  "cases/我给ai小白课埋了六个坑": ["cases/index", "cases/为什么我给自己造了一个jarvis", "下一个案例：为什么造 Jarvis"],
  "cases/为什么我给自己造了一个jarvis": ["cases/index", "cases/我的ai记忆系统这样存东西", "下一个案例：AI 记忆系统的存储设计"],
  "cases/我的ai记忆系统这样存东西": ["cases/index", "cases/ai写小说的真相", "下一个案例：AI 写小说的真相"],
  "cases/ai写小说的真相": ["cases/index", "cases/前端需求要给视觉参照", "下一个案例：用视觉参照写前端需求"],
  "cases/前端需求要给视觉参照": ["cases/index", "cases/协议解析代码必须默认高风险", "下一个案例：协议解析为什么高风险"],
  "cases/协议解析代码必须默认高风险": ["cases/index", "thinking/数学正在从答案稀缺进入理解稀缺", "下一步：占占的判断"],
  "thinking/数学正在从答案稀缺进入理解稀缺": ["thinking/index", "start/index", "回到开始这里"]
}
function sitePath(target) {
  const base = (document.body.dataset.basepath || "").replace(/^\\/|\\/$/g, "")
  return (base ? "/" + base : "") + "/" + target.replace(/\\/index$/, "")
}
function organizeExplorer() {
  for (const list of document.querySelectorAll(".explorer-ul")) {
    const items = [...list.children]
    const rank = (item) => {
      const path = item.querySelector(":scope > .folder-container")?.dataset.folderpath?.replace(/\\/index$/, "")
      const root = path?.split("/")[0]
      if (legacyRoots.has(root)) return 100
      const index = readerJourneyOrder.indexOf(root)
      return index < 0 ? 50 : index
    }
    const desired = items.sort((a, b) => rank(a) - rank(b))
    desired.forEach((item) => {
      const path = item.querySelector(":scope > .folder-container")?.dataset.folderpath?.replace(/\\/index$/, "")
      item.hidden = legacyRoots.has(path?.split("/")[0])
    })
    if (desired.some((item, index) => item !== list.children[index])) desired.forEach((item) => list.appendChild(item))
    if (list.dataset.journeyObserver !== "true") {
      list.dataset.journeyObserver = "true"
      new MutationObserver(organizeExplorer).observe(list, { childList: true })
    }
  }
}
function localizeProperties() {
  for (const title of document.querySelectorAll(".note-properties-title")) title.textContent = "页面信息"
}
function mountJourneyNext() {
  document.querySelector(".reader-journey-next")?.remove()
  const slug = document.body.dataset.slug?.toLowerCase()
  const entry = slug ? journeyNext[slug] : undefined
  const article = document.querySelector(".center > article")
  if (!entry || !article) return
  const nav = document.createElement("nav")
  nav.className = "reader-journey-next"
  nav.setAttribute("aria-label", "阅读下一步")
  const back = document.createElement("a")
  back.href = sitePath(entry[0])
  back.textContent = "返回本路径"
  const next = document.createElement("a")
  next.href = sitePath(entry[1])
  next.textContent = entry[2]
  nav.append(back, next)
  article.insertAdjacentElement("afterend", nav)
}
function enhanceExplorerButtons() {
  const isCompact = window.matchMedia("(max-width: 1100px)").matches
  for (const button of document.querySelectorAll(".explorer-toggle")) {
    const explorer = button.closest(".explorer")
    if (!explorer) continue
    const isMobileButton = button.classList.contains("mobile-explorer")
    if (isMobileButton && isCompact && button.dataset.initialized !== "true") {
      explorer.classList.add("collapsed")
      explorer.setAttribute("aria-expanded", "false")
      document.documentElement.classList.remove("mobile-no-scroll")
    }
    const syncLabel = () => {
      const collapsed = explorer.classList.contains("collapsed")
      const label = isMobileButton ? (collapsed ? "打开全局目录" : "关闭全局目录") : (collapsed ? "展开全局目录" : "收起全局目录")
      button.setAttribute("aria-label", label)
      button.setAttribute("title", label)
      button.setAttribute("aria-expanded", String(!collapsed))
    }
    syncLabel()
    if (button.dataset.initialized !== "true") {
      button.dataset.initialized = "true"
      button.addEventListener("click", () => {
        queueMicrotask(syncLabel)
      })
    }
  }
}
function mountHeaderTools() {
  const target = document.querySelector(".doc-header-extra")
  const tools = document.querySelector(".page > #quartz-body > .sidebar.left > .flex-component")
  if (target && tools && tools.parentElement !== target) target.appendChild(tools)
}
function enhanceReadingShell() {
  mountHeaderTools()
  enhanceExplorerButtons()
  organizeExplorer()
  localizeProperties()
  mountJourneyNext()
}
if (!window.__docHeaderInitialized) {
  window.__docHeaderInitialized = true
  document.addEventListener("nav", enhanceReadingShell)
  document.addEventListener("render", enhanceReadingShell)
}
enhanceReadingShell()
`

const Header: QuartzComponent = ({ children, fileData, cfg }: QuartzComponentProps) => {
  const slug = (fileData.slug ?? "index") as FullSlug

  return (
    <header class="doc-header">
      <a class="doc-header-brand" href={pathToRoot(slug)}>
        {cfg.pageTitle}
      </a>
      <nav class="doc-header-nav" aria-label="全局导航">
        {NAV_LINKS.map(([label, target]) => {
          const active = slug === target || slug.startsWith(`${target.replace("/index", "")}/`)
          return (
            <a
              key={target}
              class={`doc-header-link${active ? " is-active" : ""}`}
              href={resolveRelative(slug, target as FullSlug)}
              aria-current={active ? "page" : undefined}
            >
              {label}
            </a>
          )
        })}
      </nav>
      <div class="doc-header-extra">{children}</div>
      <script dangerouslySetInnerHTML={{ __html: HEADER_SCRIPT }} />
    </header>
  )
}

Header.css = `
.doc-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 2rem;
}

.doc-header-brand,
.doc-header-link {
  text-decoration: none;
}
`

export default (() => Header) satisfies QuartzComponentConstructor
