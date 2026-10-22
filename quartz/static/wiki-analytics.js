(() => {
  if (window.__wikiAnalytics || location.hostname !== "wiki.zhanzhanai.com") return
  window.__wikiAnalytics = true
  function enabled() {
    try {
      const choice = new URLSearchParams(location.search).get("analytics")
      if (choice === "off") localStorage.setItem("umami.disabled", "1")
      if (choice === "on") localStorage.removeItem("umami.disabled")
      return !localStorage.getItem("umami.disabled") && navigator.doNotTrack !== "1" && !navigator.globalPrivacyControl
    } catch { return false }
  }
  window.wikiAnalyticsFilter = (_type, payload) => {
    if (!enabled()) return false
    const url = new URL(payload.url || location.href, location.origin)
    const clean = new URLSearchParams()
    for (const key of ["utm_source", "utm_medium", "utm_campaign"]) {
      const value = url.searchParams.get(key)
      if (value && /^[a-zA-Z0-9_-]{1,80}$/.test(value)) clean.set(key, value)
    }
    payload.url = url.pathname + (clean.size ? "?" + clean : "")
    try { payload.referrer = payload.referrer ? new URL(payload.referrer).origin : "" } catch { payload.referrer = "" }
    return payload
  }
  if (!enabled()) return
  let lastPage = "", sent = new Set(), timer
  const track = (event) => {
    if (enabled() && window.umami) window.umami.track(event)
  }
  const page = () => {
    if (!enabled() || !window.umami || lastPage === location.pathname) return
    lastPage = location.pathname
    sent = new Set()
    window.umami.track()
  }
  const script = document.createElement("script")
  script.src = "/analytics/script.js"
  script.dataset.websiteId = "502a61b8-0d99-433a-8fd1-f641f0d0bb4a"
  script.dataset.hostUrl = location.origin + "/analytics"
  script.dataset.autoTrack = "false"
  script.dataset.beforeSend = "wikiAnalyticsFilter"
  script.onload = page
  script.defer = true
  document.head.append(script)
  document.addEventListener("nav", page)
  window.addEventListener("scroll", () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      if (!enabled() || !window.umami || document.visibilityState !== "visible") return
      const article = document.querySelector(".center article")
      if (!article || article.offsetHeight < innerHeight * 1.5) return
      const rect = article.getBoundingClientRect()
      const ratio = (innerHeight - rect.top) / article.offsetHeight
      for (const [threshold, event] of [[.5, "read_half"], [.95, "read_end"]]) {
        if (ratio >= threshold && !sent.has(event)) { sent.add(event); track(event) }
      }
    }, 300)
  }, { passive: true })
  document.addEventListener("click", (event) => {
    const link = event.target.closest?.("a")
    if (!link) return
    if (link.matches(".reader-journey-next a:last-child")) track("next_reading")
    else if (new URL(link.href, location.href).pathname.startsWith("/ai-basics")) track("course_entry")
  })
})()
