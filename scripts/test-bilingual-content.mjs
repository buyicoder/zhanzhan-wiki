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
  assert.match(header, /localizeEnglishLinks/)
  assert.match(header, /data-english-routes/)
  assert.match(header, /doc-language-switch, \[hreflang='zh-CN'\]/)
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

test("hand-authored links on English landing pages target English routes", () => {
  for (const path of ["index.md", "portfolio/index.md"]) {
    const content = readFileSync(new URL(`../content/en/${path}`, import.meta.url), "utf8")
    const hrefs = [...content.matchAll(/href="([^"]+)"/g)].map((match) => match[1])
    assert.ok(hrefs.length > 0, `${path} should contain navigation links`)
    for (const href of hrefs) {
      assert.ok(
        href.startsWith("en/") || href.startsWith("https://") || href.startsWith("#"),
        `${path} contains a non-English internal target: ${href}`,
      )
    }
  }
})

test("English privacy controls stay on the English privacy page", () => {
  const content = readFileSync(new URL("../content/en/privacy.md", import.meta.url), "utf8")
  assert.doesNotMatch(content, /wiki\.zhanzhanai\.com\/privacy\?analytics=/)
  assert.match(content, /wiki\.zhanzhanai\.com\/en\/privacy\?analytics=off/)
  assert.match(content, /wiki\.zhanzhanai\.com\/en\/privacy\?analytics=on/)
})
