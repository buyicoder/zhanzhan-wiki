import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"

const inventory = JSON.parse(await readFile("docs/migration-inventory-v3.json", "utf8"))
const expectedBodyHashes = {
  "ai-basics/高考完之后-焚决": "015906753a6b645e0a9270f842c540795e339e4d190a9fad17a09649c3c8cd3e",
  "learning/AI时代的七条基础能力":
    "4fde88e5b1fb47de1f62899b3f359a4e7e36293903b2291fbc0cfeb5ec9cc9c2",
  "learning/AI时代最不重要的能力恰恰是大家最焦虑的":
    "e600d30e6eb0f032bac0160d1e7888c2ae22eaba5a388d16f38890ec3cbcd7e0",
  "business/AI赋能的方向是工作不是娱乐":
    "bab6f1780b6f17bbf054fa80db0e473d032bed156d2b2beda6f7786d05e28758",
  "business/个人知识库不是给自己看的":
    "070059a900e5cabf79035f8fd7c932fb3fdeda423617992980d61804dbee6d2d",
  "cases/AI写小说的真相": "3ca0af8078827f3be80913b2105a65796e98fc8cbe34c1cb680d403e21b92876",
  "cases/前端需求要给视觉参照": "0d63387a0022fdcb0fc0f021a4e90291fe74c59566f903876ea8aad431932d75",
  "cases/协议解析代码必须默认高风险":
    "ccfa4f942e1e9da92d56365cf0fd56541ffbeab7d0cf574cfb5a78376f9ec684",
  "cases/为什么我给自己造了一个Jarvis":
    "e6edad751df23bb9a1b52628788cc9fdb2661be213b81c2eb16daed49b691e55",
  "cases/我的AI记忆系统这样存东西":
    "760639104eabb01a4f7b81537cf59d982a329c82996be9299b86b5391030e999",
  "cases/我给AI小白课埋了六个坑":
    "c4cce327d146dd6f75119a8bff6e118302e7115c27890f881d95aa8b80f1c3fe",
  "thinking/数学正在从答案稀缺进入理解稀缺":
    "aa5b2451f84237e39cf285962f4d4b3961d7a2f9f690ba2b42867d0e6673d853",
}

const failures = []
const seenOld = new Set()
const seenTarget = new Set()
for (const item of inventory.items) {
  if (seenOld.has(item.old_path)) failures.push(`duplicate old_path: ${item.old_path}`)
  if (seenTarget.has(item.target_path)) failures.push(`duplicate target_path: ${item.target_path}`)
  seenOld.add(item.old_path)
  seenTarget.add(item.target_path)

  const source = await readFile(`content/${item.target_path}.md`, "utf8")
  const body = source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "")
  const hash = createHash("sha256").update(body).digest("hex")
  if (hash !== expectedBodyHashes[item.target_path])
    failures.push(`body changed: ${item.target_path}`)
  if (!source.includes(`aliases: [/${item.old_path}]`))
    failures.push(`alias missing: ${item.target_path}`)
  if (!source.includes(`reader_path: ${item.primary}`))
    failures.push(`primary path mismatch: ${item.target_path}`)
}

if (inventory.items.length !== 12)
  failures.push(`expected 12 articles, found ${inventory.items.length}`)
if (failures.length) {
  console.error(failures.join("\n"))
  process.exit(1)
}
console.log(
  `PASS: ${inventory.items.length} unique articles; body hashes, aliases, and primary paths match`,
)
