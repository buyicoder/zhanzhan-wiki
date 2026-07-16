import fs from "node:fs"
import path from "node:path"

const root = path.resolve(process.argv[2] ?? "public-self-host")
const expectedDomain = "wiki.zhanzhanai.com"
const forbidden = ["buyicoder.github.io", "/zhanzhan-wiki/"]
const requiredFiles = ["index.html", "404.html", "sitemap.xml", "index.xml", "CNAME"]

const failures = []
const files = []

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) walk(absolute)
    else files.push(absolute)
  }
}

if (!fs.existsSync(root)) {
  throw new Error(`Artifact directory does not exist: ${root}`)
}

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`missing root file: ${file}`)
}

walk(root)
for (const file of files) {
  if (!/\.(?:html|xml|js|css|json|txt)$/i.test(file)) continue
  const body = fs.readFileSync(file, "utf8")
  for (const value of forbidden) {
    if (body.includes(value)) failures.push(`${path.relative(root, file)} contains ${value}`)
  }
}

const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8")
const rss = fs.readFileSync(path.join(root, "index.xml"), "utf8")
const cname = fs.readFileSync(path.join(root, "CNAME"), "utf8").trim()

if (!sitemap.includes(`https://${expectedDomain}/`)) failures.push("sitemap domain mismatch")
if (!rss.includes(`https://${expectedDomain}`)) failures.push("RSS domain mismatch")
if (cname !== expectedDomain) failures.push(`CNAME mismatch: ${cname}`)

for (const file of files.filter((candidate) => candidate.endsWith(".html"))) {
  if (path.basename(file) === "404.html") continue
  const body = fs.readFileSync(file, "utf8")
  const match = body.match(/<link rel="canonical" href="([^"]+)"/)
  if (!match) failures.push(`${path.relative(root, file)} is missing canonical`)
  else if (!match[1].startsWith(`https://${expectedDomain}/`)) {
    failures.push(`${path.relative(root, file)} canonical domain mismatch: ${match[1]}`)
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"))
  process.exit(1)
}

console.log(`PASS self-host artifact: files=${files.length}, forbidden URL residues=0`)
