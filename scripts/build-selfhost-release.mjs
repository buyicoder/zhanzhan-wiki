import { execFileSync, spawnSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const output = path.resolve(process.argv[2] || "/tmp/zhanzhan-wiki-self-host")
const manifest = path.resolve(process.argv[3] || `${output}.release-manifest.json`)
if (fs.existsSync(output) || fs.existsSync(manifest))
  throw new Error(`refusing to overwrite existing artifact or manifest: ${output}`)
const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: repo,
  encoding: "utf8",
}).trim()
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "zhanzhan-wiki-release-"))
const worktree = path.join(temporaryRoot, "source")
const run = (command, args, cwd) => {
  const result = spawnSync(command, args, { cwd, stdio: "inherit", env: process.env })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${command} failed with status ${result.status}`)
}

try {
  run("git", ["worktree", "add", "--detach", worktree, sourceCommit], repo)
  run("npm", ["ci"], worktree)
  run("npm", ["run", "install-plugins"], worktree)
  run("npm", ["run", "build:self-host", "--", "--output", output], worktree)
  run("node", ["scripts/verify-selfhost-artifact.mjs", output], worktree)
  run("node", ["scripts/freeze-selfhost-artifact.mjs", output, manifest], worktree)
  console.log(`PASS isolated release build: source=${sourceCommit}`)
} finally {
  try {
    execFileSync("git", ["worktree", "remove", "--force", worktree], { cwd: repo, stdio: "ignore" })
  } catch {}
  fs.rmSync(temporaryRoot, { recursive: true, force: true })
}
