import assert from "node:assert"
import { describe, test } from "node:test"
import { earlyInteractionBridge, stabilizeComponentScript } from "./componentScriptPolicy"

describe("production component resources", () => {
  test("contains Explorer scrolling inside its own viewport and removes lifecycle logs", () => {
    const source = `
      console.log("[Explorer] Render complete");
      activeElement.scrollIntoView({ behavior: "smooth" });
      document.addEventListener("render", handleNavOrRender);
    `
    const result = stabilizeComponentScript(source)

    assert(!result.includes("console.log"))
    assert(!result.includes("scrollIntoView"))
    assert(result.includes('activeElement.closest(".explorer-content")'))
    assert(result.includes("explorerViewport.scrollTop"))
  })

  test("stabilizes the minified Explorer script emitted by external plugins", () => {
    const source =
      'void ("[Explorer] ready");o&&o.scrollIntoView({behavior:"smooth"});document.addEventListener("render", handleNavOrRender);'
    const result = stabilizeComponentScript(source)

    assert(!result.includes("scrollIntoView"))
    assert(result.includes('addEventListener("render"'))
    assert(result.includes('o.closest(".explorer-content")'))
  })

  test("leaves unrelated component scripts untouched", () => {
    const source = `console.log("unrelated")`
    assert.strictEqual(stabilizeComponentScript(source), source)
  })

  test("queues visible component clicks until the production bundle is ready", () => {
    assert(earlyInteractionBridge.includes("queuedComponentClicks"))
    assert(earlyInteractionBridge.includes("stopImmediatePropagation"))
    assert(earlyInteractionBridge.includes("target.closest(componentSelector)"))
    assert(earlyInteractionBridge.includes("queuedComponentClicks = []"))
    assert(earlyInteractionBridge.includes("removeEventListener"))
    assert(earlyInteractionBridge.includes('"quartz:components-ready"'))
  })

  test("fails closed when the Explorer compatibility contract drifts", () => {
    assert.throws(
      () => stabilizeComponentScript('console.log("[Explorer] changed")'),
      /expected one smooth scroll/,
    )
  })
})
