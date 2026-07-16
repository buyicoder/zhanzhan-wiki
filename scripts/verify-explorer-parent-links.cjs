const { chromium } = require("playwright")
const fs = require("fs")
const path = require("path")

const baseURL = (process.env.BASE_URL || "http://localhost:8080").replace(/\/$/, "")
const outputDir =
  process.env.OUTPUT_DIR || "/tmp/zhanzhan-wiki-explorer-parent-link-click-fix-20260716/local"
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 900 },
  { name: "mobile", width: 390, height: 844 },
]

const route = (slug) => `${baseURL}/${slug}`
const normalizedPath = (url) => new URL(url).pathname.replace(/\/$/, "")

async function openExplorer(page, width) {
  if (width <= 1100) {
    const button = page.locator(".mobile-explorer")
    if ((await button.getAttribute("aria-expanded")) !== "true") await button.click()
  }
  await page.locator('.folder-container[data-folderpath="toolbox/index"] .folder-toggle').waitFor()
}

async function runViewport(browser, viewport) {
  const page = await browser.newPage({ viewport })
  const consoleErrors = []
  const pageErrors = []
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text())
  })
  page.on("pageerror", (error) => pageErrors.push(String(error)))

  await page.goto(route("start"), { waitUntil: "networkidle" })
  await openExplorer(page, viewport.width)
  const parent = page.locator('.folder-container[data-folderpath="toolbox/index"]')
  const toggle = parent.locator(".folder-toggle")
  const link = parent.locator("a.folder-button")
  const initialURL = page.url()
  const initialExpanded = await toggle.getAttribute("aria-expanded")
  await toggle.click()
  const pointerExpanded = await toggle.getAttribute("aria-expanded")
  if (page.url() !== initialURL) throw new Error(`${viewport.name}: chevron click navigated`)
  if (pointerExpanded === initialExpanded)
    throw new Error(`${viewport.name}: chevron click did not toggle`)
  await toggle.focus()
  await toggle.press("Space")
  if ((await toggle.getAttribute("aria-expanded")) !== initialExpanded) {
    throw new Error(`${viewport.name}: Space did not toggle chevron`)
  }
  await toggle.press("Enter")
  if ((await toggle.getAttribute("aria-expanded")) === initialExpanded) {
    throw new Error(`${viewport.name}: Enter did not toggle chevron`)
  }
  await link.focus()
  await link.press("Enter")
  await page.waitForURL(/\/toolbox\/?$/)
  if (normalizedPath(page.url()) !== normalizedPath(route("toolbox"))) {
    throw new Error(`${viewport.name}: parent link did not navigate`)
  }

  await openExplorer(page, viewport.width)
  const currentParent = page.locator('.folder-container[data-folderpath="toolbox/index"]')
  const currentLink = currentParent.locator("a.folder-button")
  if ((await currentLink.getAttribute("aria-current")) !== "page") {
    throw new Error(`${viewport.name}: current parent lacks aria-current`)
  }
  const currentURL = page.url()
  await currentParent.locator(".folder-toggle").click()
  if (page.url() !== currentURL)
    throw new Error(`${viewport.name}: current parent chevron navigated`)

  const leaf = page.locator(
    'a.nav-file-title[href*="%E4%BF%A1%E6%81%AF%E6%BA%90"], a.nav-file-title[href*="信息源"]',
  )
  await leaf.first().click()
  await page.waitForURL(/toolbox\/(%E4%BF%A1%E6%81%AF%E6%BA%90|信息源)/)

  await openExplorer(page, viewport.width)
  const geometry = await page.evaluate(() => {
    const rows = [...document.querySelectorAll(".folder-container")]
    const violations = []
    for (const row of rows) {
      const button = row.querySelector(".folder-toggle")
      const link = row.querySelector("a.folder-button")
      if (!button || !link) continue
      const b = button.getBoundingClientRect()
      const l = link.getBoundingClientRect()
      if (b.right > l.left + 0.5)
        violations.push({ path: row.dataset.folderpath, button: b.toJSON(), link: l.toJSON() })
    }
    return {
      horizontalOverflow:
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
      overlapViolations: violations,
    }
  })
  if (geometry.horizontalOverflow > 1)
    throw new Error(`${viewport.name}: horizontal overflow ${geometry.horizontalOverflow}`)
  if (geometry.overlapViolations.length)
    throw new Error(`${viewport.name}: folder controls overlap`)
  if (viewport.width <= 1100) {
    const sizes = await page
      .locator(".folder-toggle")
      .evaluateAll((buttons) =>
        buttons
          .map((button) => button.getBoundingClientRect())
          .map(({ width, height }) => ({ width, height })),
      )
    if (sizes.some(({ width, height }) => width < 44 || height < 44)) {
      throw new Error(`${viewport.name}: chevron hit target below 44px`)
    }
  }

  await page.screenshot({ path: path.join(outputDir, `${viewport.name}.png`), fullPage: false })
  await page.close()
  return { viewport, consoleErrors, pageErrors, geometry }
}

;(async () => {
  fs.mkdirSync(outputDir, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  try {
    const results = []
    for (const viewport of viewports) results.push(await runViewport(browser, viewport))
    const failures = results.flatMap((result) => [...result.consoleErrors, ...result.pageErrors])
    fs.writeFileSync(
      path.join(outputDir, "results.json"),
      JSON.stringify({ baseURL, results }, null, 2),
    )
    if (failures.length) throw new Error(`browser errors: ${failures.join(" | ")}`)
    console.log(`PASS explorer parent-link contract at ${baseURL}`)
  } finally {
    await browser.close()
  }
})().catch((error) => {
  console.error(error)
  process.exit(1)
})
