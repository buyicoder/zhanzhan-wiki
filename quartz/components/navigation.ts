interface NavigationSection {
  id: string
  zh: string
  en: string
  target: string
  roots: string[]
  chapters: string[]
  flatten: boolean
  overview: { zh: string; en: string } | null
}

const knowledgeRoots = [
  "map",
  "input",
  "capability",
  "leverage",
  "ai-work",
  "expression",
  "life",
  "tutorials",
]

export const navigationSections: NavigationSection[] = [
  {
    id: "home",
    zh: "首页",
    en: "Home",
    target: "index",
    roots: ["index"],
    chapters: [],
    flatten: false,
    overview: null,
  },
  {
    id: "knowledge",
    zh: "知识库",
    en: "Knowledge",
    target: "map/index",
    roots: knowledgeRoots,
    chapters: knowledgeRoots,
    flatten: false,
    overview: { zh: "总览", en: "Overview" },
  },
  {
    id: "course",
    zh: "AI 课程",
    en: "AI Course",
    target: "ai-basics/index",
    roots: ["ai-basics"],
    chapters: ["ai-basics"],
    flatten: true,
    overview: { zh: "课程总览", en: "Course overview" },
  },
  {
    id: "projects",
    zh: "项目与作品",
    en: "Projects",
    target: "portfolio/index",
    roots: ["portfolio", "cases", "works", "projects"],
    chapters: ["portfolio"],
    flatten: true,
    overview: { zh: "作品总览", en: "Project overview" },
  },
  {
    id: "about",
    zh: "关于占占",
    en: "About",
    target: "now",
    roots: ["now", "conventions", "privacy"],
    chapters: [],
    flatten: false,
    overview: null,
  },
]

export function navigationContext(slug: string) {
  const english = slug === "en" || slug.startsWith("en/")
  const localSlug = (english ? slug.replace(/^en\/?/, "") : slug) || "index"
  const root = localSlug.split("/")[0]
  const section =
    navigationSections.find((item) => item.roots.includes(root)) ?? navigationSections[1]
  return { english, localSlug, root, section }
}
