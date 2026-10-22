const { chromium } = require("playwright")
const fs = require("node:fs")
const path = require("node:path")

const base = (process.env.BASE_URL || "http://127.0.0.1:4173/zhanzhan-wiki").replace(/\/$/, "")
const output = process.env.OUTPUT_DIR || "/tmp/zhanzhan-wiki-reader-journey-ia-v3-20260715/browser"
fs.mkdirSync(output, { recursive: true })

const routes = [
  "/",
  "/start/",
  "/ai-basics/",
  "/learning/",
  "/business/",
  "/cases/",
  "/thinking/",
  "/now",
  "/conventions",
  "/ai-basics/高考完之后-焚决",
  "/learning/ai时代的七条基础能力",
  "/learning/ai时代最不重要的能力恰恰是大家最焦虑的",
  "/business/ai赋能的方向是工作不是娱乐",
  "/business/个人知识库不是给自己看的",
  "/cases/ai写小说的真相",
  "/cases/前端需求要给视觉参照",
  "/cases/协议解析代码必须默认高风险",
  "/cases/为什么我给自己造了一个jarvis",
  "/cases/我的ai记忆系统这样存东西",
  "/cases/我给ai小白课埋了六个坑",
  "/thinking/数学正在从答案稀缺进入理解稀缺",
]
const oldRoutes = [
  "/works/高考完之后-焚决",
  "/garden/ai时代的七条基础能力",
  "/works/ai时代最不重要的能力恰恰是大家最焦虑的",
  "/garden/ai赋能的方向是工作不是娱乐",
  "/garden/个人知识库不是给自己看的",
  "/works/ai写小说的真相",
  "/garden/前端需求要给视觉参照",
  "/garden/协议解析代码必须默认高风险",
  "/logs/为什么我给自己造了一个jarvis",
  "/logs/我的ai记忆系统这样存东西",
  "/logs/我给ai小白课埋了六个坑",
  "/garden/数学正在从答案稀缺进入理解稀缺",
  "/works/",
  "/garden/",
  "/logs/",
  "/projects/",
]
const viewports = [
  [1440, 1000],
  [1024, 768],
  [768, 900],
  [390, 844],
  [375, 667],
]
const errors = []
const evidence = []
function check(pass, name, detail = {}) {
  evidence.push({ pass: Boolean(pass), name, ...detail })
  if (!pass) errors.push({ name, ...detail })
}

