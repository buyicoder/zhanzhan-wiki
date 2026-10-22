const { chromium } = require("playwright")
const fs = require("node:fs")
const path = require("node:path")

const base = (process.env.BASE_URL || "http://127.0.0.1:8093").replace(/\/$/, "")
const output = process.env.OUTPUT_DIR || "/tmp/zhanzhan-wiki-home-browser"
const viewports = [
  { width: 1440, height: 1000 },
  { width: 1100, height: 900 },
  { width: 768, height: 900 },
  { width: 390, height: 844 },
]
const expectedPaths = [
  "/input/",
  "/capability/",
  "/leverage/",
  "/ai-work/",
  "/portfolio/",
  "/expression/",
  "/life/",
  "/tutorials/",
]

fs.mkdirSync(output, { recursive: true })
;(async () => {
  const browser = await chromium.launch({ headless: true })
  const failures = []
  const evidence = []

  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport })
    const page = await context.newPage()
    const errors = []
    page.on("console", (message) => message.type() === "error" && errors.push(message.text()))
    page.on("pageerror", (error) => errors.push(error.message))
    const response = await page.goto(`${base}/`, { waitUntil: "networkidle" })
    const text = await page.locator("article").innerText()
    const hrefs = await page
      .locator("article a")
      .evaluateAll((links) => links.map((link) => link.href))
    const dimensions = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }))

    if (!response?.ok()) failures.push(`${viewport.width}: HTTP ${response?.status()}`)
    if (!text.includes("从信息源开始")) failures.push(`${viewport.width}: missing home promise`)
    if (!text.includes("canonical 总地图")) failures.push(`${viewport.width}: map is not canonical`)
    if (!text.includes("进阶完整版仍在整理，暂不销售"))
      failures.push(`${viewport.width}: course boundary missing`)
    if (text.includes("六条读者路径")) failures.push(`${viewport.width}: legacy IA copy remains`)
    for (const route of ["/map/", ...expectedPaths]) {
      if (!hrefs.some((href) => decodeURIComponent(new URL(href).pathname).endsWith(route))) {
        failures.push(`${viewport.width}: missing route ${route}`)
      }
    }
    if (dimensions.scroll > dimensions.client + 1)
      failures.push(`${viewport.width}: horizontal overflow`)
    if (errors.length) failures.push(`${viewport.width}: console/page errors=${errors.length}`)

    await page.screenshot({ path: path.join(output, `${viewport.width}.png`), fullPage: true })
    evidence.push({ viewport, errors, dimensions })
    await context.close()
  }

  fs.writeFileSync(
    path.join(output, "results.json"),
    JSON.stringify({ base, failures, evidence }, null, 2),
  )
  await browser.close()
  if (failures.length) throw new Error(`${failures.length} home browser failures`)
  console.log(`PASS home browser at ${base}`)
})().catch((error) => {
  console.error(error)
  process.exit(1)
})
