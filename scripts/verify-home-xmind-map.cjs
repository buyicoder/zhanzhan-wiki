const { chromium } = require("playwright")
const fs = require("node:fs")
const path = require("node:path")

const base = (process.env.BASE_URL || "http://localhost:8080").replace(/\/$/, "")
const output = process.env.OUTPUT_DIR || "/tmp/zhanzhan-wiki-home-xmind-map-20260717/local"
const buildDirectory =
  process.env.BUILD_DIR || "/tmp/zhanzhan-wiki-home-xmind-map-20260717/local-build"
const viewports = [
  [1440, 1000],
  [1100, 900],
  [768, 900],
  [390, 844],
  [375, 667],
]
const failures = [],
  evidence = []
const check = (value, name, detail = {}) => {
  evidence.push({ pass: Boolean(value), name, ...detail })
  if (!value) failures.push({ name, ...detail })
}
fs.mkdirSync(output, { recursive: true })
const forbiddenArtifactFiles = fs
  .readdirSync(buildDirectory, { recursive: true })
  .map(String)
  .filter((file) => /(?:^|\/)(?:content|metadata)\.json$/i.test(file) || /\.xmind$/i.test(file))
check(forbiddenArtifactFiles.length === 0, "artifact excludes XMind source and metadata", {
  forbiddenArtifactFiles,
})
;(async () => {
  const browser = await chromium.launch({ headless: true })
  try {
    for (const [width, height] of viewports) {
      const context = await browser.newContext({ viewport: { width, height } })
      const page = await context.newPage()
      const errors = []
      page.on("console", (message) => message.type() === "error" && errors.push(message.text()))
      page.on("pageerror", (error) => errors.push(String(error)))
      const response = await page.goto(`${base}/`, { waitUntil: "domcontentloaded" })
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {})
      check(response?.ok(), `${width} home HTTP`, { status: response?.status() })
      const maps = page.locator(".zz-knowledge-map")
      check((await maps.count()) === 1, `${width} exactly one map module`)
      const state = await page.locator(".zz-knowledge-map img").evaluate((image) => {
        const rect = image.getBoundingClientRect()
        return {
          complete: image.complete,
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
          rect: rect.toJSON(),
          viewport: innerWidth,
          overflow: document.documentElement.scrollWidth - innerWidth,
        }
      })
      check(
        state.complete && state.naturalWidth === 2100 && state.naturalHeight === 1299,
        `${width} real thumbnail loaded`,
        state,
      )
      check(
        state.rect.width <= state.viewport && state.overflow === 0,
        `${width} no image/page overflow`,
        state,
      )
      const header = await page.locator(".doc-header").boundingBox()
      const title = await page.locator(".article-title").boundingBox()
      check(
        !header || !title || header.y + header.height <= title.y,
        `${width} no title/header overlap`,
        { header, title },
      )
      const href = await page.locator(".zz-knowledge-map-link").getAttribute("href")
      const imageResponse = await page.request.get(new URL(href, `${base}/`).href)
      check(
        imageResponse.ok() && (imageResponse.headers()["content-type"] || "").includes("image/png"),
        `${width} high-resolution link HTTP`,
        { status: imageResponse.status(), contentType: imageResponse.headers()["content-type"] },
      )
      check(errors.length === 0, `${width} console/page error=0`, { errors })
      await maps.scrollIntoViewIfNeeded()
      await page.waitForTimeout(200)
      await page.screenshot({ path: path.join(output, `map-${width}.png`) })
      await page.screenshot({ path: path.join(output, `home-${width}.png`), fullPage: true })
      const popupPromise = context.waitForEvent("page", { timeout: 2_000 }).catch(() => null)
      await page.locator(".zz-knowledge-map-link").click()
      const popup = await popupPromise
      const highResolutionPage = popup || page
      await highResolutionPage
        .waitForURL(
          (url) =>
            decodeURIComponent(url.pathname).endsWith("/static/maps/zhanzhan-ai-growth-map.png"),
          { timeout: 5_000 },
        )
        .catch(() => {})
      check(
        decodeURIComponent(highResolutionPage.url()).endsWith(
          "/static/maps/zhanzhan-ai-growth-map.png",
        ),
        `${width} click opens high-resolution image`,
        { url: highResolutionPage.url() },
      )
      if (popup) await popup.close()
      await context.close()
    }
  } finally {
    await browser.close()
  }
  fs.writeFileSync(
    path.join(output, "results.json"),
    JSON.stringify({ base, evidence, failures }, null, 2),
  )
  if (failures.length)
    throw new Error(`${failures.length} failures; see ${path.join(output, "results.json")}`)
  console.log(`PASS home XMind map at ${base}`)
})().catch((error) => {
  console.error(error)
  process.exit(1)
})