async function open(page, route) {
  const response = await page.goto(`${base}${route}`, { waitUntil: "networkidle", timeout: 30_000 })
  check(response?.ok(), `HTTP ${route}`, { status: response?.status() })
  await page.locator(".doc-header").waitFor({ timeout: 10_000 })
  await page.waitForTimeout(100)
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const crawlContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const crawl = await crawlContext.newPage()
  const consoleErrors = []
  crawl.on("console", (message) => message.type() === "error" && consoleErrors.push(message.text()))
  crawl.on("pageerror", (error) => consoleErrors.push(error.message))
  for (const route of routes) {
    await open(crawl, route)
    const state = await crawl.evaluate(() => {
      const header = document.querySelector(".doc-header")?.getBoundingClientRect()
      const title = document.querySelector(".article-title")?.getBoundingClientRect()
      return {
        overflow: document.documentElement.scrollWidth - innerWidth,
        y: scrollY,
        titleVisible: !title || !header || title.bottom > header.bottom,
        properties: document.querySelector(".note-properties-title")?.textContent?.trim(),
      }
    })
    check(state.overflow === 0, `no overflow ${route}`, state)
    check(state.y === 0, `no passive scroll ${route}`, state)
    check(state.titleVisible, `title clear of header ${route}`, state)
    check(state.properties !== "Properties", `metadata localized ${route}`, state)
  }
  check(consoleErrors.length === 0, "console/page errors=0", { consoleErrors })

  for (const route of oldRoutes) {
    const response = await crawl.goto(`${base}${route}`, {
      waitUntil: "networkidle",
      timeout: 30_000,
    })
    check(response?.ok(), `legacy HTTP ${route}`, {
      status: response?.status(),
      final: crawl.url(),
    })
    check(!crawl.url().includes("404"), `legacy resolves ${route}`, { final: crawl.url() })
  }

  for (const [width, height] of viewports) {
    const context = await browser.newContext({ viewport: { width, height } })
    const page = await context.newPage()
    await open(page, "/")
    const initial = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - innerWidth,
      heading: document.querySelector("h1")?.textContent?.trim(),
      promise: document
        .querySelector("article")
        ?.textContent?.includes("从不会用 AI，到能独立学习、开发、工作和创造价值"),
      nav: [...document.querySelectorAll(".doc-header-nav a")].map((a) => a.textContent?.trim()),
    }))
    check(initial.overflow === 0, `${width}x${height} no overflow`, initial)
    check(initial.promise, `${width}x${height} public promise visible`, initial)
    if (width > 1100) check(initial.nav.length === 6, `${width} six header paths`, initial)
    await page.screenshot({
      path: path.join(output, `${width}x${height}-home.png`),
      fullPage: true,
    })

    const search = page.locator(".search-button:visible").first()
    await search.click()
    await page.locator(".search-container.active").waitFor({ timeout: 5000 })
    await page.locator(".search-bar").fill("AI")
    await page.waitForTimeout(300)
    const legacySearch = await page
      .locator(
        '.result-card[href*="/works/"], .result-card[href*="/garden/"], .result-card[href*="/logs/"], .result-card[href*="/projects/"]',
      )
      .count()
    check(legacySearch === 0, `${width} search hides legacy roots`, { legacySearch })
    await page.keyboard.press("Escape")

    if (width <= 1100) {
      await page.locator(".mobile-explorer:visible").click()
      await page.waitForFunction(
        () => !document.querySelector(".explorer")?.classList.contains("collapsed"),
      )
      await page.waitForTimeout(250)
      const drawer = await page.evaluate(() => ({
        visibleRoots: [
          ...document.querySelectorAll(".explorer-ul > li:not([hidden]) > .folder-container"),
        ].map((folder) => folder.querySelector(".folder-title")?.textContent?.trim()),
        controls: [...document.querySelectorAll(".darkmode, .readermode")]
          .filter((e) => e.getClientRects().length)
          .map((e) => e.getBoundingClientRect().toJSON()),
      }))
      check(
        drawer.visibleRoots.slice(0, 6).join("|") ===
          "开始这里|AI 小白入门实战|AI 时代学习方法|AI 工作与商业|真实案例|占占的判断",
        `${width} drawer IA order`,
        drawer,
      )
      if (width === 1024)
        check(
          drawer.controls.every((r) => r.width >= 44 && r.height >= 44),
          "1024 theme/reader targets >=44",
          drawer,
        )
      await page.screenshot({
        path: path.join(output, `${width}x${height}-drawer.png`),
        fullPage: true,
      })
    }
    await context.close()
  }

  await open(crawl, "/cases/ai写小说的真相")
  const next = crawl.locator(".reader-journey-next a").last()
  check((await next.count()) === 1, "article has contextual next step", {
    text: await next.textContent(),
  })
  await next.click()
  await crawl
    .waitForURL(
      "**/cases/%E5%89%8D%E7%AB%AF%E9%9C%80%E6%B1%82%E8%A6%81%E7%BB%99%E8%A7%86%E8%A7%89%E5%8F%82%E7%85%A7",
      { timeout: 5000 },
    )
    .catch(() => {})
  check(
    decodeURIComponent(crawl.url()).includes("/cases/前端需求要给视觉参照"),
    "next step click reaches expected article",
    { final: crawl.url() },
  )

  await crawlContext.close()
  await browser.close()
  const result = { base, passed: errors.length === 0, errors, evidence }
  fs.writeFileSync(path.join(output, "result.json"), JSON.stringify(result, null, 2))
  console.log(JSON.stringify({ passed: result.passed, errors: errors.length, output }, null, 2))
  if (errors.length) process.exit(1)
})().catch((error) => {
  console.error(error)
  process.exit(1)
})
