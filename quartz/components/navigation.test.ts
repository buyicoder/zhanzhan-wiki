import assert from "node:assert/strict"
import test from "node:test"
import { navigationContext, navigationSections } from "./navigation"

test("the masthead and section index resolve the same section in both languages", () => {
  for (const section of navigationSections) {
    for (const root of section.roots) {
      for (const prefix of ["", "en/"]) {
        const context = navigationContext(prefix + root + "/index")
        assert.equal(context.section.id, section.id)
        assert.equal(context.english, Boolean(prefix))
      }
    }
  }
})

test("section indexes do not mix courses, essays, and projects", () => {
  const knowledge = navigationContext("capability/an-article").section.chapters
  assert.ok(knowledge.includes("capability"))
  assert.ok(!knowledge.includes("ai-basics"))
  assert.ok(!knowledge.includes("portfolio"))
  assert.deepEqual(navigationContext("ai-basics/macos/lesson").section.chapters, ["ai-basics"])
  assert.deepEqual(navigationContext("en/portfolio/a-project").section.chapters, ["portfolio"])
  assert.deepEqual(navigationContext("now").section.chapters, [])
  assert.deepEqual(navigationContext("daily/2026-10-20").section.chapters, ["daily"])
  assert.ok(!knowledge.includes("daily"))
})

test("home and unknown pages have deterministic navigation", () => {
  assert.equal(navigationContext("en").section.id, "home")
  assert.equal(navigationContext("index").section.id, "home")
  assert.equal(navigationContext("tags/ai").section.id, "knowledge")
  assert.equal(
    new Set(navigationSections.flatMap((section) => section.roots)).size,
    navigationSections.flatMap((section) => section.roots).length,
  )
})

test("sidebar children are promoted instead of repeating the masthead section", () => {
  const course = navigationContext("ai-basics/macos/lesson").section
  const projects = navigationContext("en/portfolio/a-project").section
  assert.equal(course.flatten, true)
  assert.equal(projects.flatten, true)
  assert.equal(course.overview?.zh, "课程总览")
  assert.equal(projects.overview?.en, "Project overview")
  assert.equal(navigationContext("capability/index").section.flatten, false)
  assert.equal(navigationContext("map/index").section.overview?.zh, "总览")
})
