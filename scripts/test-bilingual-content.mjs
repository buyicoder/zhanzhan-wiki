import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const header = readFileSync(new URL("../quartz/components/Header.tsx", import.meta.url), "utf8")
const head = readFileSync(new URL("../quartz/components/Head.tsx", import.meta.url), "utf8")
const renderPage = readFileSync(
  new URL("../quartz/components/renderPage.tsx", import.meta.url),
  "utf8",
)

test("header exposes paired Chinese and English navigation", () => {
  assert.match(header, /const EN_NAV_LINKS/)
  assert.match(header, /counterpartExists/)
  assert.match(header, /hreflang=/)
  assert.match(header, /Switch to English/)
  assert.match(header, /切换到中文/)
  assert.match(header, /data-router-ignore="true"/)
  assert.match(header, /localizeSearch/)
})

test("content index only exposes the active language to search and explorer", () => {
  assert.match(renderPage, /pageIsEnglish/)
  assert.match(renderPage, /slug\.startsWith\("en\/"\)/)
  assert.match(renderPage, /!slug\.startsWith\("en\/"\)/)
})

test("head publishes language and alternate-page metadata", () => {
  assert.match(head, /pageLanguage/)
  assert.match(head, /rel="alternate"/)
  assert.match(head, /hrefLang="x-default"/)
  assert.match(head, /inLanguage: pageLanguage/)
})

for (const path of [
  "index.md",
  "map/index.md",
  "ai-basics/index.md",
  "portfolio/index.md",
  "now.md",
]) {
  test(`English entry ${path} declares its language`, () => {
    const content = readFileSync(new URL(`../content/en/${path}`, import.meta.url), "utf8")
    assert.match(content, /^---\n[\s\S]*?\nlang: en\n(?:[\s\S]*?\n)?---\n/)
  })
}
