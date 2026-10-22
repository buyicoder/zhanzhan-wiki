import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const root = path.resolve(process.argv[2] || "public-self-host")
const output = path.resolve(process.argv[3] || `${root}.release-manifest.json`)
if (!fs.statSync(root).isDirectory()) throw new Error(`artifact directory missing: ${root}`)
const files = []
const walk = (directory) => {
  for (const entry of fs
    .readdirSync(directory, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))) {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) walk(absolute)
    else if (entry.isFile()) {
      const relative = path.relative(root, absolute).split(path.sep).join("/")
      files.push({
        path: relative,
        bytes: entry.size,
        sha256: createHash("sha256").update(fs.readFileSync(absolute)).digest("hex"),
      })
    }
  }
}
walk(root)
const treeSha256 = createHash("sha256")
  .update(files.map((file) => `${file.sha256}  ${file.path}\n`).join(""))
  .digest("hex")
const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: repo,
  encoding: "utf8",
}).trim()
const manifest = {
  schema: "zhanzhan-wiki-self-host-release/v1",
  source_commit: sourceCommit,
  artifact_root: root,
  file_count: files.length,
  tree_sha256: treeSha256,
  files,
}
fs.writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`)
console.log(
  `PASS frozen artifact: source=${sourceCommit} files=${files.length} tree_sha256=${treeSha256}`,
)
console.log(`manifest: ${output}`)
