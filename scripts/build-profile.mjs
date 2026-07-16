import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const profiles = {
  "github-pages": "quartz.config.github-pages.yaml",
  "self-host": "quartz.config.self-host.yaml",
}

const [profile, ...args] = process.argv.slice(2)
const configPath = profiles[profile]

if (!configPath) {
  console.error(`Unknown build profile: ${profile ?? "(missing)"}`)
  console.error(`Expected one of: ${Object.keys(profiles).join(", ")}`)
  process.exit(2)
}

const executable = process.platform === "win32" ? "npx.cmd" : "npx"
const result = spawnSync(executable, ["quartz", "build", ...args], {
  env: { ...process.env, QUARTZ_CONFIG_PATH: configPath },
  stdio: "inherit",
})

if (result.error) throw result.error
if (result.status !== 0) process.exit(result.status ?? 1)

if (profile === "self-host") {
  const outputFlag = args.findIndex((argument) => argument === "--output" || argument === "-o")
  const outputDirectory = path.resolve(outputFlag >= 0 ? args[outputFlag + 1] : "public")
  const files = []
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name)
      if (entry.isDirectory()) walk(absolute)
      else if (entry.name.endsWith(".html")) files.push(absolute)
    }
  }
  walk(outputDirectory)

  for (const file of files) {
    const html = fs.readFileSync(file, "utf8")
    const relativePath = path.relative(outputDirectory, file).split(path.sep).join("/")
    const pageUrl = new URL(relativePath, "https://wiki.zhanzhanai.com/")
    const normalized = html.replace(
      /<link rel="canonical" href="([^"]+)">/,
      (_match, href) => `<link rel="canonical" href="${new URL(href, pageUrl).href}">`,
    )
    if (normalized !== html) fs.writeFileSync(file, normalized)
  }
}
