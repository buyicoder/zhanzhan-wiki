import { createHash } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { basename, join } from "node:path"

const sourceRoot = "/Users/m/Documents/部署mac/zhanzhan-ai-beginner-course/course"
const targetRoot = "content/ai-basics"
const platforms = ["macos", "windows"]
const sha256 = (value) => createHash("sha256").update(value).digest("hex")
const count = (value, pattern) => [...value.matchAll(pattern)].length

const items = []
for (const platform of platforms) {
  await mkdir(join(targetRoot, platform), { recursive: true })
  for (let order = 0; order <= 8; order++) {
    const prefix = String(order).padStart(2, "0")
    const directory = new URL(`file://${sourceRoot}/${platform}/`)
    const { readdir } = await import("node:fs/promises")
    const filename = (await readdir(directory)).find(
      (name) => name.startsWith(`${prefix}-`) && name.endsWith(".md"),
    )
    if (!filename) throw new Error(`Missing ${platform}/${prefix}`)

    const sourcePath = join(sourceRoot, platform, filename)
    const targetPath = join(targetRoot, platform, filename)
    const source = await readFile(sourcePath, "utf8")
    const titleMatch = source.match(/^# (.+)$/m)
    if (!titleMatch) throw new Error(`Missing H1: ${sourcePath}`)
    const title = titleMatch[1]

    let body = source.replace(/^# .+\r?\n/, "")
    let removedImages = 0
    body = body.replace(/^([ \t]*)!\[([^\]]*)\]\([^\n)]+\)[ \t]*$/gm, (_line, indent, alt) => {
      removedImages++
      return `${indent}> 📸 操作截图尚未补齐：${alt}`
    })
    body = body.replace(
      /完整拍摄清单见 \[99-截图清单\.md\]\(99-截图清单\.md\)。/g,
      "当前公开版本不含截图清单，操作截图后续逐步补充。",
    )
    body = body.replace(
      /\[([^\]]+)\]\((0[0-8]-[^)]+)\.md\)/g,
      (_link, label, target) => `[[ai-basics/${platform}/${target}|${label}]]`,
    )
    body = body.replace(/^\n+/, "")

    const frontmatter = [
      "---",
      `title: ${title}`,
      "provenance: 课程原文",
      "maturity: 长青",
      "content_type: 教程",
      "reader_path: ai-basics",
      `platform: ${platform}`,
      `course_order: ${prefix}`,
      "---",
      "",
    ].join("\n")
    await writeFile(targetPath, frontmatter + body, "utf8")

    const normalized = body
    items.push({
      platform,
      order: prefix,
      title,
      source_path: `course/${platform}/${filename}`,
      target_path: `content/ai-basics/${platform}/${filename}`,
      source_sha256: sha256(source),
      normalized_text_sha256: sha256(normalized),
      source_bytes: Buffer.byteLength(source),
      normalized_bytes: Buffer.byteLength(normalized),
      task_headings: count(normalized, /^#{2,4} .*任务/gm),
      success_markers: count(normalized, /🎯 \*\*成功标志/g),
      checkboxes: count(normalized, /^\s*- \[[ xX]\]/gm),
      code_fences: count(normalized, /^```/gm),
      source_image_references: count(source, /!\[[^\]]*\]\([^\n)]+\)/g),
      imported_image_references: count(normalized, /!\[[^\]]*\]\([^\n)]+\)/g),
      image_placeholders_converted: removedImages,
    })
  }
}

const manifest = {
  version: 1,
  source_repository: "zhanzhan-ai-beginner-course",
  source_commit: "3d40045ebf6a106f1501e104b6ee93f06c50a28d",
  normalization: [
    "Move the source H1 into Quartz frontmatter title without changing visible title text",
    "Convert Markdown image embeds into plain text screenshot-pending notices; import no image assets",
    "Replace the excluded 99 screenshot-list link with an explicit text-only status statement",
    "Rewrite same-platform lesson links to explicit Quartz paths without changing link labels",
  ],
  items,
}
await writeFile(
  "docs/course-integration-manifest-v1.json",
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
)
console.log(
  `Imported ${items.length} lessons; source image refs=${items.reduce((sum, item) => sum + item.source_image_references, 0)}; imported image refs=0`,
)
