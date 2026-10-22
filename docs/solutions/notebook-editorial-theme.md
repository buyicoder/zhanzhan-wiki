# Editorial Notebook Theme

The October 19 redesign borrows the editorial language of swyx.io: serif
headings, paper and ink, marginal project notes, a book-spine course link,
and a horizontally browsable essay index. It uses Zhanzhan's own content,
existing brand mark, and existing desk illustration, not the reference site's assets.

## Ownership

- Layout and color tokens: `quartz/styles/studio.scss`.
- Chinese and English homepages: `content/index.md`, `content/en/index.md`.
- Shared navigation and tools: `quartz/components/Header.tsx`.
- Analytics, language routing, canonical metadata, and deployment profiles remain intact.

## Markdown Boundary

Use a span with heading role inside an article-sized link. The heading
autolinker adds a nested anchor to native h2/h3 elements, which causes the
browser to split the outer link. Verify the emitted HTML, not just Markdown.
Avoid broad homepage link resets that override card padding or contrast.

## Verification

```bash
npm run build:self-host -- --output /tmp/zhanzhan-wiki-notebook-preview
WIKI_BUILD_DIR=/tmp/zhanzhan-wiki-notebook-preview node --test scripts/test-notebook-theme.mjs
node --test scripts/test-bilingual-content.mjs scripts/test-wiki-analytics.mjs
npx tsc --noEmit
```

Browser checks cover 1440px desktop, 390px mobile, search, theme switching,
random reading, and image loading. The article sidebar and both language
paths must continue to work when the theme changes.

This is a local preview build, not evidence of a production deployment.

## Section Navigation

The masthead and sidebar share `quartz/components/navigation.ts`. The masthead
switches between sections; the sidebar only lists chapters from the active
section. Knowledge, courses, and projects must not be mixed into a second
global menu. About pages do not need a chapter sidebar. Only the homepage
uses the full-width layout without section navigation.

The English content trie includes an `en/index` wrapper. Flatten that wrapper
before applying section filters, or every English chapter will be hidden.
Normalize both folder roots and article slugs without changing their URLs.
Test this via full-page reloads and SPA section changes.

Course and project roots are promoted into an overview link plus their direct
children. The knowledge map is a plain overview link, not an empty folder.
This is a DOM structure change, not a CSS-only hidden parent: preserve existing
URLs and child controls, number the promoted items, and select only the exact
current leaf. Sidebar collapse/restore must tolerate top-level leaf links.
Course lessons follow the existing 00-08 sequence rather than title sorting.
