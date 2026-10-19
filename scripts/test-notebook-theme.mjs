import assert from "node:assert/strict"
import { readFileSync, existsSync } from "node:fs"
import path from "node:path"
import test from "node:test"
import { fromHtml } from "hast-util-from-html"

function find(node, predicate) {
  return [
    ...(predicate(node) ? [node] : []),
    ...(node.children ?? []).flatMap((child) => find(child, predicate)),
  ]
}
const hasClass = (node, name) => node.properties?.className?.includes(name)
const build = process.env.WIKI_BUILD_DIR

for (const language of ["", "en/"]) {
  test(`${language || "zh/"} homepage keeps complete, keyboard-accessible story links`, () => {
    const source = readFileSync(new URL(`../content/${language}index.md`, import.meta.url), "utf8")
    const html = build ? readFileSync(path.join(build, language, "index.html"), "utf8") : source
    const tree = fromHtml(html)
    const stories = find(tree, (node) => node.tagName === "a" && hasClass(node, "studio-story"))
    assert.equal(stories.length, 5)
    for (const story of stories) {
      assert.equal(find(story, (node) => hasClass(node, "studio-title")).length, 1)
      assert.equal(find(story, (node) => node.tagName === "p").length, 1)
      assert.equal(find(story, (node) => node.tagName === "a").length, 1, "No nested anchors")
      assert.ok(story.properties.href)
    }
    assert.equal(find(tree, (node) => hasClass(node, "notebook-project")).length, 2)
    assert.equal(find(tree, (node) => hasClass(node, "notebook-bookmark")).length, 1)
    assert.equal(
      find(tree, (node) => node.tagName === "button" && hasClass(node, "studio-random")).length,
      1,
    )
  })

  test(
    `${language || "zh/"} homepage links and image resolve in the build`,
    { skip: !build },
    () => {
      const tree = fromHtml(readFileSync(path.join(build, language, "index.html"), "utf8"))
      const articles = find(tree, (node) => node.tagName === "article")
      for (const article of articles) {
        const links = find(article, (node) => node.tagName === "a" && node.properties.href)
        for (const link of links) {
          const href = link.properties.href
          if (/^(https?:|#)/.test(href)) continue
          const url = new URL(href, `http://localhost/${language}`)
          const target = decodeURIComponent(url.pathname).replace(/^\//, "")
          assert.ok(
            [target, target + ".html", path.join(target, "index.html")].some((candidate) =>
              existsSync(path.join(build, candidate)),
            ),
            `Missing destination: ${href}`,
          )
          if (language) assert.ok(target.startsWith("en/"), `English link escaped: ${href}`)
        }
        for (const image of find(article, (node) => node.tagName === "img")) {
          const url = new URL(image.properties.src, `http://localhost/${language}`)
          assert.ok(existsSync(path.join(build, decodeURIComponent(url.pathname))))
        }
      }
    },
  )
}
