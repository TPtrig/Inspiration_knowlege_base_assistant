# Inspiration product requirements

- Version: 3.0 draft
- Updated: 2026-09-29
- Scope: first usable single-person backend
- Related: [Technical design](./TRD.md) · [Desktop direction](./desktop-ui-direction.md)

## Product promise

The information a person trusts is scattered across expert interviews, podcasts, papers, and research. Inspiration turns sources they choose into a personal knowledge base. As they save more ideas, the product helps them ask grounded questions, connect related topics, and notice new insights.

The user decides which sources and takeaways enter memory. "Grounded" means an answer is supported by saved items and links back to them. User selection expresses relevance and trust; it does not prove a source is factually correct. Inspiration does not perform automatic fact-checking.

## User and jobs

The first user follows long-form industry material and wants to use it again: a researcher, builder, operator, investor, or curious learner. They need to:

1. Keep a traceable record of where each idea came from.
2. Decide which claims are useful enough to keep.
3. Ask questions against that chosen material, with visible supporting sources.
4. See meaningful links between topics without invented certainty.
5. Return to an older source or conversation when a new idea makes it relevant.

## Product principles

- **The user chooses the sources.** The system can suggest takeaways but cannot silently promote raw content into trusted memory.
- **Provenance stays attached.** Saved ideas retain a source, URL or note reference, and capture time. Answers and map links expose evidence.
- **The system can say "I don't know."** A weak match does not permit an answer from general model knowledge.
- **Connections have degrees.** Strong, related, and weak links reflect saved evidence. Omit a link when evidence is too thin.
- **The workspace stays concise.** The product page at / explains the idea; the desktop workspace at /workspace shows material and actions.
- **The public demo is labeled.** Sample chats, map, and inbox items must not appear to be output from a user's real library.

## First release boundary

The first backend release is a **single-person, locally usable closed loop**: intake, review, saving, grounded chat, topic connections, and a persistent inbox. Accounts and public multi-user hosting are later work.

| Input | First release behavior |
| --- | --- |
| Podcast episode or direct audio URL | Resolve supported audio, transcribe it, propose takeaways, and retain source provenance. |
| Plain text or personal note | Save the text as a source and propose takeaways from it. |
| Paper or research link | Save the URL and a user-pasted excerpt or notes. Use that submitted text for extraction. |
| Video link or image attachment | Keep the demo affordance; show that real Live Mode parsing is unavailable until implemented. |

A paper URL alone does not imply full-text access. PDF upload, arbitrary web scraping, video transcription, image understanding, automatic source verification, accounts, and sync are outside this release.

## Core journey

1. **Choose a source.** Add a supported podcast URL, write a note, or add a paper link with an excerpt. See its title, type, URL, and processing state.
2. **Review draft ideas.** Edit, select, reject, or remove proposed takeaways.
3. **Build memory.** Only selected takeaways become durable memory. Disabling or deleting one removes it from new answers and new map evidence.
4. **Ask with evidence.** Chat cites saved ideas and sources. If memory does not support an answer, the product says so.
5. **Explore connections.** Islands are topics derived from saved ideas. Each line has a strength, explanation, and supporting items. Clicking an island opens matching ideas, sources, and conversations.
6. **Revisit insights.** The inbox stores map updates and relevant resurfacing suggestions. Read state survives reloads.

There is one New Chat action. "New Thread" and "New Chat" are not separate concepts.

## P0 requirements and acceptance

### Source intake and provenance

- Store a stable source ID, type, title, original URL when present, captured time, and submitted content or transcript.
- Require an excerpt or note before extracting from a paper link.
- Show queued, processing, ready for review, and failed states; retain a failed source for retry.
- Reject unsupported Live Mode inputs clearly instead of returning fabricated takeaways.

**Accept:** a podcast and a paper link with a manual excerpt both produce reviewable drafts tied to their sources; an unsupported URL gets a clear explanation.

### Review and memory

