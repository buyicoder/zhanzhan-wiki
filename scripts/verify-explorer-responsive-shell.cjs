const { chromium } = require("playwright")
const fs = require("node:fs")
const path = require("node:path")

const base = (process.env.BASE_URL || "http://127.0.0.1:8080").replace(/\/$/, "")
const output = process.env.OUTPUT_DIR || "/tmp/zhanzhan-wiki-explorer-responsive-shell"
const expectedRoots = [
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

fs.mkdirSync(output, { recursive: true })
const failures = []
const evidence = []
const check = (condition, message, detail = {}) => {
  evidence.push({ pass: Boolean(condition), message, ...detail })
  if (!condition) failures.push({ message, ...detail })
}

const readState = (page) =>
  page.evaluate(() => {
    const visible = (element) => Boolean(element?.checkVisibility())
    const rectangle = (element) => {
      const box = element?.getBoundingClientRect()
      return box ? { x: box.x, width: box.width, right: box.right, height: box.height } : undefined
    }
    const content = document.querySelector(".explorer-content")
    return {
      content: rectangle(content),
      article: rectangle(document.querySelector("article")),
      contentPosition: content ? getComputedStyle(content).position : undefined,
      contentAria: content?.getAttribute("aria-expanded"),
      contentScrollTop: content?.scrollTop,
      desktopVisible: visible(document.querySelector(".desktop-explorer")),
      mobileVisible: visible(document.querySelector(".mobile-explorer")),
      menuStroke: getComputedStyle(document.querySelector(".mobile-explorer .lucide-menu")).stroke,
      roots: [
        ...document.querySelectorAll(
          ".explorer-ul > li:not([hidden]) > .folder-container a.folder-button",
        ),
      ]
        .filter(visible)
        .map((element) => element.textContent.trim()),
      overflow: document.documentElement.scrollWidth > innerWidth,
    }
  })

async function verify(browser, width) {
  const page = await browser.newPage({ viewport: { width, height: width <= 800 ? 844 : 900 } })
  const errors = []
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()))
  page.on("pageerror", (error) => errors.push(String(error)))
  const response = await page.goto(`${base}/leverage/`, { waitUntil: "domcontentloaded" })
  check(response?.ok(), `${width}: route loads`, { status: response?.status() })
  await page.waitForTimeout(500)

  let state = await readState(page)
  check(!state.overflow, `${width}: no horizontal overflow`)
  if (width > 800) {
    check(state.desktopVisible && !state.mobileVisible, `${width}: persistent directory control`)
    check(state.contentPosition !== "fixed", `${width}: directory is part of the page grid`)
    check(
      state.content.right <= state.article.x + 1,
      `${width}: directory does not cover article`,
      state,
    )
    const toggle = page.locator(".desktop-explorer:visible")
    await toggle.click()
    await toggle.click()
    await page.waitForTimeout(250)
    state = await readState(page)
    check(
      expectedRoots.every((root) => state.roots.includes(root)),
      `${width}: expand restores every global root`,
      { roots: state.roots },
    )
    check(state.contentScrollTop === 0, `${width}: expand returns to the global tree start`)
  } else {
    check(state.mobileVisible && !state.desktopVisible, `${width}: mobile menu control`)
    check(state.menuStroke !== "none", `${width}: mobile menu icon is visible`)
    await page.locator(".mobile-explorer:visible").click()
    await page.waitForTimeout(500)
    state = await readState(page)
    check(state.content.x === 0, `${width}: mobile directory aligns to viewport`)
    check(state.content.width === width, `${width}: mobile directory is full-screen`)
    check(
      expectedRoots.every((root) => state.roots.includes(root)),
      `${width}: mobile directory contains every global root`,
      { roots: state.roots },
    )
  }
  check(errors.length === 0, `${width}: no console or page errors`, { errors })
  await page.screenshot({ path: path.join(output, `${width}.png`) })
  await page.close()
}

;(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH,
  })
  for (const width of [1440, 1100, 1024, 768, 390]) await verify(browser, width)
  await browser.close()
  fs.writeFileSync(
    path.join(output, "results.json"),
    JSON.stringify({ evidence, failures }, null, 2),
  )
  if (failures.length) {
    console.error(JSON.stringify(failures, null, 2))
    process.exit(1)
  }
  console.log(`Explorer responsive shell: ${evidence.length}/${evidence.length} PASS`)
})()
