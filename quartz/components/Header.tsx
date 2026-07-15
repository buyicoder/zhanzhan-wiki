import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { FullSlug, pathToRoot, resolveRelative } from "../util/path"

const NAV_LINKS = [
  ["制作日志", "logs/index"],
  ["数字花园", "garden/index"],
  ["长青作品", "works/index"],
  ["项目档案", "projects/index"],
  ["Now", "now"],
] as const

const HEADER_SCRIPT = `
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
