import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { FullSlug, pathToRoot, resolveRelative } from "../util/path"

const NAV_LINKS = [
  ["长青作品", "works/index"],
  ["数字花园", "garden/index"],
  ["制作日志", "logs/index"],
  ["项目档案", "projects/index"],
  ["Now", "now"],
] as const

const HEADER_SCRIPT = `
function enhanceDesktopExplorer() {
  for (const button of document.querySelectorAll(".explorer-toggle.desktop-explorer")) {
    const explorer = button.closest(".explorer")
    if (!explorer) continue
    const syncLabel = () => {
      const collapsed = explorer.classList.contains("collapsed")
      const label = collapsed ? "展开全局目录" : "收起全局目录"
      button.setAttribute("aria-label", label)
      button.setAttribute("title", label)
      button.setAttribute("aria-expanded", String(!collapsed))
    }
    syncLabel()
    if (button.dataset.desktopEnhancement !== "true") {
      button.dataset.desktopEnhancement = "true"
      button.addEventListener("click", () => {
        const wasCollapsed = explorer.classList.contains("collapsed")
        requestAnimationFrame(() => {
          if (explorer.classList.contains("collapsed") === wasCollapsed) {
            explorer.classList.toggle("collapsed")
            explorer.setAttribute("aria-expanded", String(wasCollapsed))
          }
          syncLabel()
        })
      })
    }
  }
}
if (!window.__docHeaderInitialized) {
  window.__docHeaderInitialized = true
  document.addEventListener("nav", () => {
    if (window.location.hash === "") window.scrollTo({ top: 0, left: 0, behavior: "instant" })
    enhanceDesktopExplorer()
  })
}
enhanceDesktopExplorer()
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
      {children.length > 0 ? <div class="doc-header-extra">{children}</div> : null}
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
