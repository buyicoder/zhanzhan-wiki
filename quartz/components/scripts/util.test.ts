import { test } from "node:test"
import assert from "node:assert/strict"
import { fetchCanonical } from "./util"

test("canonical does not redirect ordinary pages but legacy refresh pages do", async () => {
  const original = globalThis.fetch
  const calls: string[] = []
  let refresh = false
  globalThis.fetch = (async (input: string | URL | Request) => {
    calls.push(String(input))
    return new Response(`${refresh ? '<meta http-equiv="refresh" content="0; url=/new">' : ''}<link rel="canonical" href="https://wiki.zhanzhanai.com/new">`, {headers:{"content-type":"text/html"}})
  }) as typeof fetch
  try {
    await fetchCanonical(new URL("http://localhost:4327/old"))
    assert.equal(calls.length, 1)
    refresh = true
    await fetchCanonical(new URL("http://localhost:4327/old"))
    assert.equal(calls.length, 3)
    assert.equal(calls[2], "https://wiki.zhanzhanai.com/new")
  } finally { globalThis.fetch = original }
})
