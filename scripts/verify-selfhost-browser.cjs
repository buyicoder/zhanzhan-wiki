const { chromium } = require("playwright")
const fs = require("node:fs")
const path = require("node:path")

const base = (process.env.BASE_URL || "http://127.0.0.1:8091").replace(/\/$/, "")
const output = process.env.OUTPUT_DIR || "/tmp/zhanzhan-wiki-selfhost-browser"
const viewports = [
  { width: 1440, height: 1000 },
  { width: 1100, height: 900 },
  { width: 390, height: 844 },
]

fs.mkdirSync(output, { recursive: true })
;(async () => {
  const browser = await chromium.launch({ headless: true })
  const failures = []
  const evidence = []

  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport })
    const page = await context.newPage()
    const requests = []
    const errors = []
    page.on("request", (request) => requests.push(request.url()))
    page.on("console", (message) => message.type() === "error" && errors.push(message.text()))
    page.on("pageerror", (error) => errors.push(error.message))

    const response = await page.goto(`${base}/map`, { waitUntil: "networkidle" })
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href")
    const badRequests = requests.filter((url) => url.includes("/zhanzhan-wiki/"))
    const bodyWidth = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }))

    if (!response?.ok()) failures.push(`${viewport.width}: /map HTTP ${response?.status()}`)
    if (!canonical?.startsWith("https://wiki.zhanzhanai.com/")) {
      failures.push(`${viewport.width}: canonical=${canonical}`)
    }
    if (badRequests.length)
      failures.push(`${viewport.width}: subpath requests=${badRequests.length}`)
    if (errors.length) failures.push(`${viewport.width}: console/page errors=${errors.length}`)
    if (bodyWidth.scroll > bodyWidth.client + 1)
      failures.push(`${viewport.width}: horizontal overflow`)

    await page.screenshot({ path: path.join(output, `${viewport.width}.png`), fullPage: false })
    evidence.push({
      viewport,
      canonical,
      requestCount: requests.length,
      badRequests,
      errors,
      bodyWidth,
    })
    await context.close()
  }

  fs.writeFileSync(
    path.join(output, "results.json"),
    JSON.stringify({ base, failures, evidence }, null, 2),
  )
  await browser.close()
  if (failures.length) throw new Error(`${failures.length} self-host browser failures`)
  console.log(`PASS self-host browser at ${base}`)
})().catch((error) => {
  console.error(error)
  process.exit(1)
})
