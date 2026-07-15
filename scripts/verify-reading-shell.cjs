const { chromium } = require("playwright")
const fs = require("node:fs")
const path = require("node:path")

const base = (process.env.BASE_URL || "https://buyicoder.github.io/zhanzhan-wiki").replace(
  /\/$/,
  "",
)
const output = process.env.OUTPUT_DIR || "/tmp/zhanzhan-wiki-reading-shell-regression"
fs.mkdirSync(output, { recursive: true })

const articleRoute = "/works/ai时代最不重要的能力恰恰是大家最焦虑的"
const folderRoute = "/works/"
const failures = []
const evidence = []

function check(condition, message, detail = {}) {
  evidence.push({ message, pass: Boolean(condition), ...detail })
  if (!condition) failures.push({ message, ...detail })
}

function intersects(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
}

async function directLoad(page, route) {
  const response = await page.goto(`${base}${route}`, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  })
  check(response?.ok(), `HTTP success: ${route}`, { status: response?.status() })
  await page.locator(".doc-header").waitFor({ state: "visible", timeout: 10_000 })
}

async function verifyNoPassiveScroll(browser, width) {
  const context = await browser.newContext({ viewport: { width, height: 800 } })
  const page = await context.newPage()
  const logs = []
  page.on("console", (message) => logs.push({ type: message.type(), text: message.text() }))
  await directLoad(page, articleRoute)
  const start = await page.evaluate(() => ({
    y: scrollY,
    h1: document.querySelector(".article-title")?.getBoundingClientRect().top,
  }))
  await page.waitForTimeout(5_000)
  const end = await page.evaluate(() => {
    const header = document.querySelector(".doc-header")?.getBoundingClientRect()
    const h1 = document.querySelector(".article-title")?.getBoundingClientRect()
    const first = document.querySelector("article p")?.getBoundingClientRect()
    const explorer = document.querySelector(".explorer-content")
    return {
      y: scrollY,
      h1Top: h1?.top,
      h1Bottom: h1?.bottom,
      firstTop: first?.top,
      headerBottom: header?.bottom,
      explorerScrollTop: explorer?.scrollTop,
    }
  })
  check(end.y === start.y, `${width}: no passive window scroll for 5s`, { start, end })
  check((end.h1Bottom ?? -1) > (end.headerBottom ?? 0), `${width}: title remains visible`, { end })
  check(
    !logs.some((entry) => entry.text.includes("[Explorer]")),
    `${width}: no Explorer lifecycle logs`,
    { logs: logs.filter((entry) => entry.text.includes("[Explorer]")) },
  )
  await page.screenshot({ path: path.join(output, `${width}-no-passive-scroll.png`) })
  await context.close()
}

async function verifyFirstVisibleInteractions(browser, width) {
  const context = await browser.newContext({
    viewport: { width, height: width < 800 ? 844 : 1000 },
  })
  const page = await context.newPage()
  await directLoad(page, "/works/ai写小说的真相")

  const search = page.locator(".search-button:visible").first()
  await search.click()
  await page
    .locator(".search-container.active")
    .waitFor({ state: "visible", timeout: 4_000 })
    .catch(() => {})
  check(
    await page.locator(".search-container.active").count(),
    `${width}: earliest visible Search click opens`,
  )
  if (await page.locator(".search-container.active").count()) await page.keyboard.press("Escape")

  if (width < 800) {
    const menu = page.locator(".mobile-explorer:visible").first()
    await menu.click()
    await page.waitForTimeout(500)
    check(
      (await page.locator(".explorer").getAttribute("class"))?.includes("collapsed") === false,
      `${width}: earliest hamburger click opens drawer`,
    )
  }

  const theme = page.locator(".darkmode:visible").first()
  const beforeTheme = await page.evaluate(() =>
    document.documentElement.getAttribute("saved-theme"),
  )
  if (await theme.count()) await theme.click()
  await page.waitForTimeout(500)
  const afterTheme = await page.evaluate(() => document.documentElement.getAttribute("saved-theme"))
  check(
    Boolean(await theme.count()) && beforeTheme !== afterTheme,
    `${width}: earliest theme click changes theme`,
    { beforeTheme, afterTheme },
  )

  const reader = page.locator(".readermode:visible").first()
  if (await reader.count()) await reader.click()
  await page.waitForTimeout(500)
  check(
    Boolean(await reader.count()) &&
      (await page.evaluate(() => document.documentElement.getAttribute("reader-mode"))) === "on",
    `${width}: earliest reader click changes mode`,
  )
  await page.screenshot({ path: path.join(output, `${width}-interactions.png`) })
  await context.close()
}