- Let the user edit drafts before saving.
- Make saving idempotent, without duplicate memories from a repeated click.
- Index only selected items. Disabled or deleted items leave retrieval and future map evidence.
- Preserve provenance when a conversation changes or is removed.

**Accept:** a rejected draft never enters memory; disabling a saved item excludes it from the next answer and map refresh.

### Grounded chat

- Search only enabled, non-deleted memories in the person's library.
- Return memory IDs and source labels/URLs with the answer, not anonymous snippets.
- Return an explicit insufficient-evidence response where needed.
- Persist messages and their cited sources. One New Chat action creates one conversation.

**Accept:** a citation opens its source, and a question without evidence receives no fabricated citation.

### Knowledge map

- Derive topics from enabled saved ideas, not uploads in general or fixed demo categories.
- Derive strong, related, and weak relationships from saved evidence; explain each visible line.
- Let each topic open matching ideas, sources, and conversations. Let each line expose its supporting items.
- Refresh after a memory save, disable, edit, or delete; retain the last valid map during refresh.

**Accept:** AI infrastructure and LLM model memories can have a stronger supported link than an unrelated finance memory, and the UI shows why.

### Persistent inbox

- Persist map updates and relevant resurfacing suggestions.
- Persist read/unread state and avoid repeat items for unchanged evidence.
- Link each item to its topic, source, memory, or conversation.

**Accept:** items and read state survive reload; opening an item reaches its evidence.

### Honest demo and live modes

- Keep a backend-free public demo with visible sample labeling.
- Use actual persisted sources, chats, memory, map, and inbox data in Live Mode.
- Never silently substitute sample output after a Live Mode API failure.

**Accept:** Live Mode displays no preset knowledge edge without saved evidence.

## Later releases

- Automatic PDF ingestion and citations to document passages.
- Video transcription and image understanding.
- Accounts, data isolation, sync, and public cloud hosting.
- Optional user notes about why a source is trusted.
- Scheduled synthesis for larger libraries. This release refreshes after relevant changes; it need not depend on a nightly cron job.

## Repository reality and gaps

The table describes the repository on 2026-09-29. Targets are not already shipped.

| Area | Current repository | First-release target |
| --- | --- | --- |
| Page and workspace | Light landing page at /; desktop workspace at /workspace | Keep this direction |
| Demo Mode | Seeded chats, sources, map, inbox; simulated parsing and answers | Keep, with clear sample labeling |
| Podcast Live Mode | Audio resolution, transcription, draft takeaways | Preserve, with complete source provenance |
| Other Live Mode inputs | Non-podcast parse endpoint returns mock results; attachments send names, not file contents | Real note and paper-excerpt intake; explicit unsupported image/video states |
| Memory and chat | SQLite metadata, Chroma embeddings, enabled-item filtering; anonymous context strings | Stable source citations, idempotent saves, index consistency |
| Map | Fixed frontend topics; Live Mode has no relationship edges | Persisted topics and evidence-backed weighted edges |
| Inbox | Frontend state; keyword hints and graph payload lack durable evidence | Persisted items, read state, evidence links |
| Background work | In-process tasks and local-time scheduler | Recoverable jobs triggered by memory changes |

## Delivery order and success

1. Source and memory integrity: real note/paper-excerpt intake, provenance, editable drafts, reliable save/disable/delete.
2. Grounded answers: source-aware retrieval, citations, insufficient-evidence behavior.
3. Living map: derived topics, evidence-backed strengths, click-throughs.
4. Inbox and resilience: persistence, deduplication, read state, recoverable jobs.

The release is complete when one person can add a podcast and a paper excerpt, curate both, ask a cited question across them, inspect a justified cross-topic connection, and reopen that state after restart. Track intake-to-save completion, citation coverage, abstention on unsupported questions, map-link evidence coverage, and inbox revisit rate.

## Decisions recorded

- 2026-09-29: Start with a single-person usable backend.
- 2026-09-29: Start paper support with links plus manual excerpts/notes; PDF parsing comes later.
- Selected material is the user's chosen reference set, not independently verified ground truth.
