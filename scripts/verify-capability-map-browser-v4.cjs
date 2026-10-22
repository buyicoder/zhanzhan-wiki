const { chromium } = require("playwright")
const fs = require("node:fs")
const path = require("node:path")

const base = (process.env.BASE_URL || "http://localhost:8080").replace(/\/$/, "")
const output =
  process.env.OUTPUT_DIR || "/tmp/zhanzhan-wiki-personal-capability-map-ia-v4-20260716/local"
const inventory = JSON.parse(
  fs.readFileSync(
    "/tmp/zhanzhan-wiki-personal-capability-map-ia-v4-20260716/content-inventory.json",
    "utf8",
  ),
).inventory
const hubs = [
  "map",
  "input",
  "capability",
  "leverage",
  "ai-work",
  "portfolio",
  "expression",
  "life",
  "tutorials",
]
const hubTitles = [
  "信息源：我的 AI 时代个人能力系统",
  "输入系统",
  "学习与能力",
  "工具与杠杆",
  "AI 工作系统",
  "项目与作品",
  "内容与表达",
  "人生操作系统",
  "教程与复利",
]
const oldRoutes = [
  ["/start", "/map"],
  ["/toolbox/信息源", "/map"],
  ["/toolbox/我的完整工具图谱", "/leverage/我的完整工具图谱"],
  ["/learning/ai时代的七条基础能力", "/capability/ai时代的七条基础能力"],
  ["/thinking/数学正在从答案稀缺进入理解稀缺", "/capability/数学正在从答案稀缺进入理解稀缺"],
  ["/business/企业ai转型方法论", "/ai-work/企业ai转型方法论"],
  ["/business/ai赋能的方向是工作不是娱乐", "/ai-work/ai赋能的方向是工作不是娱乐"],
  ["/cases/为什么我给自己造了一个jarvis", "/portfolio/为什么我给自己造了一个jarvis"],
  ["/cases/ai写小说的真相", "/portfolio/ai写小说的真相"],
  ["/cases/前端需求要给视觉参照", "/ai-work/前端需求要给视觉参照"],
  ["/ai-basics/高考完之后-焚决", "/capability/高考完之后-焚决"],
]
const viewports = [
  [1440, 1000],
  [1280, 900],
  [1100, 900],
  [1024, 900],
  [768, 900],
  [390, 844],
  [375, 667],
]
const failures = [],
  evidence = []
const check = (pass, name, detail = {}) => {
  evidence.push({ pass: Boolean(pass), name, ...detail })
  if (!pass) failures.push({ name, ...detail })
}
fs.mkdirSync(output, { recursive: true })
;(async () => {
  const browser = await chromium.launch({ headless: true })
  try {
    for (const [width, height] of viewports) {
      const context = await browser.newContext({ viewport: { width, height } }),
        page = await context.newPage(),
        errors = []
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()))
      page.on("pageerror", (e) => errors.push(String(e)))
      for (const hub of hubs) {
        const response = await page.goto(`${base}/${hub}`, { waitUntil: "networkidle" })
        check(response?.ok(), `${width} hub HTTP ${hub}`, { status: response?.status() })
        const state = await page.evaluate(() => {
          const h = document.querySelector(".doc-header")?.getBoundingClientRect(),
            t = document.querySelector(".article-title")?.getBoundingClientRect()
          return {
            overflow: document.documentElement.scrollWidth - innerWidth,
            overlap: h && t ? Math.max(0, h.bottom - t.top) : 0,
          }
        })
        check(state.overflow === 0 && state.overlap === 0, `${width} hub layout ${hub}`, state)
        check(
          (await page.getByRole("link", { name: /我的 AI 时代个人能力系统/ }).count()) > 0 ||
            hub === "map",
          `${width} hub returns to map ${hub}`,
        )
      }
      await page.goto(`${base}/map`, { waitUntil: "networkidle" })
      const mapLinks = await page
        .locator("article a.internal")
        .evaluateAll((links) => links.map((a) => a.textContent.trim()))
      for (const title of hubTitles.slice(1))
        check(mapLinks.includes(title), `${width} map links ${title}`)
      if (width > 1100) {
        const visibleFolders = await page
          .locator(".explorer-ul > li:not([hidden]) > .folder-container a.folder-button")
          .evaluateAll((a) => a.map((x) => x.textContent.trim()))
        check(
          JSON.stringify(visibleFolders.slice(0, 9)) === JSON.stringify(hubTitles),
          `${width} Explorer top IA`,
          { visibleFolders },
        )
      } else {
        check(
          (await page.locator(".explorer-resize-handle").count()) === 0,
          `${width} compact has no resizer`,
        )
      }
      check(
        errors.filter((e) => !e.startsWith("Failed to load resource")).length === 0,
        `${width} console/page error=0`,
        { errors },
      )
      await page.screenshot({ path: path.join(output, `${width}.png`) })
      await context.close()
    }

    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } }),
      page = await context.newPage()
    for (const item of inventory) {
      const response = await page.goto(base + item.canonicalRoute, {
        waitUntil: "domcontentloaded",
      })
      check(response?.ok(), `canonical HTTP ${item.canonicalRoute}`, { status: response?.status() })
    }
    for (const [oldRoute, canonical] of oldRoutes) {
      const response = await page.goto(base + oldRoute, { waitUntil: "domcontentloaded" })
      check(response?.ok(), `old HTTP ${oldRoute}`, { status: response?.status() })
      const normalized = (value) => decodeURIComponent(value).replace(/\/$/, "").toLowerCase()
      await page
        .waitForURL((url) => normalized(url.pathname).endsWith(normalized(canonical)), {
          timeout: 15_000,
        })
        .catch(() => {})
      check(
        normalized(new URL(page.url()).pathname).endsWith(normalized(canonical)),
        `old redirects ${oldRoute}`,
        { actual: decodeURIComponent(new URL(page.url()).pathname), canonical },
      )
      const refreshedUrl = page.url()
      await page.goto(refreshedUrl, { waitUntil: "domcontentloaded" })
      check(
        normalized(new URL(page.url()).pathname).endsWith(normalized(canonical)),
        `refresh canonical ${oldRoute}`,
      )
    }
    await page.goto(`${base}/map`, { waitUntil: "networkidle" })
    await page.locator(".search-button:visible").first().click()
    await page.locator(".search-bar").fill("企业 AI 转型方法论")
    await page.waitForTimeout(400)
    const cards = page.locator(".search-layout .result-card")
    const texts = await cards.allInnerTexts()
    const hrefs = await cards.evaluateAll((a) =>
      a.map((x) => decodeURIComponent(x.getAttribute("href") || "").toLowerCase()),
    )
    check(
      hrefs.filter((h) => h.includes("/ai-work/企业ai转型方法论")).length === 1,
      "search has one canonical article result",
      { hrefs, texts: texts.map((t) => t.slice(0, 80)) },
    )
    await context.close()
  } finally {
    await browser.close()
  }
  fs.writeFileSync(
    path.join(output, "results.json"),
    JSON.stringify({ base, evidence, failures }, null, 2),
  )
  if (failures.length) throw new Error(`${failures.length} failures; see results.json`)
  console.log(`PASS capability map IA V4 at ${base}`)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
