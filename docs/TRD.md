# Inspiration technical requirements and design

- Version: 1.0 draft
- Updated: 2026-09-29
- Product source: [PRD](./PRD.md)
- Target: one person using a local backend and the existing desktop web workspace

## 1. Goal and present state

Implement the PRD's first closed loop without changing the current landing page or replacing the public Demo Mode. The backend already has FastAPI, SQLite, Chroma, a real podcast audio path, conversation endpoints, and curated-item retrieval. It is a base to extend, not a complete Live Mode.

Important gaps observed in code:

- The legacy non-podcast parse endpoint generates mock takeaways from submitted strings; the Live workspace no longer calls it. Notes, papers, images, and video still need real intake.
- Podcast audio attachments send file bytes; image and video intake are not implemented.
- Chat now returns numbered citations to saved takeaways with memory IDs, task IDs, source titles, and source URLs. Transcript-level quotes, speakers, and timestamps are not yet linked to takeaways.
- Topic names and map geometry are preset in the frontend. Live Mode intentionally has no relationship edges.
- Inbox entries and read state are held in frontend memory; the backend's cluster is a keyword grouping of media fragments, including material that was not curated.
- Background tasks and the scheduler live inside the API process. They are not recoverable after a restart.
- Live Mode reads the OpenAI key from the backend environment; the browser does not receive or submit it. Previously saved browser session keys are cleared on workspace load.

## 2. Architecture and authority

Keep the current stack for the first release: Next.js client, FastAPI service, SQLite for durable records, Chroma for vector search, and a configurable model provider. SQLite is authoritative. Chroma is a rebuildable search projection, not the sole record of a saved idea.

Use a single local API process and one job worker. Long-running work is represented by durable SQLite jobs. A process restart reclaims interrupted jobs. Sample material can render without a backend; podcast extraction in that same workspace uses the backend and creates a separate real conversation.

For local development, optionally load `OPENAI_API_KEY` from `backend/.env`. For a hosted backend, set it in the hosting provider's secret settings; the backend already reads its process environment, so a local file is not required. Do not store a provider key in SQLite or ship it in API responses. AI extraction and answers show a clear configuration error if no key is configured. Public deployment additionally requires persistent source/memory storage, user authentication, request limits, and spend controls: CORS limits browser origins but does not protect an exposed API endpoint.

The current browser directly calls the FastAPI base URL. Restrict CORS to configured local frontend origins for Live Mode. Public multi-user access, authentication, and cloud hosting require another design pass.

## 3. Data model

Extend the existing database through additive, numbered migrations. Preserve legacy podcast tasks and brain items; do not wipe the local database.

| Entity | Required fields and purpose |
| --- | --- |
| sources | id, kind, original_url, title, submitted_text, transcript, captured_at, status, error; one record per source |
| draft_takeaways | id, source_id, text, selected, position, created_at, updated_at; editable review state |
| brain_items | existing ID/text/enabled/deleted/chroma_id plus source_id, draft_id, index_status; durable selected memory |
| conversation_sources | conversation_id, source_id; links chats to sources they used or captured |
| message_citations | message_id, brain_item_id, source_id, cited_text; preserves what supported an answer at send time |
| topic_snapshots | id, revision, status, created_at; one coherent published map |
| topics | snapshot_id, stable topic_id, label, summary, position_hint |
| topic_memberships | snapshot_id, topic_id, brain_item_id, score |
| topic_edges | snapshot_id, from_topic_id, to_topic_id, strength, score, explanation |
| edge_evidence | edge_id, brain_item_id; evidence for each visible relationship |
| inbox_items | id, kind, fingerprint, title, summary, target_type, target_id, payload, read_at, created_at |
| jobs | id, kind, payload, status, attempts, lease_until, error, created_at, updated_at |

Keep source URLs and timestamps in the relational store even if embeddings are re-created. A source link is not a verification claim. Use source_id as the cross-feature join key rather than interpreting the old podcast_title and podcast_url columns as the only source identity.

## 4. State transitions and consistency

### Source processing

