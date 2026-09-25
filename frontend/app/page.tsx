"use client";

/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ClipboardEvent } from "react";
import {
  Bell,
  Brain,
  CirclePlus,
  ImagePlus,
  Link2,
  LoaderCircle,
  MessageSquare,
  Paperclip,
  Send,
  Sparkles,
  Trash2,
  Waves
} from "lucide-react";
import { demoChatAnswer, isDemoModeEnabled } from "@/lib/demo";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  contexts?: string[];
  createdAt: number;
};

type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  messageCount: number;
  podcastIds: string[];
  createdAt: number;
  updatedAt: number;
};

type PodcastAsset = {
  id: string;
  title: string;
  url: string;
  sourceLabel: string;
  domain?: string;
  taskId?: string;
  createdAt: number;
};

type TakeawayItem = {
  id: string;
  podcastId: string;
  podcastTitle: string;
  podcastUrl: string;
  text: string;
  enabled: boolean;
  domain?: string;
  taskId?: string;
  persisted: boolean;
  itemId?: string;
};

type ParseState = {
  running: boolean;
  conversationId: string | null;
  stageIndex: number;
  triviaIndex: number;
  taskId: string | null;
  trivia: string[];
  domain: string;
  modeLabel: string;
};

type InputAttachment = {
  id: string;
  name: string;
  kind: "image" | "file";
};

type ConversationSummaryApi = {
  id: string;
  title: string;
  message_count: number;
  podcast_count: number;
  created_at: string;
  updated_at: string;
};

type ConversationMessageApi = {
  id: string;
  role: ChatRole;
  content: string;
  created_at: string;
};

type TaskStatusApi = {
  success: boolean;
  task_id: string;
  conversation_id?: string | null;
  status: string;
  message: string;
  audio_url?: string | null;
  transcript?: string | null;
  title?: string | null;
  summary?: string | null;
  takeaways?: string[] | null;
  error?: string | null;
};

type BrainItemApi = {
  id: string;
  task_id: string;
  podcast_title: string;
  podcast_url: string;
  text: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

type ChatApiResponse = {
  success: boolean;
  answer: string;
  contexts: string[];
  context_count: number;
};

type LoaderTriviaApi = {
  success: boolean;
  domain?: string;
  trivia?: string[];
};

type InsightNodeApi = {
  label: string;
  summary: string;
  evidence: string[];
};

type InsightClusterApi = {
  success: boolean;
  cluster_date: string;
  title: string;
  overview: string;
  hidden_commonality: string;
  nodes: InsightNodeApi[];
  prompt_preview: {
    system: string;
    user: string;
  };
};

type SerendipityHintApi = {
  success: boolean;
  hint: string;
  matched_items: string[];
  prompt_preview: {
    system: string;
    user: string;
  };
};

type KnowledgeGraphNode = {
  id: string;
  label: string;
  x: number;
  y: number;
};

type KnowledgeGraphEdge = {
  from: string;
  to: string;
  label: string;
  strength: "strong" | "related" | "weak";
  explanation: string;
};

type InboxItem =
  | {
      id: string;
      kind: "graph";
      title: string;
      summary: string;
      createdAtLabel: string;
      unread: boolean;
      graph: {
        title: string;
        summary: string;
        nodes: KnowledgeGraphNode[];
        edges: KnowledgeGraphEdge[];
      };
    }
  | {
      id: string;
      kind: "push";
      title: string;
      summary: string;
      createdAtLabel: string;
      unread: boolean;
      relatedIsland: string;
      suggestion: string;
      evidence: string[];
    };

type DemoSeedSource = {
  id: string;
  domain: "Finance" | "Business" | "AI";
  title: string;
  url: string;
  sourceLabel: string;
  persistedTakeaways: string[];
  draftTakeaways: string[];
  conversation: {
    title: string;
    user: string;
    assistant: string;
    contexts: string[];
  };
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

const loaderTriviaByDomain: Record<string, string[]> = {
  "Computer Vision": [
    "Vision Transformers treat an image as a sequence of patches, which lets attention replace classic convolutions.",
    "CLIP aligned images and language so effectively that zero-shot classification became practical for many downstream tasks.",
    "In segmentation pipelines, annotation quality often improves results more than architectural novelty.",
    "Latent diffusion works in compressed feature space, which is a major reason image generation became much cheaper.",
    "Feature drift in video models can emerge from scene cuts faster than from object motion itself."
  ],
  "NLP / LLM / RAG": [
    "RAG quality often drops because retrieval returns plausible text, not because the generator is weak.",
    "Chunk overlap is a recall tool, but too much overlap can quietly reduce diversity in retrieved evidence.",
    "A small curated memory base usually beats a large noisy index for grounded chat demos.",
    "Embedding models encode similarity, but system prompts still decide whether the final answer stays honest.",
    "The fastest RAG gain in product teams is often better memory curation, not a bigger model."
  ],
  Podcast: [
    "Podcast retention improves when listeners rewrite ideas into decisions instead of summaries.",
    "Host transitions and ad breaks are natural chunk boundaries for long-form audio indexing.",
    "A good episode title can improve later retrieval because it becomes a strong semantic anchor.",
    "Audio with consistent loudness usually transcribes better than audio with the same bitrate but uneven dynamics.",
    "Chapterized podcasts create cleaner knowledge graphs because topic shifts are already partially labeled."
  ]
};

const parseStages = [
  "Reading signal from your source...",
  "Parsing media in background...",
  "Drafting takeaways and links...",
  "Preparing Inspiration memory..."
];

const presetIslandModules = [
  {
    id: "capital-cash",
    label: "Capital & Cash",
    domain: "Finance",
    keywords: ["cash", "rate", "debt", "interest", "refinanc", "capital", "maturity", "collections"],
    summary: "Rates, cash flow, and refinancing timing from the finance source."
  },
  {
    id: "operating-rhythm",
    label: "Operating Rhythm",
    domain: "Business",
    keywords: ["review", "metric", "checkpoint", "memo", "decision", "pricing", "onboarding", "owner"],
    summary: "Decisions, checkpoints, and written reviews from the business source."
  },
  {
    id: "ai-infrastructure",
    label: "AI Infrastructure",
    domain: "AI",
    keywords: ["agent", "eval", "checkpoint", "fallback", "groundedness", "latency"],
    summary: "Agent checkpoints, evaluations, and fallbacks from the AI source."
  },
  {
    id: "llm-models",
    label: "LLM Models",
    domain: "AI",
    keywords: ["model", "fine-tun", "prompt", "weights", "frontier"],
    summary: "Model choices and fine-tuning tradeoffs from the AI source."
  }
];

const compactTopicLabels: Record<string, string> = {
  "capital-cash": "Capital",
  "operating-rhythm": "Operations",
  "ai-infrastructure": "AI Infra",
  "llm-models": "LLM"
};

function matchesTopicKeywords(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => new RegExp(`(?:^|[^a-z])${keyword}`, "i").test(text));
}

const presetKnowledgeGraph = {
  title: "Knowledge connections",
  summary: "Topics from three saved sources, with different levels of connection.",
  nodes: [
    { id: "capital-cash", label: "Capital & Cash", x: 27, y: 23 },
    { id: "operating-rhythm", label: "Operating Rhythm", x: 73, y: 23 },
    { id: "ai-infrastructure", label: "AI Infrastructure", x: 27, y: 75 },
    { id: "llm-models", label: "LLM Models", x: 73, y: 75 }
  ],
  edges: [
    { from: "ai-infrastructure", to: "llm-models", label: "AI system design", strength: "strong" as const, explanation: "The model note places fine-tuning after retrieval and workflow stabilization; the infrastructure notes spell out the evals and checkpoints needed first." },
    { from: "operating-rhythm", to: "ai-infrastructure", label: "checkpoints", strength: "related" as const, explanation: "Business reviews and agent workflows both call for visible checkpoints, with an owner or a system decision at each step." },
    { from: "capital-cash", to: "operating-rhythm", label: "decision timing", strength: "related" as const, explanation: "The finance notes ask teams to surface risk early; the business notes describe a review rhythm that makes those decisions actionable." },
    { from: "capital-cash", to: "ai-infrastructure", label: "broader analogy", strength: "weak" as const, explanation: "Both sources discuss constraints, but these saved notes do not directly establish a finance-to-AI infrastructure relationship." }
  ],
};

const initialInboxItems: InboxItem[] = [
  {
    id: "graph-nightly-2000",
    kind: "graph",
    title: "Topic connections updated",
    summary: "Four topics now show strong, related, and weak links.",
    createdAtLabel: "Scheduled for 20:00",
    unread: true,
    graph: presetKnowledgeGraph
  },
  {
    id: "push-pricing-margin",
    kind: "push",
    title: "Pricing idea matches two older notes",
    summary: "A business note on packaging simplicity and a finance note on margin protection now point at the same pricing decision.",
    createdAtLabel: "Unread push · 09:12",
    unread: true,
    relatedIsland: "Capital & Cash",
    suggestion:
      "You're thinking about pricing. It may help to review two older memories together: one from the finance podcast on protecting margins in a high-rate environment, and one from the business podcast on how simpler packaging makes price changes easier to land.",
    evidence: [
      "Finance: protect free cash flow after interest expense, not just revenue optics.",
      "Business: pricing updates work better when packaging and sales migration story are simplified."
    ]
  },
  {
    id: "push-eval-rhythm",
    kind: "push",
    title: "Your AI ops question echoes an operating memo",
    summary: "A business lesson about weekly decision cadence lines up with the AI note on evaluation rituals and checkpointed agents.",
    createdAtLabel: "Unread push · 11:40",
    unread: true,
    relatedIsland: "AI Infrastructure",
    suggestion:
      "You're asking about agent reliability, but this overlaps with your earlier note on weekly operating memos. Stable systems usually depend on a fixed review rhythm and explicit checkpoints.",
    evidence: [
      "Business: weekly written memos preserve decision sequence better than occasional strategy decks.",
      "AI: agent workflows need visible checkpoints where the system can stop, show evidence, and ask for confirmation."
    ]
  }
];

const demoSeedSources: DemoSeedSource[] = [
  {
    id: "finance-rates",
    domain: "Finance",
    title: "Macro Allocator Weekly: Higher-for-Longer Rates and the New Value of Cash",
    url: "https://demo.inspiration.app/podcasts/finance/higher-for-longer-rates",
    sourceLabel: "Finance podcast · parsed 12 days ago · 58 min",
    persistedTakeaways: [
      "In a higher-for-longer rate cycle, the first real fragility often appears in debt maturity concentration rather than headline revenue slowdown.",
      "Teams should review free cash flow after interest expense when judging resilience; EBITDA can hide refinancing pressure.",
      "Cash is not idle if short-duration yield restores optionality for hiring, product timing, and distressed acquisitions.",
      "Usage-based businesses need tighter collections monitoring because billing lag can deteriorate before churn becomes visible.",
      "Board updates should include a refinancing wall view 12 to 18 months out so maturity risk becomes a product and staffing input."
    ],
    draftTakeaways: [
      "When capital becomes expensive, roadmap bets should be discussed in payback-period language rather than only strategic narrative.",
      "A company that protects cash conversion can keep optionality longer than a faster-growing peer with weaker financing timing."
    ],
    conversation: {
      title: "Finance memory: rates, cash, refinancing",
      user: "From the finance podcasts, what should a software company actually watch if rates stay high for another year?",
      assistant:
        "The strongest pattern was to stop treating 'cash runway' as the only health metric. The finance material pushed toward debt maturity timing, free cash flow after interest expense, and collection discipline as earlier warning signals.",
      contexts: [
        "Teams should review free cash flow after interest expense when judging resilience; EBITDA can hide refinancing pressure.",
        "Board updates should include a refinancing wall view 12 to 18 months out so maturity risk becomes a product and staffing input."
      ]
    }
  },
  {
    id: "business-ops",
    domain: "Business",
    title: "Operator's Stack: Turning GTM Meetings into a Compounding Operating System",
    url: "https://demo.inspiration.app/podcasts/business/operating-system-cadence",
    sourceLabel: "Business podcast · parsed 9 days ago · 64 min",
    persistedTakeaways: [
      "The best operating reviews end with one accountable owner, one leading metric, and one next checkpoint instead of a recap of everything discussed.",
      "Mid-market SaaS teams often lose growth because ICP discipline erodes before top-of-funnel volume does.",
      "Pricing changes land better when paired with packaging simplification and a concrete migration story for sales.",
      "Weekly written memos outperform oversized quarterly decks because they preserve decisions in sequence and reduce reinterpretation.",
      "If onboarding time-to-value trails the sales promise, retention risk is already embedded before expansion ever enters the conversation."
    ],
    draftTakeaways: [
      "Founders should separate activity growth from throughput growth so GTM dashboards do not mistake motion for progress.",
      "Every cross-functional review should produce a visible tradeoff, not just a status update, if you want meetings to compound."
    ],
    conversation: {
      title: "Business memory: operating cadence and GTM",
      user: "What kept repeating across the business podcasts about how strong teams actually operate?",
      assistant:
        "They repeatedly turned management into a cadence problem. The podcasts favored written continuity, narrow accountability, and metrics that survive handoffs over high-energy but low-memory meetings.",
      contexts: [
        "The best operating reviews end with one accountable owner, one leading metric, and one next checkpoint instead of a recap of everything discussed.",
        "Weekly written memos outperform oversized quarterly decks because they preserve decisions in sequence and reduce reinterpretation."
      ]
    }
  },
  {
    id: "ai-rag-agents",
    domain: "AI",
    title: "Practical AI Systems: Reliable RAG, Eval Loops, and Agent Checkpoints",
    url: "https://demo.inspiration.app/podcasts/ai/reliable-rag-agents",
    sourceLabel: "AI podcast · parsed 3 days ago · 71 min",
    persistedTakeaways: [
      "Retrieval quality is usually constrained by curation and ranking before it is constrained by the frontier model.",
      "Agent workflows should expose checkpoints where the system can stop, show evidence, and ask for confirmation.",
      "Eval sets need to mirror product-visible failures: groundedness, latency, refusal quality, and recovery after misses.",
      "Fine-tuning should follow prompt, retrieval, and workflow stabilization; otherwise teams compress noise into weights.",
      "The fastest reliability gain is often a stronger fallback policy that says 'I don't know' before the system starts guessing."
    ],
    draftTakeaways: [
      "Multi-agent systems only feel intelligent when each agent has a narrow contract and an observable handoff.",
      "If memory curation is weak, more tools simply amplify confident failure modes."
    ],
    conversation: {
      title: "AI memory: RAG reliability and agents",
      user: "If we were building AI features next quarter, what should we prioritize before adding more agents?",
      assistant:
        "The AI material was pretty decisive: get memory curation, retrieval ranking, and visible checkpoints right first. More agents on top of weak evidence only create more expensive ambiguity.",
      contexts: [
        "Retrieval quality is usually constrained by curation and ranking before it is constrained by the frontier model.",
        "Agent workflows should expose checkpoints where the system can stop, show evidence, and ask for confirmation."
      ]
    }
  }
];

const presetInsightCluster: InsightClusterApi = {
  success: true,
  cluster_date: "2026-03-29",
  title: "Connections across saved topics",
  overview: "Four topics from three saved sources.",
  hidden_commonality: "The AI topics connect closely; links to finance are less direct.",
  nodes: presetIslandModules.map((item) => ({
    label: item.label,
    summary: item.summary,
    evidence: [item.summary]
  })),
  prompt_preview: {
    system: "Identify topics and evidence-backed relationships from saved material.",
    user: "Show which saved topics are closely related and which connections remain weak."
  }
};

function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function makeLocalConversation(): Conversation {
  const now = Date.now();
  return {
    id: makeId("conv"),
    title: "New Chat",
    messages: [],
    messageCount: 0,
    podcastIds: [],
    createdAt: now,
    updatedAt: now
  };
}

function createDemoWorkspaceSeed() {
  const now = Date.now();

  const podcasts: PodcastAsset[] = demoSeedSources.map((source, index) => ({
    id: source.id,
    title: source.title,
    url: source.url,
    sourceLabel: source.sourceLabel,
    domain: source.domain,
    createdAt: now - (index + 1) * 86_400_000
  }));

  const takeaways: TakeawayItem[] = demoSeedSources.flatMap((source) => {
    const persisted = source.persistedTakeaways.map((text, takeawayIndex) => ({
      id: `${source.id}-saved-${takeawayIndex}`,
      itemId: `${source.id}-memory-${takeawayIndex}`,
      podcastId: source.id,
      podcastTitle: source.title,
      podcastUrl: source.url,
      text,
      enabled: true,
      domain: source.domain,
      persisted: true,
      taskId: `seed-task-${source.id}`
    }));
    const drafts = source.draftTakeaways.map((text, takeawayIndex) => ({
      id: `${source.id}-draft-${takeawayIndex}`,
      podcastId: source.id,
      podcastTitle: source.title,
      podcastUrl: source.url,
      text,
      enabled: takeawayIndex === 0,
      domain: source.domain,
      persisted: false,
      taskId: `seed-task-${source.id}`
    }));
    return [...persisted, ...drafts];
  });

  const conversations: Conversation[] = demoSeedSources.map((source, index) => {
    const createdAt = now - (index + 1) * 43_200_000;
    const userMessage: ChatMessage = {
      id: `${source.id}-user`,
      role: "user",
      content: source.conversation.user,
      createdAt
    };
    const assistantMessage: ChatMessage = {
      id: `${source.id}-assistant`,
      role: "assistant",
      content: source.conversation.assistant,
      contexts: source.conversation.contexts,
      createdAt: createdAt + 90_000
    };
    return {
      id: `${source.id}-conversation`,
      title: source.conversation.title,
      messages: [userMessage, assistantMessage],
      messageCount: 2,
      podcastIds: [source.id],
      createdAt,
      updatedAt: createdAt + 90_000
    };
  });

  return {
    conversations,
    activeConversationId: conversations[2]?.id ?? conversations[0]?.id ?? "",
    podcasts,
    takeaways,
    inboxItems: initialInboxItems,
    selectedInboxItemId: initialInboxItems[0]?.id ?? "",
    insightCluster: presetInsightCluster
  };
}

function parseIsoToMillis(value?: string | null): number {
  if (!value) {
    return Date.now();
  }
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? Date.now() : ts;
}

function summarizeTextTitle(raw: string): string {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return "New Chat";
  }
  const cap = /[\u4e00-\u9fa5]/.test(cleaned) ? 18 : 34;
  if (cleaned.length <= cap) {
    return cleaned;
  }
  return `${cleaned.slice(0, cap)}...`;
}

