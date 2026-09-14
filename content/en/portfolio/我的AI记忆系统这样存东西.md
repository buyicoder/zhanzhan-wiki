---
title: "My, AI, memory system."
date: 2026-07-15
tags: [Jarvis, Memory System, Structure, Production Log]
provenance: "Take your notes."
maturity: "I'm growing."
content_type: "Cases"
reader_path: cases
lang: en
---

> ♪ Notemaking ♪[[en/conventions|The rules of honesty at this station.]]

When I designed memory storage for my AI housekeeper, I stepped on the first version of the question: All files are paved without a hierarchy under a directory; vector index is a fixed wordsheet, and new terminology is never searched; the journal had the same search weight as yesterday ' s; the journal mentioned an item that was not automatically associated with the project file; temporary data (scan reports) and permanent data (personal files) are treated equally.

The second version of the architecture addresses these issues with two layers at its core.

## Four layers of storage by prescription

- **Permanent Layer**Identity, values, key decisions, summary of projects. Never expire, the search weight is highest, and the summary is automatically loaded on start-up.
- **Thermal**: Recent 90-day daily records, recent 30-day external communications, consumption records. The last three days have been automatically loaded, earlier on-demand.
- **Temperature**: Archive of records for more than 90 days, load on demand only by vector search, and not automatically enter the context.
- **Temporary**: System scan reports such one-off products, filed or deleted after 30 days. The information will be outdated and the data will be longer than the analysis.

## 3-D simultaneous index

1. **Vector Index**Semantic search. The lesson is that TF-IDFs are not used in a fixed vocabulary, and the new human and project names will become zero vectors and never be found.
2. **Time Index**: Catalogue structure is an index in itself.`YYYY/MM/日期.md`Faster than any database. One more timeline summary file, 50 words a day, will be enough to read it on start-up without going through the directory.
3. **Association Index**: maintain a two-way link in the metadata of each note, automatically extract the index script, and build a linkage map.

## Load what on startup?

Not all loads, but layers: only commands, ID summaries, timelines for the last seven days, and project indexes, approximately 2,500 token, are entered at start-up; several segments are returned when users ask questions with the required vector; full texts of the last few days are loaded at depth analysis.

## Five design principles

1. **Markdown is the source of truth.**All data end up in human-readable markdown, vectors and indexes are aerobics.
2. **The file system is index.**The catalogue structure is faster and more honest than the database.
3. **Thermal data memory, temperature data on disk, cold data on archive.**
4. **Privacy layers.**Identity files and interpersonal communication have an independent sense of access control.
5. **Do not store original chat records.**The structured information (decision-making, relationships, preferences) extracted from the dialogue went to the permanent level and the original dialogue was not retained for long.

---

*A month later, the architecture evolved into a four-tier model of life cycle (flowing water, sedimentation, projects, indexing) and a public distribution channel, the site you are looking at is the export of the distribution pipeline. Previously,[[en/logs/为什么我给自己造了一个Jarvis|Why did I build myself, Jarvis?]]。*
