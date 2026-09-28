# Desktop workspace and product page

## Workspace rule

Keep the workspace focused on actions and saved material: Chat, Memory, Inbox, and Connections. Show a short label, the current data, and the next action. Long explanations and product claims belong on the future product page.

## Connection map semantics

- A node is a topic drawn from saved ideas, not an uploaded file or an umbrella category. The small label identifies its source domain.
- A line represents a relationship between two topics. Thickness encodes strength; a dashed line means the evidence is weak.
- Selecting a relationship shows why it was drawn. Selecting a topic opens its chats and matching saved ideas.
- The current Demo map uses four hand-curated topics and evidence-based example relationships. Live Mode does not yet have an evidence-scored relationship service; it should not imply that a visual line was verified when no score exists.

For Live Mode, the next data step is topic extraction from saved ideas, semantic relationship scoring between topics, and a short citation to the saved ideas that support each line. A weak link should remain visibly weak or be omitted when the evidence is insufficient.

## Product page content

The standalone product page at `/` explains the value proposition, input types, curation loop, grounded answers, and cross-domain discovery with one concrete example. The application remains at `/workspace` so the product narrative stays outside the working interface.
