const { chromium } = require("playwright")
const fs = require("node:fs")
const path = require("node:path")

const base = (process.env.BASE_URL || "http://127.0.0.1:4173/zhanzhan-wiki").replace(/\/$/, "")
const output = process.env.OUTPUT_DIR || "/tmp/zhanzhan-wiki-course-integration-v1-20260715/browser"
fs.mkdirSync(output, { recursive: true })
const manifest = JSON.parse(fs.readFileSync("docs/course-integration-manifest-v1.json", "utf8"))
const lessonRoute = (item) =>
  `/${item.target_path
    .replace(/^content\//, "")
    .replace(/\.md$/, "")
    .toLowerCase()}`
const coreRoutes = ["/ai-basics/", "/ai-basics/macos/", "/ai-basics/windows/"]
const routes = [...coreRoutes, ...manifest.items.map(lessonRoute)]
const viewports = [
  [1440, 1000],
  [768, 900],
  [390, 844],
]
const errors = []
const evidence = []
function check(pass, name, detail = {}) {
  evidence.push({ pass: Boolean(pass), name, ...detail })
  if (!pass) errors.push({ name, ...detail })
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  for (const [width, height] of viewports) {
    const context = await browser.newContext({ viewport: { width, height } })
    const page = await context.newPage()
    const runtimeErrors = []
    page.on(
      "console",
      (message) => message.type() === "error" && runtimeErrors.push(message.text()),
    )
    page.on("pageerror", (error) => runtimeErrors.push(error.message))

    for (const route of routes) {
      const response = await page.goto(`${base}${route}`, {
        waitUntil: "networkidle",
        timeout: 30_000,
      })
      check(response?.ok(), `${width} HTTP ${route}`, { status: response?.status() })
      await page.locator(".doc-header").waitFor({ timeout: 10_000 })
      const state = await page.evaluate(() => {
        const header = document.querySelector(".doc-header")?.getBoundingClientRect()
        const title = document.querySelector(".article-title")?.getBoundingClientRect()
        return {
          overflow: document.documentElement.scrollWidth - innerWidth,
          titleOverlap: !header || !title ? 0 : Math.max(0, header.bottom - title.top),
          passiveScroll: scrollY,
          title: document.querySelector(".article-title")?.textContent?.trim(),
        }
      })
      check(state.overflow === 0, `${width} no overflow ${route}`, state)
      check(state.titleOverlap === 0, `${width} title clear ${route}`, state)
      check(state.passiveScroll === 0, `${width} no passive scroll ${route}`, state)
    }
    check(runtimeErrors.length === 0, `${width} console/page errors=0`, { runtimeErrors })

    for (const route of coreRoutes) {
      await page.goto(`${base}${route}`, { waitUntil: "networkidle" })
      const noticeCount = await page
        .getByText("当前为文字版，操作截图尚未补齐，后续逐步补充", { exact: false })
        .count()
      check(noticeCount > 0, `${width} screenshot notice ${route}`, { noticeCount })
    }

    await page.goto(`${base}/ai-basics/macos/04-里程碑四-git存档`, { waitUntil: "networkidle" })
    const structure = await page.evaluate(() => ({
      codeBlocks: document.querySelectorAll("pre code").length,
      checkboxes: document.querySelectorAll('input[type="checkbox"]').length,
      nav: [...document.querySelectorAll(".reader-journey-next a")].map((a) => ({
        text: a.textContent?.trim(),
        href: a.getAttribute("href"),
      })),
    }))
    check(structure.codeBlocks > 0, `${width} code blocks render`, structure)
    check(structure.checkboxes > 0, `${width} checkboxes render`, structure)
    check(
      structure.nav.some((item) => item.text === "上一篇") &&
        structure.nav.some((item) => item.text === "下一篇"),
      `${width} previous/next render`,
      structure,
    )
    await page.screenshot({ path: path.join(output, `${width}-lesson.png`), fullPage: true })

    await page.goto(`${base}/ai-basics/`, { waitUntil: "networkidle" })
    const search = page.locator(".search-button:visible").first()
    await search.click()
    await page.locator(".search-container.active").waitFor({ timeout: 5000 })
    await page.locator(".search-bar").fill("里程碑一")
    await page.waitForTimeout(300)
    const searchText = await page.locator(".search-layout").innerText()
    check(searchText.includes("让 Agent 第一次操作你的电脑"), `${width} course search result`, {
      searchText: searchText.slice(0, 500),
    })
    await page.keyboard.press("Escape")

    if (width <= 1100) {
      const drawerButton = page.locator(".mobile-explorer:visible")
      await drawerButton.click()
      await page.waitForTimeout(250)
      const openDrawer = await page.locator(".explorer").evaluate((explorer) => {
        const content = explorer.querySelector(".explorer-content")
        const rect = content?.getBoundingClientRect()
        return {
          collapsed: explorer.classList.contains("collapsed"),
          explorerExpanded: explorer.getAttribute("aria-expanded"),
          contentExpanded: content?.getAttribute("aria-expanded"),
          left: rect?.left,
          right: rect?.right,
          width: rect?.width,
        }
      })
      check(
        !openDrawer.collapsed &&
          openDrawer.explorerExpanded === "true" &&
          openDrawer.contentExpanded === "true" &&
          openDrawer.left >= 0 &&
          openDrawer.right > 0 &&
          openDrawer.width >= 300,
        `${width} mobile drawer opens on screen`,
        openDrawer,
      )
      await page.screenshot({
        path: path.join(output, `${width}-course-drawer.png`),
        fullPage: true,
      })
      await drawerButton.click()
      await page.waitForTimeout(250)
      const closedDrawer = await page.locator(".explorer").evaluate((explorer) => ({
        collapsed: explorer.classList.contains("collapsed"),
        explorerExpanded: explorer.getAttribute("aria-expanded"),
        contentExpanded: explorer.querySelector(".explorer-content")?.getAttribute("aria-expanded"),
        right: explorer.querySelector(".explorer-content")?.getBoundingClientRect().right,
      }))
      check(
        closedDrawer.collapsed &&
          closedDrawer.explorerExpanded === "false" &&
          closedDrawer.contentExpanded === "false" &&
          closedDrawer.right <= 0,
        `${width} mobile drawer closes off screen`,
        closedDrawer,
      )
    }
    await context.close()
  }

  for (const platform of ["macos", "windows"]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
    const page = await context.newPage()
    const lessons = manifest.items.filter((item) => item.platform === platform)
    await page.goto(`${base}${lessonRoute(lessons[0])}`, { waitUntil: "networkidle" })
    check(
      (await page.getByRole("link", { name: "上一篇", exact: true }).count()) === 0,
      `${platform} first lesson has no previous`,
    )
    for (let index = 1; index < lessons.length; index++) {
      await page.getByRole("link", { name: "下一篇", exact: true }).click()
      await page
        .waitForURL(`**/${lessonRoute(lessons[index]).slice(1)}`, { timeout: 5000 })
        .catch(() => {})
      check(
        decodeURIComponent(page.url()).endsWith(lessonRoute(lessons[index])),
        `${platform} SPA next reaches ${lessons[index].order}`,
        { final: page.url() },
      )
    }
    check(
      (await page.getByRole("link", { name: "下一篇", exact: true }).count()) === 0,
      `${platform} last lesson has no next`,
    )
    for (let index = lessons.length - 2; index >= 0; index--) {
      await page.getByRole("link", { name: "上一篇", exact: true }).click()
      await page
        .waitForURL(`**/${lessonRoute(lessons[index]).slice(1)}`, { timeout: 5000 })
        .catch(() => {})
      check(
        decodeURIComponent(page.url()).endsWith(lessonRoute(lessons[index])),
        `${platform} SPA previous reaches ${lessons[index].order}`,
        { final: page.url() },
      )
    }
    check(
      (await page.getByRole("link", { name: "上一篇", exact: true }).count()) === 0,
      `${platform} first lesson still has no previous after reverse journey`,
    )
    await context.close()
  }
  await browser.close()

  const result = {
    base,
    pages: routes.length,
    viewports,
    passed: errors.length === 0,
    errors,
    evidence,
  }
  fs.writeFileSync(path.join(output, "result.json"), JSON.stringify(result, null, 2))
  console.log(
    JSON.stringify(
      { passed: result.passed, errors: errors.length, checks: evidence.length, output },
      null,
      2,
    ),
  )
  if (errors.length) process.exit(1)
})().catch((error) => {
  console.error(error)
  process.exit(1)
})
