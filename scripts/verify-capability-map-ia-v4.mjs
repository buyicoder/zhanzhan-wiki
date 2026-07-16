import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { execFileSync } from "node:child_process"

const output = process.env.OUTPUT_DIR || "/tmp/zhanzhan-wiki-personal-capability-map-ia-v4-20260716"
fs.mkdirSync(output, { recursive: true })
const contentRoot = path.resolve("content")
const files = []
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => entry.isDirectory() ? walk(path.join(dir, entry.name)) : entry.name.endsWith(".md") && files.push(path.join(dir, entry.name)))
walk(contentRoot)

const nodeFor = (relative) => {
  const root = relative.split("/")[0]
  if (["map", "input", "capability", "leverage", "ai-work", "portfolio", "expression", "life", "tutorials"].includes(root)) return root
  if (root === "ai-basics") return "tutorials"
  if (["works", "projects", "cases", "logs", "garden"].includes(root)) return "portfolio"
  if (relative === "now.md") return "life"
  return "map"
}
const stripFrontmatter = (text) => text.replace(/^---\n[\s\S]*?\n---\n?/, "").trimEnd()
const hash = (text) => crypto.createHash("sha256").update(text).digest("hex")
const titleOf = (text, relative) => text.match(/^title:\s*(.+)$/m)?.[1]?.trim() || path.basename(relative, ".md")
const inventory = files.sort().map((file) => {
  const relative = path.relative(contentRoot, file)
  const text = fs.readFileSync(file, "utf8")
  return { path: relative, title: titleOf(text, relative), primaryHome: nodeFor(relative), canonicalRoute: "/" + relative.replace(/\/index\.md$/, "").replace(/\.md$/, ""), bodyHash: hash(stripFrontmatter(text)) }
})

const moved = [
  ["toolbox/我的完整工具图谱.md", "leverage/我的完整工具图谱.md"],
  ["learning/AI时代最不重要的能力恰恰是大家最焦虑的.md", "capability/AI时代最不重要的能力恰恰是大家最焦虑的.md"],
  ["learning/AI时代的七条基础能力.md", "capability/AI时代的七条基础能力.md"],
  ["thinking/数学正在从答案稀缺进入理解稀缺.md", "capability/数学正在从答案稀缺进入理解稀缺.md"],
  ["ai-basics/高考完之后-焚决.md", "capability/高考完之后-焚决.md"],
  ["business/AI赋能的方向是工作不是娱乐.md", "ai-work/AI赋能的方向是工作不是娱乐.md"],
  ["business/个人知识库不是给自己看的.md", "ai-work/个人知识库不是给自己看的.md"],
  ["business/企业AI转型方法论.md", "ai-work/企业AI转型方法论.md"],
  ["cases/前端需求要给视觉参照.md", "ai-work/前端需求要给视觉参照.md"],
  ["cases/协议解析代码必须默认高风险.md", "ai-work/协议解析代码必须默认高风险.md"],
  ["cases/AI写小说的真相.md", "portfolio/AI写小说的真相.md"],
  ["cases/为什么我给自己造了一个Jarvis.md", "portfolio/为什么我给自己造了一个Jarvis.md"],
  ["cases/我的AI记忆系统这样存东西.md", "portfolio/我的AI记忆系统这样存东西.md"],
  ["cases/我给AI小白课埋了六个坑.md", "portfolio/我给AI小白课埋了六个坑.md"],
]
const integrity = moved.map(([oldPath, newPath]) => {
  const before = execFileSync("git", ["show", `HEAD:content/${oldPath}`], { encoding: "utf8" })
  const after = fs.readFileSync(path.join(contentRoot, newPath), "utf8")
  return { oldPath, newPath, before: hash(stripFrontmatter(before)), after: hash(stripFrontmatter(after)), bodyUnchanged: stripFrontmatter(before) === stripFrontmatter(after) }
})
const failures = []
if (inventory.length !== files.length) failures.push("inventory omission")
if (inventory.some((item) => !item.primaryHome)) failures.push("missing primary home")
if (new Set(inventory.map((item) => item.path)).size !== inventory.length) failures.push("duplicate content path")
if (integrity.some((item) => !item.bodyUnchanged)) failures.push("moved article body changed")
for (const hub of ["map", "input", "capability", "leverage", "ai-work", "portfolio", "expression", "life", "tutorials"]) if (!fs.existsSync(path.join(contentRoot, hub, "index.md"))) failures.push(`missing hub ${hub}`)
fs.writeFileSync(path.join(output, "content-inventory.json"), JSON.stringify({ count: inventory.length, inventory }, null, 2))
fs.writeFileSync(path.join(output, "body-integrity.json"), JSON.stringify({ integrity, failures }, null, 2))
if (failures.length) { console.error(failures.join("\n")); process.exit(1) }
console.log(`PASS IA V4 inventory=${inventory.length}, moved body integrity=${integrity.length}`)
