import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { authorViewLinks, defaultAuthorView } from "./author-view-map.mjs"

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const authorView = defaultAuthorView
const run = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim()
const local = run(["rev-parse", "HEAD"])
let origin = "unavailable"
let originSource = "remote"
try {
  origin =
    execFileSync("git", ["ls-remote", "--heads", "origin", "refs/heads/main"], {
      cwd: repo,
      encoding: "utf8",
    })
      .trim()
      .split(/\s+/)[0] || "unavailable"
} catch {
  originSource = "cached"
  try {
    origin = run(["rev-parse", "origin/main"])
  } catch {}
}
const dirty = run(["status", "--porcelain=v1"]).split("\n").filter(Boolean)
const remote = run(["remote", "get-url", "origin"])
const releaseState = JSON.parse(fs.readFileSync(path.join(repo, "docs/release-state.json"), "utf8"))
const deployed = releaseState.deployed_release
const short = (value) => (value === "unavailable" ? value : value.slice(0, 12))
const mappingProblems = authorViewLinks.flatMap(([name, relativeTarget]) => {
  const destination = path.join(authorView, name)
  const expected = path.join(repo, relativeTarget)
  try {
    if (!fs.lstatSync(destination).isSymbolicLink()) return [`${name}: not a symlink`]
    if (fs.realpathSync(destination) !== fs.realpathSync(expected)) return [`${name}: wrong target`]
    return []
  } catch {
    return [`${name}: missing or broken`]
  }
})

console.log(`中文作者入口: ${authorView} (${mappingProblems.length ? "invalid" : "valid"})`)
console.log(`canonical source: ${path.join(repo, "content")}`)
console.log(`origin: ${remote}`)
console.log(`local HEAD: ${local}`)
console.log(`origin/main: ${origin} (${originSource})`)
console.log(`deployed release: ${deployed} (${releaseState.production_url})`)
console.log(`dirty files: ${dirty.length}`)
for (const entry of dirty) console.log(`  ${entry}`)
console.log(
  `author mappings: ${authorViewLinks.length - mappingProblems.length}/${authorViewLinks.length}`,
)
for (const problem of mappingProblems) console.log(`  ${problem}`)
console.log(
  `alignment: local/origin=${local === origin ? "aligned" : "drift"}; local/deployed=${short(local) === deployed ? "aligned" : "drift"}; origin/deployed=${short(origin) === deployed ? "aligned" : "drift"}`,
)
console.log("READ-ONLY: no files were staged, committed, pushed, built, or deployed.")