function derivePodcastTitle(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace("www.", "");
    const slug = u.pathname.split("/").filter(Boolean).slice(-1)[0] ?? "episode";
    const compact = slug.replace(/[-_]/g, " ").slice(0, 32);
    return `Source from ${host}: ${compact || "untitled"}`;
  } catch {
    return "Captured Source";
  }
}

function extractUrls(raw: string): string[] {
  const matches = raw.match(/https?:\/\/[^\s]+/g);
  return matches ? Array.from(new Set(matches.map((value) => value.trim()))) : [];
}

function pickLoaderDomain(raw: string): keyof typeof loaderTriviaByDomain {
  const normalized = raw.toLowerCase();
  if (/(vision|image|clip|video|multimodal|camera|pixel)/.test(normalized)) {
    return "Computer Vision";
  }
  if (/(rag|llm|embedding|retriev|prompt|language|agent|nlp)/.test(normalized)) {
    return "NLP / LLM / RAG";
  }
  return "Podcast";
}

function createFallbackTrivia(seed: string) {
  const domain = pickLoaderDomain(seed);
  return {
    domain,
    trivia: loaderTriviaByDomain[domain]
  };
}

function makeMockTitle(rawInput: string, attachments: InputAttachment[]): string {
  const firstUrl = extractUrls(rawInput)[0];
  if (firstUrl) {
    return derivePodcastTitle(firstUrl);
  }
  if (attachments.length) {
    return `Visual note: ${summarizeTextTitle(attachments[0].name)}`;
  }
  const compact = summarizeTextTitle(rawInput);
  return compact === "New Chat" ? "Captured text note" : `Text note: ${compact}`;
}

function mockTakeawaysFromInput(rawInput: string, attachments: InputAttachment[]): string[] {
  const title = makeMockTitle(rawInput, attachments);
  const domain = pickLoaderDomain(`${rawInput} ${attachments.map((item) => item.name).join(" ")}`);
  const domainLead =
    domain === "Computer Vision"
      ? "Visual material benefits from object-level grouping before retrieval."
      : domain === "NLP / LLM / RAG"
        ? "Curated memory and precise retrieval usually matter more than model size."
        : "Long-form listening becomes useful when it is rewritten into portable decisions.";

  return [
    `${title}: capture the strongest claim first, not the whole source.`,
    domainLead,
    "Promote only high-signal takeaways into the shared memory layer.",
    "Keep source context attached so later answers can stay grounded.",
    "Use synthesis notes to connect this source with older discoveries."
  ];
}

