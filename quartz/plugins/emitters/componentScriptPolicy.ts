const smoothScrollIntoView =
  /([A-Za-z_$][\w$]*)\.scrollIntoView\(\{\s*behavior\s*:\s*["']smooth["']\s*\}\);?/g

export function stabilizeComponentScript(script: string): string {
  let stabilized = script

  if (script.includes("[Explorer]")) {
    const scrollMatches = [...script.matchAll(smoothScrollIntoView)]
    if (scrollMatches.length !== 1) {
      throw new Error(
        `Explorer compatibility policy expected one smooth scroll, found ${scrollMatches.length}`,
      )
    }
    stabilized = stabilized.replaceAll("console.log(", "void (").replace(
      smoothScrollIntoView,
      (_, activeElement: string) => `(() => {
      const explorerViewport = ${activeElement}.closest(".explorer-content");
      if (explorerViewport) {
        explorerViewport.scrollTop = Math.max(
          0,
          ${activeElement}.offsetTop - explorerViewport.clientHeight / 2 + ${activeElement}.clientHeight / 2,
        );
      }
    })()`,
    )
  }

  return stabilized
}

export const earlyInteractionBridge = `
  document.documentElement.dataset.componentsReady = "false";
  const queuedComponentClicks = [];
  const componentSelector = ".search-button, .mobile-explorer, .darkmode, .readermode";
  const queueComponentClick = (event) => {
    if (document.documentElement.dataset.componentsReady === "true") return;
    const target = event.target instanceof Element ? event.target.closest(componentSelector) : null;
    if (!target) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (target.matches(".search-button")) {
      const container = document.querySelector(".search-container");
      container?.classList.add("active");
      target.setAttribute("aria-expanded", "true");
      container?.querySelector("input")?.focus();
      return;
    }
    queuedComponentClicks.push(target);
  };
  document.addEventListener("click", queueComponentClick, true);
  document.addEventListener("quartz:components-ready", () => {
    document.removeEventListener("click", queueComponentClick, true);
    requestAnimationFrame(() => {
      for (const target of queuedComponentClicks) {
        if (target.isConnected) target.click();
      }
      queuedComponentClicks.length = 0;
    });
  }, { once: true });
`