queued -> processing -> ready_for_review, or failed. A failed job keeps its source and error and can be retried. A note or paper excerpt enters the same review flow as a transcript. A paper URL without an excerpt is rejected with an actionable validation message. Unsupported image/video Live Mode inputs return an unsupported-input response; they never enter the mock pipeline.

Persist drafts before telling the client processing completed. An extraction failure must not invent generic takeaways. Let the user write a draft manually when extraction is unavailable.

### Curation and indexing

A selected draft is saved once. Enforce a unique draft_id on a durable memory item, or use an idempotency key for legacy items. On save:

1. Write the memory in SQLite with index_status=pending.
2. Enqueue embedding/index work.
3. Upsert the Chroma document using the stable memory ID.
4. Mark index_status=ready after success.

Chat searches only ready, enabled, non-deleted rows. Disabling or deleting changes SQLite first, so the item is immediately excluded even if Chroma cleanup is delayed. Rebuild the index from SQLite when the two stores disagree. A saved text edit changes the embedding and schedules a map refresh.

### Map and inbox

Any saved, disabled, edited, or deleted memory increments a library revision and queues one map refresh. Debounce repeated edits. Build a new snapshot, validate evidence IDs, then publish it atomically. Keep the previous published snapshot visible while work runs. Record a map-update inbox item only if the published graph meaningfully changed. Create a resurfacing suggestion only for a supported, new relationship; use an evidence fingerprint to avoid duplicates.

## 5. API contract

Keep existing podcast and conversation endpoints during migration. New responses use stable IDs and typed source references. Version new contracts under /api/v1 where an old payload cannot be safely extended.

| Operation | Proposed contract |
| --- | --- |
| Add source | POST /api/v1/sources with kind, url?, title?, submitted_text?, conversation_id? -> source ID, status |
| Read/retry source | GET /api/v1/sources/{id}; POST /api/v1/sources/{id}/retry |
| Review drafts | GET /api/v1/sources/{id}/drafts; PATCH /api/v1/drafts/{id} for text and selection |
| Commit selection | POST /api/v1/sources/{id}/memories with draft IDs and idempotency key -> saved memory IDs |
| List/update memory | GET /api/v1/memories; PATCH/DELETE /api/v1/memories/{id} |
| Grounded chat | POST /api/v1/chat with question and conversation_id -> answer, abstained, citations[] |
| Map | GET /api/v1/map -> snapshot revision, topics[], edges[], evidence IDs; GET /api/v1/topics/{id} -> linked memory/source/conversation IDs |
| Inbox | GET /api/v1/inbox; PATCH /api/v1/inbox/{id} for read state |
| Job state | GET /api/v1/jobs/{id} -> status and safe error |

A citation includes memory_id, source_id, source_title, source_url when present, and a short supporting excerpt. The client can open the memory and its source. An unsupported question returns abstained=true with an empty citation list.