function describeInputMode(rawInput: string, attachments: InputAttachment[]): string {
  if (extractUrls(rawInput).length > 0 && attachments.length > 0) {
    return "Link + image intake";
  }
  if (extractUrls(rawInput).length > 0) {
    return "Media link intake";
  }
  if (attachments.length > 0) {
    return "Image intake";
  }
  return "Text intake";
}

function localIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createLocalSerendipityHint(seed: string, takeaways: TakeawayItem[]): string | null {
  const lowered = seed.toLowerCase();
  const match = takeaways.find((item) => {
    const text = item.text.toLowerCase();
    return lowered
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length >= 4)
      .some((token) => text.includes(token));
  });
  if (!match) {
    return null;
  }
  return `Serendipity: this new thread echoes ${summarizeTextTitle(match.text)}.`;
}

function createPresetSerendipityInboxItem(seed: string): InboxItem | null {
  const normalized = seed.toLowerCase();

  if (/(price|pricing|margin|cash|burn|runway|budget|finance|interest)/.test(normalized)) {
    return {
      id: "push-capital-match",
      kind: "push",
      title: "A finance memory can sharpen this decision",
      summary: "Your new idea touches pricing or margin. The stored finance material can anchor it in cash and capital timing instead of intuition alone.",
      createdAtLabel: "New push",
      unread: true,
      relatedIsland: "Capital & Cash",
      suggestion:
        "This idea is not only a business judgment. It can be validated against that earlier finance memory about protecting margins in a higher-rate environment. Do you want to review them together?",
      evidence: [
        "Finance: treat free cash flow after interest expense as the real resilience lens.",
        "Business: pricing changes land better when packaging and migration path stay simple."
      ]
    };
  }

  if (/(agent|workflow|orchestrat|tool|route|checkpoint|handoff)/.test(normalized)) {
    return {
      id: "push-agent-match",
      kind: "push",
      title: "This workflow echoes an older AI reliability note",
      summary: "The way you are framing this workflow overlaps with the stored AI notes on checkpointed agents and bounded handoffs.",
      createdAtLabel: "New push",
      unread: true,
      relatedIsland: "AI Infrastructure",
      suggestion:
        "This workflow question is nearly the same thread as your earlier AI note on agent checkpoints. Do you want to open them side by side?",
      evidence: [
        "AI: agent workflows should expose checkpoints where the system can stop, show evidence, and ask for confirmation.",
        "Business: weekly review memos keep decisions and follow-ups visible."
      ]
    };
  }

  if (/(eval|benchmark|test|harness|regression|review|cadence|ritual)/.test(normalized)) {
    return {
      id: "push-cadence-match",
      kind: "push",
      title: "An operating memo from business memory fits here",
      summary: "This question is not only about process quality. A stored business note on weekly operating cadence can strengthen it.",
      createdAtLabel: "New push",
      unread: true,
      relatedIsland: "Operating Rhythm",
      suggestion:
        "You're asking about eval and review, but your earlier business note on weekly operating memos already offers the management layer for this problem.",
      evidence: [
        "Business: weekly written memos preserve decisions in sequence better than big quarterly decks.",
        "AI: eval sets should target user-visible failures, not only abstract benchmark gains."
      ]
    };
  }

  if (/(embedding|ranking|cluster|ml|retriev|connect|synth|pattern)/.test(normalized)) {
    return {
      id: "push-transfer-match",
      kind: "push",
      title: "An earlier model note fits here",
      summary: "The saved AI source covers retrieval and ranking before model changes.",
      createdAtLabel: "New push",
      unread: true,
      relatedIsland: "LLM Models",
      suggestion:
        "The earlier AI note suggests improving curation and ranking before changing the model. Review that source alongside this idea.",
      evidence: [
        "AI: retrieval quality is often constrained by curation and ranking first.",
        "AI: fine-tuning should follow stable retrieval and workflow evaluation."
      ]
    };
  }

  return null;
}

function stageIndexForTaskStatus(status: string): number {
  if (status === "transcribing") {
    return 1;
  }
  if (status === "extracting") {
    return 2;
  }
  if (status === "completed") {
    return 3;
  }
  return 0;
}

function podcastIdForTask(taskId: string): string {
  return `task-${taskId}`;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  const payload = (await response.json().catch(() => ({}))) as T & { detail?: string };
  if (!response.ok) {
    throw new Error(payload.detail || `Request failed with ${response.status}`);
  }
  return payload as T;
}

async function apiCreateConversation(title?: string) {
  return apiFetch<{ success: boolean; conversation: ConversationSummaryApi }>("/api/conversations", {
    method: "POST",
    body: JSON.stringify({ title })
  });
}

async function apiListConversations() {
  return apiFetch<{ success: boolean; conversations: ConversationSummaryApi[] }>("/api/conversations", {
    method: "GET"
  });
}

async function apiGetConversation(conversationId: string) {
  return apiFetch<{
    success: boolean;
    conversation: ConversationSummaryApi;
    messages: ConversationMessageApi[];
  }>(`/api/conversations/${encodeURIComponent(conversationId)}`, { method: "GET" });
}

async function apiCreateProcess(url: string, openaiApiKey: string, conversationId: string) {
  return apiFetch<{ success: boolean; task_id: string; status: string; message: string }>("/api/process", {
    method: "POST",
    body: JSON.stringify({ url, openaiApiKey, conversationId })
  });
}

async function apiParseMedia(content: string, mediaUrl: string | null, contentType: string, conversationId: string) {
  return apiFetch<{ success: boolean; task_id: string; status: string; message: string; mode: string }>("/api/parse_media", {
    method: "POST",
    body: JSON.stringify({ content, mediaUrl, contentType, conversationId })
  });
}

async function apiGetTask(taskId: string) {
  return apiFetch<TaskStatusApi>(`/api/tasks/${encodeURIComponent(taskId)}`, { method: "GET" });
}

async function apiSaveBrain(taskId: string, takeaways: string[], openaiApiKey: string) {
  return apiFetch<{ success: boolean; task_id: string; saved_count: number; item_ids?: string[]; message: string }>("/api/brain/save", {
    method: "POST",
    body: JSON.stringify({ taskId, takeaways, openaiApiKey })
  });
}

async function apiListBrainItems() {
  return apiFetch<{ success: boolean; items: BrainItemApi[] }>("/api/brain/items", { method: "GET" });
}

async function apiUpdateBrainItem(itemId: string, enabled: boolean) {
  return apiFetch<{ success: boolean; item: BrainItemApi }>(`/api/brain/items/${encodeURIComponent(itemId)}`, {
    method: "PATCH",
    body: JSON.stringify({ enabled })
  });
}

async function apiDeleteBrainItem(itemId: string) {
  return apiFetch<{ success: boolean }>(`/api/brain/items/${encodeURIComponent(itemId)}`, {
    method: "DELETE"
  });
}

async function apiChat(question: string, conversationId: string, openaiApiKey: string) {
  return apiFetch<ChatApiResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ question, conversationId, topK: 4, openaiApiKey })
  });
}

async function apiGetLoaderTrivia(conversationId?: string) {
  const query = conversationId ? `?conversationId=${encodeURIComponent(conversationId)}` : "";
  return apiFetch<LoaderTriviaApi>(`/api/get_loader_trivia${query}`, { method: "GET" });
}

async function apiGetLatestInsight() {
  return apiFetch<InsightClusterApi>("/api/insights/latest", { method: "GET" });
}

async function apiAutoCluster(clusterDate?: string) {
  const query = clusterDate ? `?clusterDate=${encodeURIComponent(clusterDate)}` : "";
  return apiFetch<{ success: boolean; cluster_date: string; generated: boolean; cluster?: InsightClusterApi | null }>(
    `/api/insights/auto_cluster${query}`,
    { method: "POST" }
  );
}

async function apiSerendipityHint(content: string, conversationId?: string) {
  return apiFetch<SerendipityHintApi>("/api/serendipity_hint", {
    method: "POST",
    body: JSON.stringify({ content, conversationId, limit: 3 })
  });
}

function summaryToConversation(summary: ConversationSummaryApi): Conversation {
  return {
    id: summary.id,
    title: summary.title,
    messages: [],
    messageCount: summary.message_count,
    podcastIds: [],
    createdAt: parseIsoToMillis(summary.created_at),
    updatedAt: parseIsoToMillis(summary.updated_at)
  };
}