async function verifyResponsiveShell(browser) {
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 } })
  const page = await context.newPage()
  await directLoad(page, folderRoute)
  await page.waitForTimeout(2_000)
  const layout = await page.evaluate(() => {
    const rect = (selector) => {
      const value = document.querySelector(selector)?.getBoundingClientRect()
      return (
        value && {
          left: value.left,
          right: value.right,
          top: value.top,
          bottom: value.bottom,
          width: value.width,
          height: value.height,
        }
      )
    }
    const tags = [...document.querySelectorAll(".section-ul .tags a")].map((entry) => {
      const value = entry.getBoundingClientRect()
      return { text: entry.textContent?.trim(), width: value.width, height: value.height }
    })
    return {
      center: rect(".center"),
      right: rect(".sidebar.right"),
      article: rect("article"),
      tags,
    }
  })
  check((layout.center?.width ?? 0) >= 700, "1024: center remains readable", { layout })
  check(
    (layout.right?.width ?? 0) === 0 ||
      (layout.right?.top ?? 0) >= (layout.center?.bottom ?? Infinity),
    "1024: right rail does not reserve a fixed empty column",
    { layout },
  )
  check(
    layout.tags.every((tag) => tag.width >= 40 && tag.height <= 24),
    "1024: tags do not fragment vertically",
    { tags: layout.tags },
  )
  await page.screenshot({ path: path.join(output, "1024-folder.png") })
  await context.close()
}

async function verifyShortMobile(browser, width) {
  const context = await browser.newContext({ viewport: { width, height: 667 } })
  const page = await context.newPage()
  await directLoad(page, "/")
  await page.locator(".mobile-explorer:visible").click()
  await page.waitForTimeout(500)
  const geometry = await page.evaluate(() => {
    const controls = [...document.querySelectorAll(".darkmode, .readermode")]
      .filter((entry) => entry.getClientRects().length > 0)
      .map((entry) => entry.getBoundingClientRect().toJSON())
    const content = [
      ...document.querySelectorAll(
        ".explorer-content a, .explorer-content button, article p, article li, article a, footer a",
      ),
    ]
      .filter((entry) => entry.getClientRects().length > 0)
      .map((entry) => entry.getBoundingClientRect().toJSON())
    return { controls, content, overflow: document.documentElement.scrollWidth - innerWidth }
  })
  const overlaps = geometry.controls.flatMap((control) =>
    geometry.content
      .filter((entry) => intersects(control, entry))
      .map((entry) => ({ control, entry })),
  )
  check(overlaps.length === 0, `${width}x667: utilities do not overlap content`, { overlaps })
  check(
    geometry.controls.length === 2 &&
      geometry.controls.every((control) => control.width >= 44 && control.height >= 44),
    `${width}x667: drawer utilities expose two 44px targets`,
    { controls: geometry.controls },
  )
  check(geometry.overflow === 0, `${width}x667: no horizontal overflow`, {
    overflow: geometry.overflow,
  })
  await page.screenshot({ path: path.join(output, `${width}x667-short.png`) })
  await context.close()
}

async function verifyDelayedInitialization(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  await page.route("**/static/contentIndex.json", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 3_000))
    await route.continue()
  })
  const navigation = page.goto(`${base}/works/ai写小说的真相`, {
    waitUntil: "load",
    timeout: 30_000,
  })
  const search = page.locator(".search-button:visible").first()
  await search.waitFor({ state: "visible", timeout: 10_000 })
  await search.click()
  const response = await navigation
  check(response?.ok(), "delayed content index: HTTP success", { status: response?.status() })
  await page
    .locator(".search-container.active")
    .waitFor({ state: "visible", timeout: 6_000 })
    .catch(() => {})
  check(
    (await page.locator(".search-container.active").count()) === 1,
    "delayed content index: earliest Search click is replayed after async setup",
  )
  await context.close()
}

async function verifyRenderIdempotency(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  await directLoad(page, "/")
  await page.waitForFunction(() => document.documentElement.dataset.componentsReady === "true")
  await page.evaluate(() => document.dispatchEvent(new CustomEvent("render")))
  await page.waitForTimeout(200)

  const explorer = page.locator(".explorer").first()
  const beforeExplorer = await explorer.getAttribute("class")
  await page.locator(".desktop-explorer:visible").click()
  const afterExplorer = await explorer.getAttribute("class")
  check(beforeExplorer !== afterExplorer, "render: Explorer changes state exactly once")

  const beforeTheme = await page.evaluate(() =>
    document.documentElement.getAttribute("saved-theme"),
  )
  await page.locator(".darkmode:visible").click()
  const afterTheme = await page.evaluate(() => document.documentElement.getAttribute("saved-theme"))
  check(beforeTheme !== afterTheme, "render: theme changes state exactly once")

  await page.locator(".readermode:visible").click()
  check(
    (await page.evaluate(() => document.documentElement.getAttribute("reader-mode"))) === "on",
    "render: reader mode changes state exactly once",
  )
  await context.close()
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  for (const width of [1440, 1024]) await verifyNoPassiveScroll(browser, width)
  for (const width of [1440, 390]) await verifyFirstVisibleInteractions(browser, width)
  await verifyResponsiveShell(browser)
  for (const width of [390, 375]) await verifyShortMobile(browser, width)
  await verifyDelayedInitialization(browser)
  await verifyRenderIdempotency(browser)
  await browser.close()
  const result = { base, passed: failures.length === 0, failures, evidence }
  fs.writeFileSync(path.join(output, "result.json"), JSON.stringify(result, null, 2))
  console.log(JSON.stringify({ passed: result.passed, failures: failures.length, output }, null, 2))
  if (failures.length) process.exit(1)
})().catch((error) => {
  console.error(error)
  process.exit(1)
})