The existing /api/process, /api/tasks/{id}, /api/brain/*, /api/chat, and conversation routes remain functional until the workspace has moved to the new contract. Avoid changing their response shapes in place.

## 6. Processing and grounded answers

### Intake

- Audio: accept Xiaoyuzhou episode links and MP3/M4A/WAV/AAC/OGG uploads through separate inputs, then run one transcription and takeaway pipeline. Reject other podcast sites and Live Mode input types explicitly.
- Transcription: `PODCAST_TRANSCRIBER=auto` uses OpenAI Whisper for supported files up to 25 MB and Feishu Minutes through the local `lark-cli` for larger files or AAC. `feishu` and `openai` force one provider. Feishu first uploads the file to Drive, creates a Minute, waits for a transcript, and stores the returned minute URL. It requires a logged-in user CLI profile. The current in-process job runner is a limitation until durable jobs ship.
- Uploads: multipart `POST /api/process/upload` stages one audio file up to 500 MB and stores its task and transcript in SQLite. Temporary media and exported transcript files are removed after processing. The original filename and upload task ID remain as provenance.
- Note or paper excerpt: use exactly the submitted text as input. The URL is provenance, not automatically fetched full text.
- Use bounded text length, network timeouts, and clear errors. An external URL must pass scheme, hostname, resolved-IP, redirect, size, and content-type checks before any server fetch to prevent local-network access through a pasted link.

### Chat

1. Embed the question and retrieve more Chroma candidates than the final context count.
2. Join candidates to SQLite. Discard any item that is disabled, deleted, not indexed, or absent.
3. Apply a relevance gate. If no item clears it, return the insufficient-evidence response.
4. Send numbered memory excerpts and source labels to the answer model with a strict instruction to use only that material.
5. Validate that returned citation numbers are among the supplied evidence. Persist the answer and citation snapshot with the conversation. This is implemented for the existing `/api/chat` endpoint.
6. Return evidence objects to the client. The current evidence is the selected takeaway, not a verbatim transcript excerpt. Transcript spans and speaker/time references remain future work.

Tune the relevance gate with a small, labeled set of supported and unsupported questions. Prompt wording alone is not the evidence gate.

## 7. Topic and relationship generation

The unit of evidence is an enabled saved memory item. A topic groups semantically related items; it is neither a source file nor a broad imported category. First implementation:

1. Cluster embeddings of enabled items into candidate topics. Give every topic at least one member and a stable ID across rebuilds when membership remains similar.
2. Create short labels and summaries from member texts. Reject labels that cannot be tied to members.
3. Consider topic pairs using semantic similarity and explicit shared concepts in their supporting items.
4. Store the pair's evidence IDs, score, and a short explanation. Calibrate score bands for strong, related, and weak against reviewed examples; omit unsupported pairs.
5. Publish the snapshot only after all node and edge references resolve.

The AI infrastructure ↔ LLM example should score above a finance ↔ AI infrastructure analogy when the saved evidence supports that ordering. A dashed weak edge explains its limited support. A click on a topic or edge navigates to the actual linked records, not static copy.

The existing island artwork and fixed layout can remain as a visual shell. Live Mode receives topic labels, positions, strengths, and evidence from the API; it does not reuse preset relationships.

## 8. Inbox and job execution

Store read state in SQLite. A graph item points to a snapshot; a suggestion points to its evidence and target topic or memory. Never fabricate an inbox item just because the workspace opened. The frontend receives compact list records and loads details only when selected.

Use the jobs table for extraction, embedding, map refresh, and inbox generation. A worker leases a job, records attempts and errors, and can retry safe operations after a restart. Long audio processing has limits and cancellation cleanup. Job handlers must be idempotent. The first release may run this worker alongside FastAPI as one local process, but the lease prevents duplicate publication if a second process starts.

## 9. Migration and implementation slices

1. **Foundation:** add migrations, sources, drafts, jobs, real note/paper-excerpt intake, and unsupported-input errors. Keep the existing audio path.
2. **Memory integrity:** idempotent commit, index status/recovery, disable/delete filtering, source associations.
3. **Grounded chat:** stable evidence objects, answer citation validation, abstention, persisted message citations.
4. **Map:** saved-memory topics, weighted evidenced edges, topic/source/chat navigation; remove preset Live Mode edges and labels.
5. **Inbox:** durable items, read state, deduplication, refresh triggers.
6. **Frontend integration:** wire the current workspace to these contracts while keeping Demo Mode isolated.

Do not treat a slice as done when only its endpoint exists. Each slice must work through the desktop UI and survive a backend restart.

## 10. Verification and release gate

Use small deterministic fixtures: one podcast transcript, one paper excerpt, one unrelated note, and at least one disabled memory. Verify:

- Only selected items enter memory; repeated save creates no duplicate.
- Disable/delete takes effect in the next answer and map, including when Chroma still holds an old vector.
- An answer cites only IDs returned by retrieval; an unsupported question abstains.
- Every visible map edge has resolvable evidence and a strength explanation.
- Topic and inbox clicks reach the linked records.
- Jobs recover after restart and do not duplicate inbox events.
- Demo Mode still works without the backend; Live Mode does not return mock material.

Before any public deployment, add authentication, per-user data isolation, secret management, rate limits, and a separate deployment design. The local single-person release is not a public service configuration.
