const { chromium } = require("playwright")
const fs = require("node:fs")
const path = require("node:path")

const base = (process.env.BASE_URL || "http://localhost:8080").replace(/\/$/, "")
const output = process.env.OUTPUT_DIR || "/tmp/zhanzhan-wiki-course-preview-conversion-20260716/local"
const inventory = JSON.parse(fs.readFileSync("/tmp/zhanzhan-wiki-course-preview-conversion-20260716/inventory.json", "utf8")).inventory
const focusRoutes = [
  "/ai-basics/", "/ai-basics/macos/", "/ai-basics/windows/",
  inventory.find((x) => x.platform === "macos" && x.order === "00").route,
  inventory.find((x) => x.platform === "windows" && x.order === "00").route,
  inventory.find((x) => x.platform === "macos" && x.order === "01").route,
  inventory.find((x) => x.platform === "windows" && x.order === "01").route,
  inventory.find((x) => x.platform === "macos" && x.order === "04").route,
  inventory.find((x) => x.platform === "windows" && x.order === "07").route,
]
const viewports = [[1440, 1000], [768, 900], [390, 844], [375, 667]]
const failures = [], evidence = []
const check = (pass, name, detail = {}) => { evidence.push({ pass: Boolean(pass), name, ...detail }); if (!pass) failures.push({ name, ...detail }) }
fs.mkdirSync(output, { recursive: true })

;(async () => {
  const browser = await chromium.launch({ headless: true })
  try {
    for (const [width, height] of viewports) {
      const context = await browser.newContext({ viewport: { width, height } })
      const page = await context.newPage()
      const errors = []
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()))
      page.on("pageerror", (e) => errors.push(String(e)))
      for (const route of focusRoutes) {
        const response = await page.goto(base + route, { waitUntil: "networkidle" })
        check(response?.ok(), `${width} HTTP ${route}`, { status: response?.status() })
        const state = await page.evaluate(() => {
          const header = document.querySelector(".doc-header")?.getBoundingClientRect()
          const title = document.querySelector(".article-title")?.getBoundingClientRect()
          return { overflow: document.documentElement.scrollWidth - innerWidth, overlap: header && title ? Math.max(0, header.bottom - title.top) : 0 }
        })
        check(state.overflow === 0 && state.overlap === 0, `${width} layout ${route}`, state)
      }
      await page.goto(base + "/ai-basics/", { waitUntil: "networkidle" })
      await page.locator(".search-button:visible").first().click()
      await page.locator(".search-container.active").waitFor()
      await page.locator(".search-bar").fill("准备可持续使用的 AI 环境")
      await page.waitForTimeout(400)
      const search = await page.locator(".search-layout").innerText()
      check(search.includes("里程碑二"), `${width} preview searchable`)
      check(!search.includes("配置网络客户端") && !search.includes("安装 CC Switch"), `${width} search does not leak removed steps`)
      await page.keyboard.press("Escape")
      check(errors.filter((e) => !e.startsWith("Failed to load resource")).length === 0, `${width} console/page error=0`, { errors })
      await page.screenshot({ path: path.join(output, `${width}.png`) })
      await context.close()
    }

    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    for (const item of inventory) {
      const response = await page.goto(base + item.route, { waitUntil: "domcontentloaded" })
      check(response?.ok(), `route preserved ${item.route}`, { status: response?.status() })
      const text = await page.locator("article").innerText()
      if (item.kind === "course-preview") {
        check(text.includes("成功标准") && text.includes("能力迁移") && text.includes("暂不销售"), `preview contract ${item.route}`)
        check((await page.locator("article pre code").count()) === 0, `no executable blocks ${item.route}`)
      }
      if (item.kind === "full-preview") check(text.includes("任务 9") && text.includes("毕业检查"), `full trial retained ${item.route}`)
    }
    await context.close()
  } finally { await browser.close() }
  fs.writeFileSync(path.join(output, "results.json"), JSON.stringify({ base, evidence, failures }, null, 2))
  if (failures.length) throw new Error(`${failures.length} failures; see results.json`)
  console.log(`PASS course preview browser at ${base}`)
})().catch((error) => { console.error(error); process.exit(1) })
