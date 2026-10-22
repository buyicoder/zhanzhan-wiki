# Daily Learning

The homepages contain a horizontal reading-source strip linking to `/daily/` and
`/en/daily/`. Six external sources open in separate tabs, without routing through
the site's SPA. The source descriptions do not imply the owner has read or endorsed
every article. They were checked on 2026-10-19.

The section uses the existing navigation configuration and folder index, not a
separate CMS. New notes are normal Markdown files in `content/daily/` and appear
in the section listing, sidebar, search, and site feed after rebuilding.

## Publish A Note

Add `content/daily/YYYY-MM-DD-short-title.md` with actual publication dates:

```markdown
---
title: A concrete learning takeaway
date: YYYY-MM-DD
description: One sentence on what this note contains.
---

## Source

Link to the original writing and identify the author.

## What I Learned

Write the takeaway in your own words.

## What I Tried

Record actual steps, results, and limits. Omit if not tried.
```

Add an English counterpart under `content/en/daily/` with `lang: en` when ready.
For curated links in folder indexes, use a full Quartz wikilink such as
`[[daily/YYYY-MM-DD-short-title|Note title]]`; the English index must use
`[[en/daily/YYYY-MM-DD-short-title|Note title]]`. A `./short-title` Markdown link
can resolve outside the folder after crawl-link rewriting. Verify the rendered
index-to-note navigation in a browser, not only that the output file exists.
Do not invent learning notes to populate the empty state. Remove the first-note
empty-state paragraph from each index when publishing its first actual note.
Build using the self-host profile and follow the existing manifest-verified
atomic deployment process.
