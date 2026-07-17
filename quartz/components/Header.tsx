import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { FullSlug, pathToRoot, resolveRelative } from "../util/path"

const NAV_LINKS = [
  ["首页", "index", ["index"]],
  [
    "知识库",
    "map/index",
    ["map", "input", "capability", "leverage", "ai-work", "expression", "life", "tutorials"],
  ],
  ["AI 课程", "ai-basics/index", ["ai-basics"]],
  ["项目与作品", "portfolio/index", ["portfolio", "cases", "works", "projects"]],
  ["关于占占", "now", ["now", "conventions"]],
] as const

const HEADER_SCRIPT = `
const readerJourneyOrder = ["map", "input", "capability", "leverage", "ai-work", "portfolio", "expression", "life", "tutorials"]
const legacyRoots = new Set(["start", "ai-basics", "learning", "business", "cases", "thinking", "toolbox", "works", "garden", "logs", "projects"])
const legacyLeafPaths = new Set(["now", "conventions"])
const explorerWidthKey = "zz-explorer-width"
const explorerWidthDefault = 280
const explorerWidthMin = 240
const explorerWidthMax = 520
const journeyNext = {
  "capability/高考完之后-焚决": ["capability/index", "capability/ai时代的七条基础能力", "下一步：AI 时代的七条基础能力"],
  "capability/ai时代的七条基础能力": ["capability/index", "capability/ai时代最不重要的能力恰恰是大家最焦虑的", "下一步：三层能力模型"],
  "capability/ai时代最不重要的能力恰恰是大家最焦虑的": ["capability/index", "portfolio/我给ai小白课埋了六个坑", "下一步：看真实课程案例"],
  "ai-work/ai赋能的方向是工作不是娱乐": ["ai-work/index", "ai-work/企业ai转型方法论", "下一步：企业 AI 转型的五个阶段"],
  "ai-work/企业ai转型方法论": ["ai-work/index", "ai-work/个人知识库不是给自己看的", "下一步：个人知识库如何对外交付"],
  "ai-work/个人知识库不是给自己看的": ["ai-work/index", "portfolio/ai写小说的真相", "下一步：一次 AI 写作失败复盘"],
  "portfolio/我给ai小白课埋了六个坑": ["portfolio/index", "portfolio/为什么我给自己造了一个jarvis", "下一个案例：为什么造 Jarvis"],
  "portfolio/为什么我给自己造了一个jarvis": ["portfolio/index", "portfolio/我的ai记忆系统这样存东西", "下一个案例：AI 记忆系统的存储设计"],
  "portfolio/我的ai记忆系统这样存东西": ["portfolio/index", "portfolio/ai写小说的真相", "下一个案例：AI 写小说的真相"],
  "portfolio/ai写小说的真相": ["portfolio/index", "ai-work/前端需求要给视觉参照", "下一个案例：用视觉参照写前端需求"],
  "ai-work/前端需求要给视觉参照": ["ai-work/index", "ai-work/协议解析代码必须默认高风险", "下一个案例：协议解析为什么高风险"],
  "ai-work/协议解析代码必须默认高风险": ["ai-work/index", "capability/数学正在从答案稀缺进入理解稀缺", "下一步：学习与能力"],
  "capability/数学正在从答案稀缺进入理解稀缺": ["capability/index", "map/index", "下一步：回到总地图"],
  "map/index": ["map/index", "input/index", "从输入系统开始"]
}
const courseLessons = [
  "00-使用说明与总览",
  "01-里程碑一-让agent第一次操作你的电脑",
  "02-里程碑二-准备ai环境",
  "03-里程碑三-理解程序与命令行",
  "04-里程碑四-git存档",
  "05-里程碑五-github协作",
  "06-里程碑六-毕业项目贪吃蛇",
  "07-里程碑七-发布上线",
  "08-里程碑八-个人复利成长系统"
]
function getCourseJourney(slug) {
  const match = slug.match(/^ai-basics\\/(macos|windows)\\/(.+)$/)
  if (!match) return undefined
  const index = courseLessons.indexOf(match[2])
  if (index < 0) return undefined
  const platform = match[1]
  return {
    back: "ai-basics/" + platform + "/index",
    previous: index > 0 ? "ai-basics/" + platform + "/" + courseLessons[index - 1] : undefined,
    next: index < courseLessons.length - 1 ? "ai-basics/" + platform + "/" + courseLessons[index + 1] : undefined,
  }
}
function sitePath(target) {
  const base = (document.body.dataset.basepath || "").replace(/^\\/|\\/$/g, "")
  return (base ? "/" + base : "") + "/" + target.replace(/\\/index$/, "")
}
function enhanceFolderControls(root) {
  for (const container of root.querySelectorAll(".folder-container")) {
    const folderPath = container.dataset.folderpath
    const folderOuter = container.nextElementSibling
    const folderLink = container.querySelector("a.folder-button")
    const icon = container.querySelector(":scope > .folder-icon")
    if (!folderPath || !folderOuter || !folderLink || !icon) continue

    const title = folderLink.textContent?.trim() || "目录"
    folderLink.title = title
    folderLink.setAttribute("aria-label", title)
    const toggle = document.createElement("button")
    toggle.type = "button"
    toggle.className = "folder-toggle"
    toggle.append(icon.cloneNode(true))

    const syncState = () => {
      const expanded = folderOuter.classList.contains("open")
      toggle.setAttribute("aria-expanded", String(expanded))
      toggle.setAttribute("aria-label", (expanded ? "收起" : "展开") + title)
    }
    const toggleFolder = (event) => {
      event.preventDefault()
      event.stopPropagation()
      folderOuter.classList.toggle("open")
      const collapsed = !folderOuter.classList.contains("open")
      let savedState = []
      try { savedState = JSON.parse(localStorage.getItem("fileTree") || "[]") } catch {}
      const existing = savedState.findIndex((item) => item.path === folderPath)
      if (existing >= 0) savedState[existing].collapsed = collapsed
      else savedState.push({ path: folderPath, collapsed })
      localStorage.setItem("fileTree", JSON.stringify(savedState))
      syncState()
    }
    toggle.addEventListener("click", toggleFolder)
    icon.replaceWith(toggle)
    syncState()

    const currentSlug = document.body.dataset.slug
    if (currentSlug === folderPath) {
      folderLink.classList.add("active", "is-active")
      folderLink.setAttribute("aria-current", "page")
    }
  }
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
      const leafHref = item.querySelector(":scope > a.nav-file-title")?.getAttribute("href") || ""
      const leafPath = decodeURIComponent(leafHref).replace(/^.*\\//, "").replace(/\\/$/, "")
      item.hidden = legacyRoots.has(path?.split("/")[0]) || legacyLeafPaths.has(leafPath)
    })
    enhanceFolderControls(list)
    for (const link of list.querySelectorAll("a.tree-item-self")) {
      const title = link.textContent?.trim()
      if (title) {
        link.title = title
        link.setAttribute("aria-label", title)
      }
    }
    if (desired.some((item, index) => item !== list.children[index])) desired.forEach((item) => list.appendChild(item))
    if (list.dataset.journeyObserver !== "true") {
      list.dataset.journeyObserver = "true"
      new MutationObserver(organizeExplorer).observe(list, { childList: true })
    }
  }
}
function restoreGlobalExplorerTree(explorer) {
  const content = explorer?.querySelector(":scope > .explorer-content")
  const list = content?.querySelector(":scope > .explorer-ul")
  if (!list) return
  for (const item of list.children) {
    const folder = item.querySelector(":scope > .folder-container")
    const path = folder?.dataset.folderpath?.replace(/\\/index$/, "")
    const root = path?.split("/")[0]
    if (!readerJourneyOrder.includes(root)) continue
    item.hidden = false
    folder.hidden = false
    folder.nextElementSibling?.classList.add("open")
    folder.querySelector(".folder-toggle")?.setAttribute("aria-expanded", "true")
  }
  sessionStorage.removeItem("explorerScrollTop")
  content.scrollTop = 0
  list.scrollTop = 0
  requestAnimationFrame(() => {
    content.scrollTop = 0
    list.scrollTop = 0
  })
}
function mountExplorerResize() {
  const desktop = window.matchMedia("(min-width: 1101px)").matches
  const body = document.querySelector(".page > #quartz-body")
  const sidebar = body?.querySelector(":scope > .sidebar.left")
  if (!body || !sidebar) return
  sidebar.querySelector(".explorer-resize-handle")?.remove()
  if (!desktop) return

  const limit = () => Math.max(explorerWidthMin, Math.min(explorerWidthMax, Math.floor(window.innerWidth * 0.4)))
  const clamp = (value) => Math.max(explorerWidthMin, Math.min(limit(), Math.round(value)))
  const saved = Number(localStorage.getItem(explorerWidthKey))
  let width = clamp(Number.isFinite(saved) && saved > 0 ? saved : explorerWidthDefault)
  const handle = document.createElement("div")
  handle.className = "explorer-resize-handle"
  handle.tabIndex = 0
  handle.setAttribute("role", "separator")
  handle.setAttribute("aria-orientation", "vertical")
  handle.setAttribute("aria-label", "调整全局目录宽度")

  const apply = (next, persist = true) => {
    width = clamp(next)
    document.documentElement.style.setProperty("--zz-explorer-width", width + "px")
    handle.setAttribute("aria-valuemin", String(explorerWidthMin))
    handle.setAttribute("aria-valuemax", String(limit()))
    handle.setAttribute("aria-valuenow", String(width))
    if (persist) localStorage.setItem(explorerWidthKey, String(width))
  }
  apply(width, Number.isFinite(saved) && saved > 0)

  handle.addEventListener("pointerdown", (event) => {
    const startX = event.clientX
    const startWidth = width
    let dragging = false
    const move = (moveEvent) => {
      const delta = moveEvent.clientX - startX
      if (!dragging && Math.abs(delta) < 5) return
      if (!dragging) {
        dragging = true
        handle.setPointerCapture(event.pointerId)
        handle.classList.add("is-dragging")
        document.documentElement.classList.add("explorer-is-resizing")
      }
      moveEvent.preventDefault()
      apply(startWidth + delta)
    }
    const stop = () => {
      if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId)
      handle.classList.remove("is-dragging")
      document.documentElement.classList.remove("explorer-is-resizing")
      document.removeEventListener("pointermove", move)
      document.removeEventListener("pointerup", stop)
      document.removeEventListener("pointercancel", stop)
    }
    document.addEventListener("pointermove", move)
    document.addEventListener("pointerup", stop)
    document.addEventListener("pointercancel", stop)
  })
  handle.addEventListener("dblclick", () => apply(explorerWidthDefault))
  handle.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
    event.preventDefault()
    const step = event.shiftKey ? 32 : 8
    apply(width + (event.key === "ArrowRight" ? step : -step))
  })
  sidebar.append(handle)
}
function localizeProperties() {
  for (const title of document.querySelectorAll(".note-properties-title")) title.textContent = "页面信息"
}
function mountJourneyNext() {
  document.querySelector(".reader-journey-next")?.remove()
  const slug = document.body.dataset.slug?.toLowerCase()
  const entry = slug ? journeyNext[slug] : undefined
  const course = slug ? getCourseJourney(slug) : undefined
  const article = document.querySelector(".center > article")
  if ((!entry && !course) || !article) return
  const nav = document.createElement("nav")
  nav.className = "reader-journey-next"
  nav.setAttribute("aria-label", "阅读下一步")
  const back = document.createElement("a")
  back.href = sitePath(course?.back || entry[0])
  back.textContent = course ? "返回平台课程" : "返回本路径"
  nav.append(back)
  if (course?.previous) {
    const previous = document.createElement("a")
    previous.href = sitePath(course.previous)
    previous.textContent = "上一篇"
    nav.append(previous)
  }
  const nextTarget = course?.next || entry?.[1]
  if (nextTarget) {
    const next = document.createElement("a")
    next.href = sitePath(nextTarget)
    next.textContent = course ? "下一篇" : entry[2]
    nav.append(next)
  }
  article.insertAdjacentElement("afterend", nav)
}
function enhanceExplorerButtons() {
  const isCompact = window.matchMedia("(max-width: 800px)").matches
  for (const button of document.querySelectorAll(".mobile-explorer, .explorer-toggle")) {
    const explorer = button.closest(".explorer")
    if (!explorer) continue
    const isMobileButton = button.classList.contains("mobile-explorer")
    if (isMobileButton) button.classList.remove("explorer-toggle")
    if (isMobileButton && isCompact && button.dataset.initialized !== "true") {
      // The compact control owns its toggle below. Removing Quartz's generic
      // hook prevents a second listener from immediately reversing the state.
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
      explorer.setAttribute("aria-expanded", String(!collapsed))
      explorer.querySelector(".explorer-content")?.setAttribute("aria-expanded", String(!collapsed))
    }
    syncLabel()
    if (button.dataset.initialized !== "true") {
      button.dataset.initialized = "true"
    }
  }
}
function handleExplorerToggle(event) {
  const target = event.target instanceof Element
    ? event.target.closest(".mobile-explorer, .desktop-explorer")
    : null
  const explorer = target?.closest(".explorer")
  if (!explorer) return
  event.preventDefault()
  event.stopImmediatePropagation()
  const collapsed = !explorer.classList.contains("collapsed")
  const compact = window.matchMedia("(max-width: 800px)").matches
  explorer.classList.toggle("collapsed", collapsed)
  document.documentElement.classList.toggle("mobile-no-scroll", compact && !collapsed)
  explorer.setAttribute("aria-expanded", String(!collapsed))
  explorer.querySelector(".explorer-content")?.setAttribute("aria-expanded", String(!collapsed))
  target.setAttribute("aria-expanded", String(!collapsed))
  const label = target.classList.contains("mobile-explorer")
    ? (collapsed ? "打开全局目录" : "关闭全局目录")
    : (collapsed ? "展开全局目录" : "收起全局目录")
  target.setAttribute("aria-label", label)
  target.setAttribute("title", label)
  if (!collapsed) restoreGlobalExplorerTree(explorer)
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
  mountExplorerResize()
  localizeProperties()
  mountJourneyNext()
}
if (!window.__docHeaderInitialized) {
  window.__docHeaderInitialized = true
  document.addEventListener("click", handleExplorerToggle, { capture: true })
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
        {NAV_LINKS.map(([label, target, roots]) => {
          const root = slug === "index" ? "index" : slug.split("/")[0]
          const active = roots.includes(root as never)
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
