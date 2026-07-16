const { chromium } = require("playwright")
const fs = require("node:fs")
const path = require("node:path")

const base = (process.env.BASE_URL || "http://localhost:8080").replace(/\/$/, "")
const output =
  process.env.OUTPUT_DIR || "/tmp/zhanzhan-wiki-explorer-resize-click-p0-20260716/local"
fs.mkdirSync(output, { recursive: true })
const failures = []
const results = []
const assert = (value, message, detail = {}) => {
  results.push({ pass: Boolean(value), message, ...detail })
  if (!value) failures.push({ message, ...detail })
}

async function open(page, route = "/toolbox/我的完整工具图谱") {
  const response = await page.goto(base + route, { waitUntil: "networkidle" })
  assert(response?.ok(), `HTTP ${route}`, { status: response?.status() })
}

async function desktop(browser, viewport, sidebarWidth) {
  const context = await browser.newContext({ viewport })
  await context.addInitScript(
    (width) => localStorage.setItem("zz-explorer-width", String(width)),
    sidebarWidth,
  )
  const page = await context.newPage()
  const errors = []
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()))
  page.on("pageerror", (e) => errors.push(String(e)))
  await open(page)

  const handle = page.locator(".explorer-resize-handle")
  const initial = Number(await handle.getAttribute("aria-valuenow"))
  const hb = await handle.boundingBox()
  assert(Boolean(hb), `${viewport.width}: separator visible`)
  const urlBeforeResize = page.url()
  await page.mouse.move(hb.x + hb.width / 2, hb.y + 180)
  await page.mouse.down()
  await page.mouse.move(hb.x + hb.width / 2 + 2, hb.y + 180)
  await page.mouse.up()
  assert(
    Number(await handle.getAttribute("aria-valuenow")) === initial,
    `${viewport.width}: 2px jitter does not resize`,
  )

  await page.mouse.move(hb.x + hb.width / 2, hb.y + 180)
  await page.mouse.down()
  const dragDelta = initial >= 500 ? -36 : 36
  await page.mouse.move(hb.x + hb.width / 2 + dragDelta, hb.y + 180, { steps: 5 })
  await page.mouse.up()
  const dragged = Number(await handle.getAttribute("aria-valuenow"))
  assert(dragged !== initial, `${viewport.width}: deliberate separator drag resizes`, {
    initial,
    dragged,
  })
  assert(page.url() === urlBeforeResize, `${viewport.width}: separator drag never navigates`)

  await page.evaluate((width) => {
    localStorage.setItem("zz-explorer-width", String(width))
    document.documentElement.style.setProperty("--zz-explorer-width", width + "px")
    document.dispatchEvent(new CustomEvent("render"))
  }, sidebarWidth)
  await page.waitForTimeout(100)

  const candidates = page.locator(
    ".explorer-content a.folder-button:visible, .explorer-content a.nav-file-title:visible",
  )
  const count = Math.min(5, await candidates.count())
  assert(count >= 5, `${viewport.width}: five real titles available`, { count })
  for (let index = 0; index < count; index++) {
    for (const fraction of [0.15, 0.5, 0.92]) {
      await open(page)
      const link = page
        .locator(
          ".explorer-content a.folder-button:visible, .explorer-content a.nav-file-title:visible",
        )
        .nth(index)
      const href = await link.getAttribute("href")
      const box = await link.boundingBox()
      const before = Number(
        await page.locator(".explorer-resize-handle").getAttribute("aria-valuenow"),
      )
      await page.mouse.click(box.x + box.width * fraction, box.y + box.height / 2)
      await page
        .waitForFunction(
          (target) => location.pathname === new URL(target, location.href).pathname,
          href,
          { timeout: 5000 },
        )
        .catch(() => {})
      const navigated = new URL(page.url()).pathname === new URL(href, page.url()).pathname
      const afterHandle = page.locator(".explorer-resize-handle")
      const after = (await afterHandle.count())
        ? Number(await afterHandle.getAttribute("aria-valuenow"))
        : before
      assert(navigated, `${viewport.width}: title ${index + 1} @${fraction} navigates`, {
        href,
        actual: page.url(),
      })
      assert(after === before, `${viewport.width}: title click does not resize`, { before, after })
    }
  }

  for (let index = 0; index < 10; index++) {
    await open(page, index % 2 ? "/toolbox/信息源" : "/toolbox/我的完整工具图谱")
  }
  const stableHandleCount = await page.locator(".explorer-resize-handle").count()
  assert(
    stableHandleCount === 1,
    `${viewport.width}: one separator after 10 SPA-capable navigations`,
    { stableHandleCount },
  )
  const actionableErrors = errors.filter((error) => !error.startsWith("Failed to load resource"))
  assert(actionableErrors.length === 0, `${viewport.width}: console/page errors=0`, {
    errors: actionableErrors,
  })
  await page.screenshot({ path: path.join(output, `${viewport.width}-${sidebarWidth}.png`) })
  await context.close()
}

async function compact(browser, width) {
  const context = await browser.newContext({ viewport: { width, height: 844 } })
  const page = await context.newPage()
  await open(page)
  assert((await page.locator(".explorer-resize-handle").count()) === 0, `${width}: no separator`)
  await page.locator(".mobile-explorer:visible").click()
  await page.waitForTimeout(250)
  const link = page.locator(".explorer-content a.nav-file-title:visible").first()
  const href = await link.getAttribute("href")
  await link.click()
  await page
    .waitForFunction(
      (target) => location.pathname === new URL(target, location.href).pathname,
      href,
      { timeout: 5000 },
    )
    .catch(() => {})
  assert(
    new URL(page.url()).pathname === new URL(href, page.url()).pathname,
    `${width}: drawer title navigates`,
  )
  await context.close()
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  try {
    await desktop(browser, { width: 1440, height: 1000 }, 240)
    await desktop(browser, { width: 1440, height: 1000 }, 280)
    await desktop(browser, { width: 1440, height: 1000 }, 520)
    await desktop(browser, { width: 1280, height: 900 }, 280)
    for (const width of [1100, 1024, 768, 390, 375]) await compact(browser, width)
    fs.writeFileSync(
      path.join(output, "results.json"),
      JSON.stringify({ base, results, failures }, null, 2),
    )
    if (failures.length) throw new Error(`${failures.length} failures; see results.json`)
    console.log(`PASS explorer resize/click P0 at ${base}`)
  } finally {
    await browser.close()
  }
})().catch((error) => {
  console.error(error)
  process.exit(1)
})
