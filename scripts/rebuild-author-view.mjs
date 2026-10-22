import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { authorViewLinks, defaultAuthorView } from "./author-view-map.mjs"

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const content = path.join(repo, "content")
const view = path.resolve(process.argv[2] || defaultAuthorView)
const lexists = (target) => {
  try {
    fs.lstatSync(target)
    return true
  } catch (error) {
    if (error.code === "ENOENT") return false
    throw error
  }
}

if (!fs.existsSync(content)) throw new Error(`canonical content directory missing: ${content}`)
fs.mkdirSync(view, { recursive: true })

for (const [name, relativeTarget] of authorViewLinks) {
  const target = path.join(repo, relativeTarget)
  const destination = path.join(view, name)
  if (!fs.existsSync(target)) throw new Error(`link target missing: ${target}`)
  if (lexists(destination)) {
    const stat = fs.lstatSync(destination)
    if (!stat.isSymbolicLink())
      throw new Error(`refusing to replace real file or directory: ${destination}`)
    const actual = path.resolve(path.dirname(destination), fs.readlinkSync(destination))
    if (actual !== target)
      throw new Error(`refusing to retarget existing link: ${destination} -> ${actual}`)
  }
}

for (const [name, relativeTarget] of authorViewLinks) {
  const target = path.join(repo, relativeTarget)
  const destination = path.join(view, name)
  if (!lexists(destination))
    fs.symlinkSync(target, destination, fs.statSync(target).isDirectory() ? "dir" : "file")
  if (fs.realpathSync(destination) !== fs.realpathSync(target))
    throw new Error(`broken mapping: ${destination}`)
  console.log(`OK ${name} -> ${target}`)
}

console.log(`PASS author view: ${view} (${authorViewLinks.length} mappings, no content copied)`)
