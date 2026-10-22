import { createHash } from "node:crypto"
import { readdirSync } from "node:fs"
import { readFile, readdir } from "node:fs/promises"
import { join } from "node:path"
import { execFileSync } from "node:child_process"

const sourceRoot = "/Users/m/Documents/部署mac/zhanzhan-ai-beginner-course"
const manifest = JSON.parse(await readFile("docs/course-integration-manifest-v1.json", "utf8"))
const sha256 = (value) => createHash("sha256").update(value).digest("hex")
const count = (value, pattern) => [...value.matchAll(pattern)].length
const failures = []
const actualSourceCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim()
if (actualSourceCommit !== manifest.source_commit)
  failures.push(`source HEAD mismatch: ${actualSourceCommit}`)
const sourcePaths = new Set()
const targetPaths = new Set()

for (const item of manifest.items) {
  if (sourcePaths.has(item.source_path)) failures.push(`duplicate source: ${item.source_path}`)
  if (targetPaths.has(item.target_path)) failures.push(`duplicate target: ${item.target_path}`)
  sourcePaths.add(item.source_path)
  targetPaths.add(item.target_path)
  const source = await readFile(join(sourceRoot, item.source_path), "utf8")
  const target = await readFile(item.target_path, "utf8")
  let normalized = source.replace(/^# .+\r?\n/, "")
  normalized = normalized.replace(
    /^([ \t]*)!\[([^\]]*)\]\([^\n)]+\)[ \t]*$/gm,
    (_line, indent, alt) => `${indent}> 📸 操作截图尚未补齐：${alt}`,
  )
  normalized = normalized.replace(
    /完整拍摄清单见 \[99-截图清单\.md\]\(99-截图清单\.md\)。/g,
    "当前公开版本不含截图清单，操作截图后续逐步补充。",
  )
  normalized = normalized.replace(
    /\[([^\]]+)\]\((0[0-8]-[^)]+)\.md\)/g,
    (_link, label, target) => `[[ai-basics/${item.platform}/${target}|${label}]]`,
  )
  normalized = normalized.replace(/^\n+/, "")
  const targetBody = target.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n+/, "")

  if (sha256(source) !== item.source_sha256) failures.push(`source hash drift: ${item.source_path}`)
  if (sha256(normalized) !== item.normalized_text_sha256)
    failures.push(`manifest hash drift: ${item.source_path}`)
  if (targetBody !== normalized) failures.push(`normalized content mismatch: ${item.target_path}`)
  if (!target.includes(`title: ${item.title}`)) failures.push(`title mismatch: ${item.target_path}`)
  for (const [field, pattern] of [
    ["task_headings", /^#{2,4} .*任务/gm],
    ["success_markers", /🎯 \*\*成功标志/g],
    ["checkboxes", /^\s*- \[[ xX]\]/gm],
    ["code_fences", /^```/gm],
  ]) {
    if (count(targetBody, pattern) !== item[field])
      failures.push(`${field} mismatch: ${item.target_path}`)
  }
  if (
    /!\[[^\]]*\]\([^\n)]+\)|!\[\[[^\]]+\.(png|jpe?g|gif|webp|svg)[^\]]*\]\]|<\s*(img|picture|source|svg)\b|data:image\//i.test(
      targetBody,
    )
  )
    failures.push(`image embed imported: ${item.target_path}`)
}

for (const page of [
  "content/ai-basics/index.md",
  "content/ai-basics/macos/index.md",
  "content/ai-basics/windows/index.md",
]) {
  const text = await readFile(page, "utf8")
  const notice = "当前为文字版，操作截图尚未补齐，后续逐步补充"
  if (!text.includes(notice)) failures.push(`screenshot notice missing: ${page}`)
}

for (const platform of ["macos", "windows"]) {
  const files = (await readdir(`content/ai-basics/${platform}`)).filter((name) =>
    /^0[0-8]-.*\.md$/.test(name),
  )
  if (files.length !== 9) failures.push(`${platform}: expected 9 lessons, found ${files.length}`)
  const expectedSources = (await readdir(join(sourceRoot, "course", platform)))
    .filter((name) => /^0[0-8]-.*\.md$/.test(name))
    .map((name) => `course/${platform}/${name}`)
  const manifestSources = manifest.items
    .filter((item) => item.platform === platform)
    .map((item) => item.source_path)
  if (expectedSources.sort().join("\n") !== manifestSources.sort().join("\n"))
    failures.push(`${platform}: source/manifest set mismatch`)
  const expectedTargets = files.map((name) => `content/ai-basics/${platform}/${name}`)
  const manifestTargets = manifest.items
    .filter((item) => item.platform === platform)
    .map((item) => item.target_path)
  if (expectedTargets.sort().join("\n") !== manifestTargets.sort().join("\n"))
    failures.push(`${platform}: target/manifest set mismatch`)
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)],
  )
}
for (const file of walk("content/ai-basics")) {
  if (/\.(png|jpe?g|gif|webp|svg)$/i.test(file)) failures.push(`image asset imported: ${file}`)
}

if (manifest.items.length !== 18)
  failures.push(`expected 18 manifest items, found ${manifest.items.length}`)
if (failures.length) {
  console.error(failures.join("\n"))
  process.exit(1)
}
console.log(
  "PASS: 18/18 lessons match normalized source; structure preserved; screenshot notices 3/3; imported images 0",
)