export default function Page() {
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const contentScrollRef = useRef<HTMLDivElement | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>("");
  const [activePanel, setActivePanel] = useState<"chat" | "builder" | "inbox" | "island">("chat");
  const [leftPaneWidth, setLeftPaneWidth] = useState(280);
  const [rightPaneWidth, setRightPaneWidth] = useState(440);
  const [dragPane, setDragPane] = useState<"left" | "right" | null>(null);

  const [podcasts, setPodcasts] = useState<PodcastAsset[]>([]);
  const [takeaways, setTakeaways] = useState<TakeawayItem[]>([]);

  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [attachments, setAttachments] = useState<InputAttachment[]>([]);

  const [parseState, setParseState] = useState<ParseState>({
    running: false,
    conversationId: null,
    stageIndex: 0,
    triviaIndex: 0,
    taskId: null,
    trivia: loaderTriviaByDomain.Podcast,
    domain: "Podcast",
    modeLabel: "Media link intake"
  });

  const [chatBusy, setChatBusy] = useState(false);
  const [savingBrain, setSavingBrain] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [hint, setHint] = useState<string | null>(null);
  const [insightCluster, setInsightCluster] = useState<InsightClusterApi | null>(null);
  const [serendipityHint, setSerendipityHint] = useState<string | null>(null);
  const [selectedIslandId, setSelectedIslandId] = useState(presetIslandModules[0].id);
  const [builderSourceId, setBuilderSourceId] = useState<string | null>(null);
  const [inboxItems, setInboxItems] = useState<InboxItem[]>(isDemoModeEnabled() ? initialInboxItems : []);
  const [selectedInboxItemId, setSelectedInboxItemId] = useState<string>(isDemoModeEnabled() ? initialInboxItems[0]?.id ?? "" : "");
  const [selectedConnectionIndex, setSelectedConnectionIndex] = useState(0);

  const pollTimerRef = useRef<number | null>(null);
  const triviaTimerRef = useRef<number | null>(null);
  const serendipityTimerRef = useRef<number | null>(null);
  const deliveredPushIdsRef = useRef<Set<string>>(new Set());

  const isDemoMode = useMemo(() => isDemoModeEnabled(), []);

  useEffect(() => {
    contentScrollRef.current?.scrollTo({ top: 0 });
  }, [activePanel, selectedIslandId, builderSourceId]);

  const effectiveActiveConversationId = useMemo(() => {
    if (!conversations.length) {
      return "";
    }
    if (activeConversationId && conversations.some((c) => c.id === activeConversationId)) {
      return activeConversationId;
    }
    return conversations[0].id;
  }, [activeConversationId, conversations]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === effectiveActiveConversationId) ?? conversations[0],
    [conversations, effectiveActiveConversationId]
  );

  const enabledTakeaways = useMemo(() => takeaways.filter((t) => t.enabled), [takeaways]);
  const liveDraftTakeaways = useMemo(() => takeaways.filter((item) => !item.persisted), [takeaways]);
  const liveDraftCount = liveDraftTakeaways.length;
  const builderTakeaways = builderSourceId ? takeaways.filter((item) => item.podcastId === builderSourceId) : takeaways;
  const builderDraftCount = builderTakeaways.filter((item) => !item.persisted).length;
  const builderSelectedDraftCount = builderTakeaways.filter((item) => !item.persisted && item.enabled).length;
  const builderSavedCount = builderTakeaways.filter((item) => item.persisted).length;

  const upsertConversation = (conversationId: string, mutator: (conversation: Conversation) => Conversation) => {
    setConversations((prev) => prev.map((c) => (c.id === conversationId ? mutator(c) : c)));
  };

  const appendMessage = (conversationId: string, message: ChatMessage) => {
    upsertConversation(conversationId, (c) => {
      const nextMessages = [...c.messages, message];
      return {
        ...c,
        messages: nextMessages,
        messageCount: nextMessages.length,
        updatedAt: Date.now()
      };
    });
  };

  const ensurePodcast = (podcast: PodcastAsset) => {
    setPodcasts((prev) => {
      const idx = prev.findIndex((p) => p.id === podcast.id);
      if (idx === -1) {
        return [podcast, ...prev];
      }
      const next = [...prev];
      next[idx] = { ...next[idx], ...podcast };
      return next;
    });
  };

  const applyConversationDetail = (conversationId: string, summary: ConversationSummaryApi, messages: ConversationMessageApi[]) => {
    setConversations((prev) => {
      const existing = prev.find((c) => c.id === conversationId);
      const nextMessages = messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: parseIsoToMillis(msg.created_at)
      }));

      const nextConversation: Conversation = {
        id: summary.id,
        title: summary.title,
        messages: nextMessages,
        messageCount: summary.message_count,
        podcastIds: existing?.podcastIds ?? [],
        createdAt: parseIsoToMillis(summary.created_at),
        updatedAt: parseIsoToMillis(summary.updated_at)
      };

      if (!existing) {
        return [nextConversation, ...prev];
      }

      return prev.map((c) => (c.id === conversationId ? nextConversation : c));
    });
  };

  const loadConversationDetail = async (conversationId: string) => {
    if (isDemoMode) {
      return;
    }
    const detail = await apiGetConversation(conversationId);
    applyConversationDetail(conversationId, detail.conversation, detail.messages);
  };

  const refreshBrainItems = async () => {
    if (isDemoMode) {
      return;
    }

    const payload = await apiListBrainItems();

    const savedItems: TakeawayItem[] = payload.items.map((item) => ({
      id: `saved-${item.id}`,
      itemId: item.id,
      taskId: item.task_id,
      podcastId: podcastIdForTask(item.task_id),
      podcastTitle: item.podcast_title,
      podcastUrl: item.podcast_url,
      text: item.text,
      enabled: item.enabled,
      persisted: true
    }));

    setTakeaways((prev) => {
      const drafts = prev.filter((t) => !t.persisted);
      return [...savedItems, ...drafts];
    });

    for (const item of payload.items) {
      ensurePodcast({
        id: podcastIdForTask(item.task_id),
        title: item.podcast_title,
        url: item.podcast_url,
        sourceLabel: "Saved to Inspiration memory",
        taskId: item.task_id,
        createdAt: parseIsoToMillis(item.created_at)
      });
    }
  };

  const refreshInsightCluster = async (triggerGeneration = false) => {
    if (isDemoMode) {
      return;
    }

    try {
      if (triggerGeneration) {
        await apiAutoCluster(localIsoDate());
      }
      const latest = await apiGetLatestInsight();
      setInsightCluster(latest);
    } catch {
      setInsightCluster(null);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setBootstrapping(true);
      setHint(null);

      if (isDemoMode) {
        const seed = createDemoWorkspaceSeed();
        setConversations(seed.conversations);
        setActiveConversationId(seed.activeConversationId);
        setPodcasts(seed.podcasts);
        setTakeaways(seed.takeaways);
        setInboxItems(seed.inboxItems);
        setSelectedInboxItemId(seed.selectedInboxItemId);
        setInsightCluster(seed.insightCluster);
        setBootstrapping(false);
        return;
      }

      try {
        const listPayload = await apiListConversations();
        let summaries = listPayload.conversations;

        if (!summaries.length) {
          const created = await apiCreateConversation("New Chat");
          summaries = [created.conversation];
        }

        setConversations(summaries.map(summaryToConversation));
        const nextActive = summaries[0].id;
        setActiveConversationId(nextActive);

        await Promise.all([loadConversationDetail(nextActive), refreshBrainItems(), refreshInsightCluster(true)]);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to initialize workspace.";
        setHint(message);
      } finally {
        setBootstrapping(false);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored =
      window.sessionStorage.getItem("inspiration:openai-key") ??
      window.sessionStorage.getItem("podbrain:openai-key") ??
      "";
    setOpenaiApiKey(stored);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (openaiApiKey.trim()) {
      window.sessionStorage.setItem("inspiration:openai-key", openaiApiKey);
      return;
    }

    window.sessionStorage.removeItem("inspiration:openai-key");
  }, [openaiApiKey]);

  useEffect(() => {
    const source = messageInput.trim();
    if (serendipityTimerRef.current) {
      window.clearTimeout(serendipityTimerRef.current);
      serendipityTimerRef.current = null;
    }

    if (!source || source.length < 18) {
      setSerendipityHint(null);
      return;
    }

    const localHint = createLocalSerendipityHint(source, enabledTakeaways);
    if (isDemoMode) {
      setSerendipityHint(localHint);
      return;
    }

    serendipityTimerRef.current = window.setTimeout(() => {
      void apiSerendipityHint(source, activeConversation?.id)
        .then((payload) => {
          setSerendipityHint(payload.hint || localHint);
        })
        .catch(() => {
          setSerendipityHint(localHint);
        });
    }, 650);

    return () => {
      if (serendipityTimerRef.current) {
        window.clearTimeout(serendipityTimerRef.current);
        serendipityTimerRef.current = null;
      }
    };
  }, [activeConversation?.id, enabledTakeaways, isDemoMode, messageInput]);

  useEffect(() => {
    const source = messageInput.trim();
    if (source.length < 18) {
      return;
    }

    const presetPush = createPresetSerendipityInboxItem(source);
    const nextPush: InboxItem | null =
      presetPush ??
      (serendipityHint
        ? {
            id: "push-llm-match",
            kind: "push",
            title: "A memory fragment wants your attention",
            summary: serendipityHint,
            createdAtLabel: "New push",
            unread: true,
            relatedIsland: "LLM Models",
            suggestion: serendipityHint,
            evidence: [
              "AI: retrieval quality depends on curated and ranked sources.",
              "AI: model changes should be tested against visible user failures."
            ]
          }
        : null);

    if (!nextPush || deliveredPushIdsRef.current.has(nextPush.id)) {
      return;
    }

    deliveredPushIdsRef.current.add(nextPush.id);
    setInboxItems((prev) => [nextPush, ...prev]);
    setSelectedInboxItemId(nextPush.id);
  }, [messageInput, serendipityHint]);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
      }
      if (triviaTimerRef.current) {
        window.clearInterval(triviaTimerRef.current);
      }
      if (serendipityTimerRef.current) {
        window.clearInterval(serendipityTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!dragPane) {
      return;
    }

    const handleWidth = 12;
    const minCenterWidth = 560;
    const minLeftWidth = 240;
    const maxLeftWidth = 420;
    const minRightWidth = 380;
    const maxRightWidth = 700;

    const handleMove = (event: MouseEvent) => {
      const layout = layoutRef.current;
      if (!layout) {
        return;
      }

      const rect = layout.getBoundingClientRect();
      if (dragPane === "left") {
        const dynamicMax = Math.max(minLeftWidth, rect.width - rightPaneWidth - handleWidth * 2 - minCenterWidth);
        setLeftPaneWidth(clamp(event.clientX - rect.left, minLeftWidth, Math.min(maxLeftWidth, dynamicMax)));
        return;
      }

      const proposedRight = rect.right - event.clientX;
      const dynamicMax = Math.max(minRightWidth, rect.width - leftPaneWidth - handleWidth * 2 - minCenterWidth);
      setRightPaneWidth(clamp(proposedRight, minRightWidth, Math.min(maxRightWidth, dynamicMax)));
    };

    const handleUp = () => {
      setDragPane(null);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [dragPane, leftPaneWidth, rightPaneWidth]);

  const createNewChat = async () => {
    if (isDemoMode) {
      const next = makeLocalConversation();
      setConversations((prev) => [next, ...prev]);
      setActiveConversationId(next.id);
      setActivePanel("chat");
      setHint(null);
      return;
    }

    try {
      const payload = await apiCreateConversation("New Chat");
      const next = summaryToConversation(payload.conversation);
      setConversations((prev) => [next, ...prev]);
      setActiveConversationId(next.id);
      setActivePanel("chat");
      setHint(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create conversation.";
      setHint(message);
    }
  };

  const applyLoaderTrivia = async (seed: string, conversationId?: string) => {
    const fallback = createFallbackTrivia(seed);
    setParseState((prev) => ({
      ...prev,
      domain: fallback.domain,
      trivia: fallback.trivia,
      triviaIndex: 0
    }));

    try {
      const payload = await apiGetLoaderTrivia(conversationId);
      const nextTrivia = payload.trivia?.filter((item) => item.trim()) ?? [];
      if (!nextTrivia.length) {
        return;
      }
      setParseState((prev) => ({
        ...prev,
        domain: payload.domain?.trim() || prev.domain,
        trivia: nextTrivia,
        triviaIndex: 0
      }));
    } catch {
      // Frontend falls back to local trivia until the mock backend endpoint lands.
    }
  };

  const beginTriviaRotation = () => {
    if (triviaTimerRef.current) {
      window.clearInterval(triviaTimerRef.current);
    }
    triviaTimerRef.current = window.setInterval(() => {
      setParseState((prev) => {
        const total = prev.trivia.length || 1;
        return { ...prev, triviaIndex: (prev.triviaIndex + 1) % total };
      });
    }, 3600);
  };

  const clearParseTimers = () => {
    if (triviaTimerRef.current) {
      window.clearInterval(triviaTimerRef.current);
      triviaTimerRef.current = null;
    }
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const finishParse = () => {
    clearParseTimers();
    setParseState({
      running: false,
      conversationId: null,
      stageIndex: 0,
      triviaIndex: 0,
      taskId: null,
      trivia: loaderTriviaByDomain.Podcast,
      domain: "Podcast",
      modeLabel: "Media link intake"
    });
  };

  const addAttachmentList = (files: File[]) => {
    if (!files.length) {
      return;
    }

    setAttachments((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: makeId("asset"),
        name: file.name,
        kind: (file.type.startsWith("image/") ? "image" : "file") as InputAttachment["kind"]
      }))
    ]);
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== attachmentId));
  };

  const onInputPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const imageFiles = Array.from(event.clipboardData.files);
    if (imageFiles.length) {
      addAttachmentList(imageFiles);
    }
  };

  const onFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    addAttachmentList(files);
    event.target.value = "";
  };

  const handleTaskCompleted = async (task: TaskStatusApi, conversationId: string, inputUrl: string) => {
    const taskId = task.task_id;
    const podcastId = podcastIdForTask(taskId);
    const title = (task.title || "").trim() || derivePodcastTitle(inputUrl);
    const url = (task.audio_url || "").trim() || inputUrl.trim();

    ensurePodcast({
      id: podcastId,
      taskId,
      title,
      url,
      sourceLabel: "Parsed from backend",
      createdAt: Date.now()
    });

    upsertConversation(conversationId, (c) => ({
      ...c,
      podcastIds: c.podcastIds.includes(podcastId) ? c.podcastIds : [podcastId, ...c.podcastIds],
      updatedAt: Date.now()
    }));

    const incomingTakeaways = (task.takeaways ?? []).map((text, index) => ({
      id: `draft-${taskId}-${index}`,
      podcastId,
      podcastTitle: title,
      podcastUrl: url,
      text,
      enabled: true,
      taskId,
      persisted: false
    }));

    setTakeaways((prev) => {
      const withoutOldDrafts = prev.filter((item) => !(item.taskId === taskId && !item.persisted));
      return [...incomingTakeaways, ...withoutOldDrafts];
    });

    try {
      await loadConversationDetail(conversationId);
    } catch {
      appendMessage(conversationId, {
        id: makeId("msg"),
        role: "assistant",
        content: `Source ready: ${title}. Review the extracted ideas in Curate memory.`,
        createdAt: Date.now()
      });
    }

    setMessageInput("");
    setAttachments([]);
    setHint("Source ready. Review the extracted ideas in Curate memory.");
    await refreshInsightCluster(true);
  };

  const pollTaskUntilDone = (taskId: string, conversationId: string, inputUrl: string) => {
    const poll = async () => {
      try {
        const task = await apiGetTask(taskId);
        setParseState((prev) => ({
          ...prev,
          taskId,
          stageIndex: stageIndexForTaskStatus(task.status)
        }));

        if (task.status === "completed") {
          await handleTaskCompleted(task, conversationId, inputUrl);
          finishParse();
          return;
        }

        if (task.status === "failed") {
          setHint(task.error || "Parsing failed. Please try another audio URL.");
          finishParse();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Task polling failed.";
        setHint(message);
        finishParse();
      }
    };

    poll();
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current);
    }
    pollTimerRef.current = window.setInterval(poll, 2500);
  };

  const startParseAudio = async () => {
    const targetConversation = activeConversation;
    const rawInput = messageInput.trim();
    const rawUrl = extractUrls(rawInput)[0] ?? "";
    const key = openaiApiKey.trim();
    const modeLabel = describeInputMode(rawInput, attachments);
    const shouldUseLegacyPodcastPipeline =
      !attachments.length &&
      !!rawUrl &&
      (rawInput === rawUrl || rawInput.replace(/\s+/g, " ").trim() === rawUrl);

    if (!targetConversation) {
      setHint("Create a conversation first.");
      return;
    }
    if (!rawInput && !attachments.length) {
      setHint("Paste text, an image, or a media link to begin.");
      return;
    }
    if (!isDemoMode && shouldUseLegacyPodcastPipeline && !key) {
      setHint("OpenAI API key is required for parsing.");
      return;
    }
    if (parseState.running) {
      return;
    }

    setHint(null);
    setParseState({
      running: true,
      conversationId: targetConversation.id,
      stageIndex: 0,
      triviaIndex: 0,
      taskId: null,
      trivia: loaderTriviaByDomain.Podcast,
      domain: "Podcast",
      modeLabel
    });
    void applyLoaderTrivia(
      `${rawInput} ${enabledTakeaways.map((item) => item.text).join(" ")} ${attachments.map((item) => item.name).join(" ")}`,
      targetConversation.id
    );
    beginTriviaRotation();

    if (isDemoMode) {
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
      }

      let steps = 0;
      pollTimerRef.current = window.setInterval(() => {
        steps += 1;

        setParseState((prev) => ({
          ...prev,
          stageIndex: Math.min(prev.stageIndex + 1, parseStages.length - 1)
        }));

        if (steps >= parseStages.length) {
          clearParseTimers();

          const podcastId = makeId("pod");
          const title = makeMockTitle(rawInput, attachments);
          const sourceUrl = rawUrl || `mock://${modeLabel.toLowerCase().replace(/\s+/g, "-")}`;
          const podcast: PodcastAsset = {
            id: podcastId,
            title,
            url: sourceUrl,
            sourceLabel: isDemoMode ? "Demo parser" : "Frontend mock parser",
            createdAt: Date.now()
          };

          ensurePodcast(podcast);

          const drafts: TakeawayItem[] = mockTakeawaysFromInput(rawInput, attachments).map((text) => ({
            id: makeId("tk"),
            podcastId,
            podcastTitle: title,
            podcastUrl: sourceUrl,
            text,
            enabled: true,
            persisted: false
          }));

          setTakeaways((prev) => [...drafts, ...prev]);
          upsertConversation(targetConversation.id, (c) => ({
            ...c,
            podcastIds: c.podcastIds.includes(podcastId) ? c.podcastIds : [podcastId, ...c.podcastIds],
            updatedAt: Date.now()
          }));

          appendMessage(targetConversation.id, {
            id: makeId("msg"),
            role: "assistant",
            content: `${isDemoMode ? "Demo" : "Mock"} source ready: ${title}. Review the extracted ideas in Curate memory.`,
            createdAt: Date.now()
          });

          setMessageInput("");
          setAttachments([]);
          setHint(
            isDemoMode
              ? "Demo source ready. Review the extracted ideas in Curate memory."
              : "Frontend mock parse completed. Backend media parser will replace this in the next step."
          );
          void refreshInsightCluster(true);
          finishParse();
        }
      }, 1700);
      return;
    }

    try {
      const payload = shouldUseLegacyPodcastPipeline
        ? await apiCreateProcess(rawUrl, key, targetConversation.id)
        : await apiParseMedia(
            rawInput || attachments.map((item) => item.name).join(", "),
            rawUrl || null,
            modeLabel.toLowerCase().replace(/\s+/g, "_"),
            targetConversation.id
          );
      setParseState((prev) => ({ ...prev, taskId: payload.task_id }));
      pollTaskUntilDone(payload.task_id, targetConversation.id, rawUrl || rawInput || modeLabel);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start parse task.";
      setHint(message);
      finishParse();
    }
  };

  const sendMessage = async () => {
    if (!activeConversation) {
      return;
    }

    const question = messageInput.trim();
    const key = openaiApiKey.trim();
    if (!question) {
      return;
    }
    if (!isDemoMode && !key) {
      setHint("OpenAI API key is required for chat.");
      return;
    }

    setHint(null);
    const convId = activeConversation.id;

    appendMessage(convId, {
      id: makeId("msg"),
      role: "user",
      content: question,
      createdAt: Date.now()
    });

    setMessageInput("");
    setChatBusy(true);

    if (isDemoMode) {
      window.setTimeout(() => {
        const result = demoChatAnswer(question, enabledTakeaways.map((t) => t.text));
        appendMessage(convId, {
          id: makeId("msg"),
          role: "assistant",
          content: result.answer,
          contexts: result.contexts,
          createdAt: Date.now()
        });
        setChatBusy(false);
      }, 650);
      return;
    }

    try {
      const result = await apiChat(question, convId, key);
      appendMessage(convId, {
        id: makeId("msg"),
        role: "assistant",
        content: result.answer,
        contexts: result.contexts,
        createdAt: Date.now()
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Chat failed.";
      appendMessage(convId, {
        id: makeId("msg"),
        role: "assistant",
        content: message,
        createdAt: Date.now()
      });
    } finally {
      setChatBusy(false);
    }
  };

  const saveSelectedToBrain = async (sourceId: string | null = null) => {
    const key = openaiApiKey.trim();
    if (!isDemoMode && !key) {
      setHint("OpenAI API key is required to save selected takeaways.");
      return;
    }

    const selectedDrafts = takeaways.filter((item) => item.enabled && !item.persisted && (!sourceId || item.podcastId === sourceId));
    if (!selectedDrafts.length) {
      setHint("No selected draft takeaways to save.");
      return;
    }

    if (isDemoMode) {
      const ids = new Set(selectedDrafts.map((item) => item.id));
      setTakeaways((prev) =>
        prev.map((item) => {
          if (!ids.has(item.id)) {
            return item;
          }
          return {
            ...item,
            persisted: true,
            itemId: item.itemId ?? `demo-${item.id}`
          };
        })
      );
      setHint(`Demo saved ${selectedDrafts.length} takeaway(s) to local memory.`);
      return;
    }

    const byTask = new Map<string, string[]>();
    for (const item of selectedDrafts) {
      if (!item.taskId) {
        continue;
      }
      const bucket = byTask.get(item.taskId) ?? [];
      bucket.push(item.text);
      byTask.set(item.taskId, bucket);
    }

    if (!byTask.size) {
      setHint("Selected drafts have no valid task mapping.");
      return;
    }

    setSavingBrain(true);
    setHint(null);

    try {
      for (const [taskId, texts] of byTask.entries()) {
        await apiSaveBrain(taskId, texts, key);
      }

      const selectedIds = new Set(selectedDrafts.map((item) => item.id));
      setTakeaways((prev) => prev.filter((item) => !selectedIds.has(item.id)));

      await refreshBrainItems();
      setHint(`Saved ${selectedDrafts.length} takeaway(s) to Inspiration memory.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save selected takeaways.";
      setHint(message);
    } finally {
      setSavingBrain(false);
    }
  };

  const toggleTakeawayEnabled = async (takeawayId: string) => {
    const target = takeaways.find((item) => item.id === takeawayId);
    if (!target) {
      return;
    }

    const nextEnabled = !target.enabled;
    setTakeaways((prev) => prev.map((item) => (item.id === takeawayId ? { ...item, enabled: nextEnabled } : item)));

    if (isDemoMode || !target.persisted || !target.itemId) {
      return;
    }

    try {
      await apiUpdateBrainItem(target.itemId, nextEnabled);
    } catch (error) {
      setTakeaways((prev) => prev.map((item) => (item.id === takeawayId ? { ...item, enabled: !nextEnabled } : item)));
      const message = error instanceof Error ? error.message : "Failed to update takeaway toggle.";
      setHint(message);
    }
  };

  const deleteTakeaway = async (takeawayId: string) => {
    const target = takeaways.find((item) => item.id === takeawayId);
    if (!target) {
      return;
    }

    setTakeaways((prev) => prev.filter((item) => item.id !== takeawayId));

    if (isDemoMode || !target.persisted || !target.itemId) {
      return;
    }

    try {
      await apiDeleteBrainItem(target.itemId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete takeaway.";
      setHint(message);
      await refreshBrainItems();
    }
  };

  const deletePodcast = async (podcastId: string) => {
    const related = takeaways.filter((item) => item.podcastId === podcastId);
    const persistedIds = related.filter((item) => item.persisted && item.itemId).map((item) => item.itemId as string);

    setPodcasts((prev) => prev.filter((podcast) => podcast.id !== podcastId));
    setTakeaways((prev) => prev.filter((item) => item.podcastId !== podcastId));
    setConversations((prev) =>
      prev.map((conversation) => ({
        ...conversation,
        podcastIds: conversation.podcastIds.filter((id) => id !== podcastId),
        updatedAt: Date.now()
      }))
    );

    if (isDemoMode || !persistedIds.length) {
      return;
    }

    const results = await Promise.allSettled(persistedIds.map((itemId) => apiDeleteBrainItem(itemId)));
    if (results.some((result) => result.status === "rejected")) {
      setHint("Some saved items failed to delete. Synced the latest memory items.");
      await refreshBrainItems();
    }
  };

  const setAllDraftTakeawaysEnabled = (enabled: boolean, sourceId: string | null = null) => {
    setTakeaways((prev) => prev.map((item) => (item.persisted || (sourceId && item.podcastId !== sourceId) ? item : { ...item, enabled })));
  };

  const conversationList = useMemo(() => [...conversations].sort((a, b) => b.updatedAt - a.updatedAt), [conversations]);

  const groupedTakeaways = useMemo(() => {
    return podcasts
      .map((podcast) => ({
        podcast,
        items: takeaways.filter((item) => item.podcastId === podcast.id)
      }))
      .filter((group) => group.items.length > 0);
  }, [podcasts, takeaways]);

  const podcastById = useMemo(() => {
    const map = new Map<string, PodcastAsset>();
    for (const podcast of podcasts) {
      map.set(podcast.id, podcast);
    }
    return map;
  }, [podcasts]);

  const unreadInboxCount = useMemo(() => inboxItems.filter((item) => item.unread).length, [inboxItems]);
  const selectedInboxItem = useMemo(
    () => inboxItems.find((item) => item.id === selectedInboxItemId) ?? inboxItems[0] ?? null,
    [inboxItems, selectedInboxItemId]
  );

  const openInboxItem = (itemId: string) => {
    setSelectedInboxItemId(itemId);
    setInboxItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, unread: false } : item)));
  };

  const markAllInboxItemsRead = () => {
    setInboxItems((prev) => prev.map((item) => ({ ...item, unread: false })));
  };

  const presetMainIsland = presetIslandModules[0];
  const selectedIsland = presetIslandModules.find((item) => item.id === selectedIslandId) ?? presetMainIsland;
  const selectedIslandTakeaways = takeaways.filter(
    (item) =>
      item.persisted &&
      item.enabled &&
      (item.domain ?? podcastById.get(item.podcastId)?.domain) === selectedIsland.domain &&
      matchesTopicKeywords(item.text, selectedIsland.keywords)
  );
  const selectedIslandSourceIds = new Set(selectedIslandTakeaways.map((item) => item.podcastId));
  const selectedIslandSources = podcasts.filter((podcast) => selectedIslandSourceIds.has(podcast.id));
  const selectedIslandConversations = conversations.filter((conversation) =>
    conversation.podcastIds.some((podcastId) => selectedIslandSourceIds.has(podcastId))
  );
  const topicsWithEvidence = presetIslandModules.filter((topic) =>
    takeaways.some((item) =>
      item.persisted && item.enabled &&
      (item.domain ?? podcastById.get(item.podcastId)?.domain) === topic.domain &&
      matchesTopicKeywords(item.text, topic.keywords)
    )
  );
  const visibleTopicIds = new Set(topicsWithEvidence.map((topic) => topic.id));
  const visibleMapNodes = presetKnowledgeGraph.nodes.filter((node) => visibleTopicIds.has(node.id));
  const visibleMapEdges = isDemoMode
    ? presetKnowledgeGraph.edges.filter((edge) => visibleTopicIds.has(edge.from) && visibleTopicIds.has(edge.to))
    : [];
  const selectedConnection = visibleMapEdges[selectedConnectionIndex] ?? visibleMapEdges[0] ?? null;
  const openIsland = (label: string) => {
    const island = presetIslandModules.find((item) => item.label === label);
    if (!island) {
      return;
    }
    setSelectedIslandId(island.id);
    setActivePanel("island");
  };
  const openConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setActivePanel("chat");
    void loadConversationDetail(conversationId);
  };
  const visibleTakeawayGroups = builderSourceId
    ? groupedTakeaways.filter((group) => group.podcast.id === builderSourceId)
    : groupedTakeaways;

  const getConversationTitle = (conversation: Conversation): string => {
    if (conversation.title && conversation.title.trim() && conversation.title !== "New Chat") {
      return summarizeTextTitle(conversation.title);
    }

    const firstUser = conversation.messages.find((message) => message.role === "user" && message.content.trim());
    if (firstUser) {
      return summarizeTextTitle(firstUser.content);
    }

    const latestPodcastId = conversation.podcastIds[0];
    if (latestPodcastId) {
      const podcast = podcastById.get(latestPodcastId);
      if (podcast) {
        return summarizeTextTitle(podcast.title);
      }
    }

    return "New Chat";
  };

  return (
    <main className="workspace-shell h-screen overflow-hidden bg-[#f1f5f3] px-4 py-4 text-slate-900 md:px-6">
      <div
        ref={layoutRef}
        data-panel={activePanel}
        className="workspace-grid mx-auto grid h-full w-full max-w-[1720px] items-stretch gap-0"
        style={{ gridTemplateColumns: activePanel === "inbox" ? `${leftPaneWidth}px 12px minmax(0,1fr)` : `${leftPaneWidth}px 12px minmax(0,1fr) 12px ${rightPaneWidth}px` }}
      >
        <aside className="workspace-sidebar flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-[#dce5e8] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
          <div className="border-b border-[#dce5e8] px-4 py-5">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#dce5e8] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#58787c]">
              <Sparkles className="h-3.5 w-3.5" />
              Inspiration
            </p>
            <div className="workspace-sidebar-actions grid gap-2">
              <button
                onClick={() => void createNewChat()}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#dce5e8] bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-[#edf4f3]"
              >
                <CirclePlus className="h-4 w-4" />
                New chat
              </button>
              <button
                onClick={() => {
                  setBuilderSourceId(null);
                  setActivePanel("builder");
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#246b70,#3b8482)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
              >
                <Brain className="h-4 w-4" />
                Memory {liveDraftCount > 0 ? <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{liveDraftCount}</span> : null}
              </button>
              <button
                onClick={() => openIsland(presetMainIsland.label)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#dce5e8] bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-[#edf4f3]"
              >
                <Sparkles className="h-4 w-4" />
                Topics
              </button>
            </div>
          </div>

          <div className="workspace-conversations min-h-0 flex-1 overflow-y-auto px-3 py-4">
            <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Conversations</p>
            <div className="workspace-conversation-list space-y-1.5">
              {conversationList.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => {
                    openConversation(conversation.id);
                  }}
                  className={`w-full rounded-[18px] border px-3 py-3 text-left text-sm transition ${
                    conversation.id === effectiveActiveConversationId
                      ? "border-[#6ba5ff]/40 bg-[#e5edf8] text-[#315f69]"
                      : "border-transparent bg-transparent text-slate-600 hover:border-[#dce5e8] hover:bg-white"
                  }`}
                >
                  <p className="line-clamp-1 font-medium">{getConversationTitle(conversation)}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{conversation.messageCount} messages</p>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="workspace-left-resizer group flex h-full items-center justify-center">
          <button
            type="button"
            aria-label="Resize left and center panels"
            onMouseDown={() => setDragPane("left")}
            className="relative h-full w-full cursor-col-resize"
          >
            <span className="absolute left-1/2 top-1/2 h-24 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white transition group-hover:bg-[#6ba5ff]/60" />
          </button>
        </div>

        <section className="workspace-main mx-1 flex h-full min-h-0 flex-col overflow-hidden rounded-[30px] border border-[#dce5e8] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
          <div className="border-b border-[#dce5e8] px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl text-slate-900 md:text-[2rem]" style={{ fontFamily: "var(--font-heading)" }}>
                    {activePanel === "builder" ? "Memory" : activePanel === "inbox" ? "Inbox" : activePanel === "island" ? selectedIsland.label : "Chat"}
                  </h1>
                  {isDemoMode ? <span className="rounded-full border border-[#6ba5ff]/30 bg-[#e5edf8] px-2.5 py-1 text-[11px] font-semibold text-[#315f69]">Demo</span> : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activePanel !== "inbox" ? (
                  <button
                    onClick={() => {
                      setActivePanel("inbox");
                      if (selectedInboxItem) {
                        openInboxItem(selectedInboxItem.id);
                      }
                    }}
                    className="relative inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#204169,#315f96)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
                  >
                    <Bell className="h-4 w-4" />
                    Inbox
                    {unreadInboxCount > 0 ? (
                      <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#df4b57] px-1 text-[10px] font-bold text-white">
                        {unreadInboxCount}
                      </span>
                    ) : null}
                  </button>
                ) : null}
                {activePanel === "inbox" ? (
                  <button
                    onClick={() => markAllInboxItemsRead()}
                    disabled={unreadInboxCount === 0}
                    className="rounded-full border border-[#dce5e8] bg-white px-3 py-2 text-xs text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Mark all read
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div ref={contentScrollRef} className="night-scroll min-h-0 flex-1 overflow-y-auto px-5 py-6 md:px-7">
            {activePanel === "inbox" ? (
              <div className="mx-auto w-full max-w-[1220px] space-y-4">
                <section className="rounded-[24px] border border-[#dce5e8] bg-white p-5 md:p-7">
                  <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                    <div className="space-y-2" aria-label="Inbox updates">
                      {!inboxItems.length ? <p className="rounded-[18px] bg-[#f3f8f6] px-4 py-5 text-sm text-slate-600">No updates yet.</p> : null}
                      {inboxItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => openInboxItem(item.id)}
                          className={`w-full rounded-[20px] border px-4 py-3 text-left transition ${
                            selectedInboxItem?.id === item.id
                              ? "border-[#6ba5ff]/30 bg-[#e8f0f5]"
                              : "border-[#dce5e8] bg-white hover:bg-[#f3f8f6]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#487881]">
                                {item.kind === "graph" ? "Map" : "Connection"}
                              </p>
                              <p className="mt-2 text-sm font-semibold text-slate-900">{item.title}</p>
                              <p className="mt-1 text-xs text-slate-500">{item.createdAtLabel}</p>
                            </div>
                            {item.unread ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#df4b57]" /> : null}
                          </div>
                        </button>
                      ))}
                    </div>

                    {selectedInboxItem ? (
                      selectedInboxItem.kind === "graph" ? (
                        <article className="min-w-0 rounded-[22px] border border-[#dce5e8] bg-[#fbfdfc] p-5 md:p-7">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#487881]">Topics</p>
                              <h3 className="mt-2 text-xl text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>
                                {selectedInboxItem.graph.title}
                              </h3>
                            </div>
                            <span className="rounded-full bg-white px-3 py-1 text-[11px] text-slate-700">Updated 20:00</span>
                          </div>
                          <p className="mt-3 text-sm leading-relaxed text-slate-600">{selectedInboxItem.graph.summary}</p>

                          <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            {selectedInboxItem.graph.nodes.map((node) => (
                              <button key={node.id} onClick={() => openIsland(node.label)} className="rounded-[18px] border border-[#dce5e8] bg-white px-4 py-4 text-left transition hover:border-[#9ec4ff]/45 hover:bg-[#e5edf8]">
                                <span className="block text-sm font-semibold text-slate-900">{node.label}</span>
                                <span className="mt-2 block text-xs text-[#487881]">Open saved ideas →</span>
                              </button>
                            ))}
                          </div>
                          <div className="mt-5 space-y-2">
                            {selectedInboxItem.graph.edges.map((edge) => (
                              <div key={`${edge.from}-${edge.to}`} className="flex flex-wrap items-center justify-between gap-2 border-b border-[#dce5e8] py-2 text-sm">
                                <span>{selectedInboxItem.graph.nodes.find((node) => node.id === edge.from)?.label} ↔ {selectedInboxItem.graph.nodes.find((node) => node.id === edge.to)?.label}</span>
                                <span className="text-xs font-semibold uppercase text-[#487881]">{edge.strength}</span>
                              </div>
                            ))}
                          </div>
                        </article>
                      ) : (
                        <article className="min-w-0 rounded-[22px] border border-[#dce5e8] bg-[#fbfdfc] p-5 md:p-7">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#487881]">Connection</p>
                          <h3 className="mt-2 text-xl text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>
                            {selectedInboxItem.title}
                          </h3>
                          <p className="mt-3 text-base leading-relaxed text-slate-700">{selectedInboxItem.suggestion}</p>
                          <p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-[#487881]">Evidence</p>
                          <div className="mt-3 space-y-3">
                            {selectedInboxItem.evidence.map((item) => (
                              <div key={item} className="rounded-[16px] border-l-[3px] border-[#88bcb3] bg-[#edf6f3] px-4 py-3 text-sm leading-relaxed text-slate-700">
                                {item}
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <button
                              onClick={() => openIsland(selectedInboxItem.relatedIsland)}
                              className="rounded-full bg-[linear-gradient(135deg,#204169,#315f96)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
                            >
                              Open {selectedInboxItem.relatedIsland} →
                            </button>
                          </div>
                        </article>
                      )
                    ) : null}
                  </div>
                </section>
              </div>
            ) : activePanel === "builder" ? (
              <div className="space-y-4">

                {builderSourceId ? (
                  <button
                    onClick={() => setBuilderSourceId(null)}
                    className="rounded-full border border-[#6ba5ff]/28 bg-[#e8f0f5] px-4 py-2 text-sm text-[#315f69] transition hover:bg-[#dbe8ed]"
                  >
                    ← All saved sources
                  </button>
                ) : null}

                <section className="rounded-[24px] border border-[#dce5e8] bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Ideas</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {builderDraftCount
                          ? `${builderSelectedDraftCount} selected · ${builderSavedCount} saved`
                          : builderSavedCount
                            ? `${builderSavedCount} saved`
                            : "No ideas yet"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setAllDraftTakeawaysEnabled(true, builderSourceId)}
                        disabled={builderDraftCount === 0}
                        className="rounded-full border border-[#dce5e8] bg-white px-3 py-1.5 text-xs text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        Select all
                      </button>
                      <button
                        onClick={() => setAllDraftTakeawaysEnabled(false, builderSourceId)}
                        disabled={builderDraftCount === 0}
                        className="rounded-full border border-[#dce5e8] bg-white px-3 py-1.5 text-xs text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => void saveSelectedToBrain(builderSourceId)}
                        disabled={savingBrain || builderSelectedDraftCount === 0}
                        className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#204169,#315f96)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingBrain ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                        Save selected
                      </button>
                    </div>
                  </div>

                  {!visibleTakeawayGroups.length ? (
                    <div className="mt-4 rounded-[18px] bg-white px-4 py-4 text-sm text-slate-500">
                      No live takeaways yet. Paste a link or note in the input area and run parse to populate this panel.
                    </div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {visibleTakeawayGroups.map(({ podcast, items }) => (
                        <article key={podcast.id} className="rounded-[22px] border border-[#dce5e8] bg-white p-4">
                          <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{podcast.title}</p>
                              <p className="mt-1 text-xs text-[#487881]">{podcast.sourceLabel}</p>
                              <p className="mt-1 line-clamp-1 text-xs text-slate-500">{podcast.url}</p>
                            </div>
                            <button
                              onClick={() => void deletePodcast(podcast.id)}
                              className="inline-flex items-center gap-1 rounded-full border border-[#b23a2d]/20 bg-[#f8ebe7] px-3 py-1.5 text-[11px] font-semibold text-[#934239]"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete source
                            </button>
                          </div>

                          <div className="space-y-2">
                            {items.map((item) => (
                              <div key={item.id} className="flex items-start gap-3 rounded-[20px] border border-[#dce5e8] bg-white px-3 py-3">
                                <input
                                  type="checkbox"
                                  checked={item.enabled}
                                  onChange={() => {
                                    void toggleTakeawayEnabled(item.id);
                                  }}
                                  className="mt-1 h-4 w-4 rounded border-ink/30 text-teal focus:ring-teal"
                                />
                                <div className="flex-1">
                                  <div className="mb-2 flex items-center gap-2">
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                                        item.persisted
                                          ? "bg-emerald-500/16 text-emerald-200"
                                          : "bg-[#e5edf8] text-[#315f69]"
                                      }`}
                                    >
                                      {item.persisted ? "Saved memory" : "Live draft"}
                                    </span>
                                    {item.domain ? (
                                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                                        {item.domain}
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="text-sm leading-relaxed text-slate-700">{item.text}</p>
                                </div>
                                <button
                                  onClick={() => {
                                    void deleteTakeaway(item.id);
                                  }}
                                  className="rounded-full border border-[#dce5e8] bg-white p-2 text-slate-600 transition hover:text-slate-900"
                                  title="Delete takeaway"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

              </div>
            ) : activePanel === "island" ? (
              <div className="mx-auto max-w-3xl space-y-5">
                <nav className="flex flex-wrap gap-2" aria-label="Knowledge topics">
                  {presetIslandModules.map((island) => (
                    <button
                      key={island.id}
                      onClick={() => openIsland(island.label)}
                      aria-pressed={selectedIsland.id === island.id}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${selectedIsland.id === island.id ? "border-[#6ba5ff]/50 bg-[#e5edf8] text-slate-900" : "border-[#dce5e8] bg-white text-slate-600 hover:bg-white"}`}
                    >
                      {island.label}
                    </button>
                  ))}
                </nav>
                <section className="rounded-[24px] border border-[#6ba5ff]/20 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#487881]">{selectedIsland.domain}</p>
                  <p className="mt-2 text-base leading-relaxed text-slate-700">{selectedIsland.summary}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    {selectedIslandConversations.length} related conversations · {selectedIslandTakeaways.length} saved ideas
                  </p>
                </section>

                <section className="rounded-[24px] border border-[#dce5e8] bg-white p-5">
                  <h2 className="text-xl font-semibold text-slate-900">Chats</h2>
                  <div className="mt-4 space-y-2">
                    {selectedIslandConversations.length ? selectedIslandConversations.map((conversation) => (
                      <button
                        key={conversation.id}
                        onClick={() => openConversation(conversation.id)}
                        className="flex w-full items-center justify-between gap-4 rounded-[18px] border border-[#dce5e8] bg-white px-4 py-3 text-left transition hover:border-[#6ba5ff]/40 hover:bg-[#e8f0f5]"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-slate-900">{conversation.title}</span>
                          <span className="mt-1 block text-xs text-slate-500">{conversation.messageCount} messages</span>
                        </span>
                        <span className="shrink-0 text-xs font-semibold text-[#315f69]">Open chat →</span>
                      </button>
                    )) : <p className="rounded-[18px] bg-white px-4 py-3 text-sm text-slate-600">No conversation is linked to this topic yet.</p>}
                  </div>
                </section>

                <section className="rounded-[24px] border border-[#dce5e8] bg-white p-5">
                  <h2 className="text-xl font-semibold text-slate-900">Saved ideas</h2>
                  <div className="mt-4 space-y-3">
                    {selectedIslandSources.length ? selectedIslandSources.map((source) => {
                      const sourceItems = selectedIslandTakeaways.filter((item) => item.podcastId === source.id);
                      return (
                        <article key={source.id} className="rounded-[18px] border border-[#dce5e8] bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#487881]">{source.domain}</p>
                          <h3 className="mt-1 text-sm font-semibold text-slate-900">{source.title}</h3>
                          <div className="mt-3 space-y-2">
                            {sourceItems.slice(0, 1).map((item) => (
                              <p key={item.id} className="rounded-xl bg-white px-3 py-2 text-sm leading-relaxed text-slate-700">{item.text}</p>
                            ))}
                            {!sourceItems.length ? <p className="text-sm text-slate-500">No saved ideas from this source yet.</p> : null}
                          </div>
                          <button
                            onClick={() => {
                              setBuilderSourceId(source.id);
                              setActivePanel("builder");
                            }}
                            className="mt-3 text-sm font-semibold text-[#315f69] hover:text-slate-900"
                          >
                            View source memory ({sourceItems.length}) →
                          </button>
                        </article>
                      );
                    }) : <p className="rounded-[18px] bg-white px-4 py-3 text-sm text-slate-600">No saved source is linked to this topic yet. Add a source to start building memory.</p>}
                  </div>
                </section>
              </div>
            ) : bootstrapping ? (
              <div className="flex h-full items-center justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#dce5e8] bg-white px-4 py-2 text-sm text-slate-600">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Loading Inspiration workspace...
                </div>
              </div>
            ) : !activeConversation || activeConversation.messages.length === 0 ? (
              <section className="mx-auto flex h-full max-w-4xl flex-col justify-center">
                <h2 className="max-w-4xl text-balance text-4xl leading-tight text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>
                  Start a chat
                </h2>
                <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600">
                  Ask about saved ideas, or add a source below.
                </p>
              </section>
            ) : (
              <div className="mx-auto flex max-w-4xl flex-col gap-3">
                {activeConversation.messages.map((message) => (
                  <article
                    key={message.id}
                    className={`rounded-[24px] px-4 py-3 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "ml-10 bg-[linear-gradient(135deg,#1b3a61,#274a77)] text-white"
                        : "mr-10 border border-[#dce5e8] bg-white text-slate-900"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.role === "assistant" && message.contexts && message.contexts.length > 0 ? (
                      <details className="mt-3 rounded-[18px] border border-[#dce5e8] bg-white px-3 py-2 text-xs text-slate-600">
                        <summary className="cursor-pointer font-semibold">Sources used ({message.contexts.length})</summary>
                        <ul className="mt-2 list-disc space-y-1 pl-4">
                          {message.contexts.map((context, index) => <li key={`${message.id}-context-${index}`}>{context}</li>)}
                        </ul>
                      </details>
                    ) : null}
                  </article>
                ))}
                {chatBusy ? (
                  <div className="mr-10 inline-flex items-center gap-2 rounded-full border border-[#dce5e8] bg-white px-4 py-2 text-xs text-slate-600">
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                    Thinking with selected memory...
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {activePanel === "chat" || activePanel === "builder" ? <div className="border-t border-[#dce5e8] bg-white px-5 py-4">
            {hint ? <p className="mb-3 text-xs text-teal">{hint}</p> : null}
            <div className="rounded-[28px] border border-[#dce5e8] bg-white p-4 shadow-[0_20px_44px_rgba(0,0,0,0.34)]">
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#dce5e8] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                  <ImagePlus className="h-3.5 w-3.5" />
                  Add image
                  <input type="file" accept="image/*" className="hidden" onChange={onFileSelect} />
                </label>
                {extractUrls(messageInput)[0] ? <span className="inline-flex items-center gap-2 text-xs text-slate-600"><Link2 className="h-3.5 w-3.5" /> Link detected</span> : null}
                {attachments.length ? <span className="inline-flex items-center gap-2 text-xs text-slate-600"><Paperclip className="h-3.5 w-3.5" /> {attachments.length} attached</span> : null}
              </div>

              {attachments.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {attachments.map((attachment) => (
                    <button
                      key={attachment.id}
                      onClick={() => removeAttachment(attachment.id)}
                      className="inline-flex items-center gap-2 rounded-full border border-teal/20 bg-teal/10 px-3 py-1.5 text-xs text-teal"
                    >
                      {attachment.kind === "image" ? <ImagePlus className="h-3.5 w-3.5" /> : <Paperclip className="h-3.5 w-3.5" />}
                      {summarizeTextTitle(attachment.name)}
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="workspace-composer-input mt-4 grid grid-cols-[minmax(0,1fr)_auto_auto] items-end gap-2">
                <div className="flex min-w-0 items-end gap-2 rounded-[22px] border border-[#dce5e8] bg-white px-3 py-2">
                  <MessageSquare className="mb-2 h-4 w-4 shrink-0 text-slate-500" />
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onPaste={onInputPaste}
                    rows={2}
                    placeholder="Ask a question or paste a source..."
                    className="max-h-32 min-h-[52px] w-full resize-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => void startParseAudio()}
                  disabled={parseState.running}
                  title="Extract ideas from the source in the input"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-teal px-4 text-sm font-semibold text-white transition hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {parseState.running ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Waves className="h-4 w-4" />}
                  Extract
                </button>
                <button
                  onClick={() => void sendMessage()}
                  disabled={chatBusy}
                  title="Ask a question using saved memory"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-[linear-gradient(135deg,#1b3a61,#274a77)] px-4 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  Ask
                </button>
              </div>
            </div>
          </div> : null}
        </section>

        {activePanel !== "inbox" ? <><div className="workspace-right-resizer group flex h-full items-center justify-center">
          <button
            type="button"
            aria-label="Resize center and right panels"
            onMouseDown={() => setDragPane("right")}
            className="relative h-full w-full cursor-col-resize"
          >
            <span className="absolute left-1/2 top-1/2 h-24 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white transition group-hover:bg-[#6ba5ff]/60" />
          </button>
        </div>

        <aside className="workspace-islands flex h-full min-h-0 flex-col overflow-hidden rounded-[30px] border border-[#dce5e8] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
          <div className="night-scroll flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-2xl text-slate-900" title={insightCluster?.title} style={{ fontFamily: "var(--font-heading)" }}>Connections</h3>
              {isDemoMode ? <span className="rounded-full bg-[#e5edf8] px-2.5 py-1 text-[11px] font-semibold text-[#315f69]">Demo map</span> : null}
            </div>

            <div className="relative min-h-[400px] flex-1 overflow-hidden rounded-[28px] border border-[#dce5e8] bg-[#f3f8f7]">
              {visibleMapNodes.length ? (
                <>
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Topic connections">
                    {visibleMapEdges.map((edge) => {
                      const from = visibleMapNodes.find((node) => node.id === edge.from);
                      const to = visibleMapNodes.find((node) => node.id === edge.to);
                      if (!from || !to) return null;
                      const selected = selectedConnection === edge;
                      const color = edge.strength === "strong" ? "#31847c" : edge.strength === "related" ? "#87a9a3" : "#b9c9c7";
                      const width = edge.strength === "strong" ? 1.25 : edge.strength === "related" ? 0.72 : 0.42;
                      return (
                        <g key={`${edge.from}-${edge.to}`}>
                          <path d={`M ${from.x} ${from.y} L ${to.x} ${to.y}`} stroke={color} strokeWidth={selected ? width + 0.25 : width}
                            strokeDasharray={edge.strength === "weak" ? "1.2 1.2" : undefined} fill="none" />
                        </g>
                      );
                    })}
                  </svg>
                  {visibleMapNodes.map((node) => {
                    const topic = presetIslandModules.find((item) => item.id === node.id);
                    return (
                      <button key={node.id} onClick={() => openIsland(node.label)}
                        aria-label={`Open ${node.label} topic`}
                        aria-pressed={activePanel === "island" && selectedIsland.id === node.id}
                        className={`absolute z-10 flex h-[74px] w-[120px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[18px] border px-2 text-center shadow-[0_8px_20px_rgba(38,66,69,0.08)] transition hover:-translate-y-[55%] hover:shadow-[0_12px_25px_rgba(38,66,69,0.14)] aria-pressed:ring-2 aria-pressed:ring-[#31847c] ${topic?.domain === "AI" ? "border-[#9ccbc1] bg-[#e2f1ec]" : topic?.domain === "Finance" ? "border-[#e0cbaa] bg-[#fbefd9]" : "border-[#cfbfdc] bg-[#f1e9f5]"}`}
                        style={{ left: `${node.x}%`, top: `${node.y}%` }}>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{topic?.domain}</span>
                        <span className="mt-1 text-xs font-semibold leading-tight text-slate-900">{node.label}</span>
                      </button>
                    );
                  })}
                </>
              ) : <div className="flex h-full items-center justify-center px-8 text-center text-sm text-slate-500">Save ideas to build your topic map.</div>}
            </div>

            {visibleMapEdges.length ? (
              <>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600" aria-label="Connection strength legend">
                  <span className="inline-flex items-center gap-2"><i className="h-[4px] w-5 rounded-full bg-[#31847c]" /> Strong</span>
                  <span className="inline-flex items-center gap-2"><i className="h-[3px] w-5 rounded-full bg-[#87a9a3]" /> Related</span>
                  <span className="inline-flex items-center gap-2"><i className="w-5 border-t border-dashed border-[#b9c9c7]" /> Weak</span>
                </div>
                {selectedConnection ? (
                  <section className="rounded-[20px] border border-[#dce5e8] bg-white p-4">
                    <select aria-label="Choose connection" value={visibleMapEdges.indexOf(selectedConnection)} onChange={(event) => setSelectedConnectionIndex(Number(event.target.value))}
                      className="w-full rounded-xl border border-[#dce5e8] bg-white px-3 py-2 text-sm font-semibold text-slate-900">
                      {visibleMapEdges.map((edge, index) => (
                        <option key={`${edge.from}-${edge.to}`} value={index}>
                          {edge.strength} · {compactTopicLabels[edge.from]} ↔ {compactTopicLabels[edge.to]}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{selectedConnection.explanation}</p>
                  </section>
                ) : null}
              </>
            ) : null}
          </div>
        </aside></> : null}
      </div>
    </main>
  );
}
