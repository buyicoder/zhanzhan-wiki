import fs from "node:fs"
import path from "node:path"

const root = path.resolve("content/ai-basics")
const output = process.env.OUTPUT_DIR || "/tmp/zhanzhan-wiki-course-preview-conversion-20260716"
fs.mkdirSync(output, { recursive: true })
const inventory = []
const failures = []

for (const platform of ["macos", "windows"]) {
  for (let order = 0; order <= 8; order++) {
    const prefix = String(order).padStart(2, "0") + "-"
    const name = fs.readdirSync(path.join(root, platform)).find((entry) => entry.startsWith(prefix))
    if (!name) {
      failures.push(`${platform}/${prefix}: route missing`)
      continue
    }
    const file = path.join(root, platform, name)
    const text = fs.readFileSync(file, "utf8")
    const kind = order === 0 ? "overview-roadmap" : order === 1 ? "full-preview" : "course-preview"
    const item = {
      platform,
      order: String(order).padStart(2, "0"),
      route: `/ai-basics/${platform}/${name.replace(/\.md$/, "")}`,
      file,
      kind,
      lines: text.split("\n").length,
      codeFences: (text.match(/^```/gm) || []).length,
      routePreserved: true,
    }
    inventory.push(item)
    if (order === 1 && item.lines < 200) failures.push(`${item.route}: full preview was shortened`)
    if (order >= 2) {
      for (const heading of ["这一关解决什么问题", "你将完成什么", "成功标准", "能力迁移", "完整版状态"]) {
        if (!text.includes(`## ${heading}`)) failures.push(`${item.route}: missing ${heading}`)
      }
      if (!text.includes("进阶完整版正在整理，暂不销售")) failures.push(`${item.route}: missing honest status`)
      if (item.codeFences !== 0) failures.push(`${item.route}: contains executable code fences`)
      if (/### 任务|故障卡全文|复制下面|运行以下命令/.test(text)) failures.push(`${item.route}: leaked step-by-step delivery`)
    }
  }
}

if (inventory.filter((item) => item.kind === "full-preview").length !== 2) failures.push("full preview count is not 2")
if (inventory.filter((item) => item.kind === "course-preview").length !== 14) failures.push("preview count is not 14")
fs.writeFileSync(path.join(output, "inventory.json"), JSON.stringify({ inventory, failures }, null, 2))
if (failures.length) {
  console.error(failures.join("\n"))
  process.exit(1)
}
console.log("PASS 18-route course preview inventory")
