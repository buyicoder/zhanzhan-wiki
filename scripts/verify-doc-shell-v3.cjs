const { chromium } = require("playwright")
const fs = require("node:fs")
const path = require("node:path")

const base = (process.env.BASE_URL || "http://localhost:8080").replace(/\/$/, "")
const output = process.env.OUTPUT_DIR || "/tmp/zhanzhan-wiki-tool-map-and-doc-shell-v3-20260716/local"
const viewports = [
  [1440, 1000], [1280, 900], [1100, 900], [1024, 900], [768, 900], [390, 844], [375, 667],
]
fs.mkdirSync(output, { recursive: true })

async function run(browser, width, height) {
  const context = await browser.newContext({ viewport: { width, height } })
  const page = await context.newPage()
  const errors = []
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()))
  page.on("pageerror", (e) => errors.push(String(e)))
  const response = await page.goto(`${base}/toolbox/我的完整工具图谱`, { waitUntil: "networkidle" })
  if (!response?.ok()) throw new Error(`${width}: HTTP ${response?.status()}`)

  if (width <= 1100) {
    await page.locator(".mobile-explorer:visible").click()
    await page.waitForFunction(() => !document.querySelector(".explorer")?.classList.contains("collapsed"))
    await page.waitForTimeout(300)
  }

  const result = await page.evaluate(() => {
    const visible = (node) => node && node.getClientRects().length > 0
    const nav = [...document.querySelectorAll(".doc-header-nav a")].map((a) => a.textContent.trim())
    const links = [...document.querySelectorAll(".explorer-content a.tree-item-self")].filter(visible)
    return {
      nav,
      overflow: document.documentElement.scrollWidth - innerWidth,
      handle: visible(document.querySelector(".explorer-resize-handle")),
      rows: links.slice(0, 12).map((a) => ({
        title: a.title,
        aria: a.getAttribute("aria-label"),
        whiteSpace: getComputedStyle(a).whiteSpace,
        height: a.getBoundingClientRect().height,
      })),
    }
  })
  if (result.nav.join("|") !== "首页|知识库|AI 课程|项目与作品|关于占占") throw new Error(`${width}: nav mismatch`)
  if (result.overflow > 1) throw new Error(`${width}: overflow ${result.overflow}`)
  if (width > 1100 && !result.handle) throw new Error(`${width}: desktop handle missing`)
  if (width <= 1100 && result.handle) throw new Error(`${width}: compact handle visible`)
  if (result.rows.some((row) => row.whiteSpace !== "nowrap" || !row.title || row.title !== row.aria)) throw new Error(`${width}: title contract failed`)

  if (width > 1100) {
    const handle = page.locator(".explorer-resize-handle")
    await handle.focus()
    const before = Number(await handle.getAttribute("aria-valuenow"))
    await page.keyboard.press("Shift+ArrowRight")
    const after = Number(await handle.getAttribute("aria-valuenow"))
    if (after - before !== 32) throw new Error(`${width}: keyboard resize failed ${before}->${after}`)
    await page.reload({ waitUntil: "networkidle" })
    if (Number(await page.locator(".explorer-resize-handle").getAttribute("aria-valuenow")) !== after) throw new Error(`${width}: persistence failed`)
    await page.locator(".explorer-resize-handle").dblclick()
    if (Number(await page.locator(".explorer-resize-handle").getAttribute("aria-valuenow")) !== 280) throw new Error(`${width}: reset failed`)
  }
  await page.screenshot({ path: path.join(output, `${width}x${height}.png`) })
  await context.close()
  return { width, height, ...result, errors }
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  try {
    const results = []
    for (const [width, height] of viewports) results.push(await run(browser, width, height))
    if (results.some((r) => r.errors.length)) throw new Error(JSON.stringify(results.flatMap((r) => r.errors)))
    fs.writeFileSync(path.join(output, "results.json"), JSON.stringify({ base, results }, null, 2))
    console.log(`PASS doc shell V3 at ${base}`)
  } finally { await browser.close() }
})().catch((error) => { console.error(error); process.exit(1) })
