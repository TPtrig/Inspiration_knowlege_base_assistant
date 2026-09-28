import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Compass, Layers3, MessageCircle, Sparkles, Waves } from "lucide-react";
import styles from "./landing.module.css";

export const metadata: Metadata = {
  title: "Inspiration — Ideas worth keeping, connections worth finding",
  description:
    "Capture ideas from across your sources, choose what becomes memory, ask grounded questions, and discover how your knowledge connects."
};

const mapTopics = [
  { name: "Capital & Cash", className: styles.capital },
  { name: "Operating Rhythm", className: styles.operations },
  { name: "AI Infrastructure", className: styles.infrastructure },
  { name: "LLM Models", className: styles.models }
];

function IslandMap({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`${styles.islandMap} ${compact ? styles.compactMap : ""}`} role="img" aria-label="Four knowledge topics shown as islands, with stronger and weaker connections between them">
      <svg className={styles.mapLines} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path className={styles.relatedLine} d="M 29 21 C 39 31, 45 31, 55 24" />
        <path className={styles.relatedLine} d="M 61 37 C 56 45, 51 51, 44 59" />
        <path className={styles.strongLine} d="M 46 75 C 53 68, 58 69, 65 75" />
        <path className={styles.weakLine} d="M 18 30 C 18 39, 22 45, 27 52" />
      </svg>
      {mapTopics.map((topic) => (
        <span key={topic.name} className={`${styles.mapTopic} ${topic.className}`}>{topic.name}</span>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/" aria-label="Inspiration home">
            <span className={styles.brandMark}><Waves size={20} strokeWidth={2.2} /></span>
            <span>inspiration<span className={styles.brandPeriod}>.</span></span>
          </Link>
          <nav className={styles.nav} aria-label="Main navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#connections">Connections</a>
            <Link className={styles.navCta} href="/workspace">Open workspace <ArrowUpRight size={15} /></Link>
          </nav>
        </div>
      </header>

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}><span className={styles.eyebrowDot} /> A living map of what you know</div>
          <h1 id="hero-title">Ideas are better<br />when they<br /><em>connect.</em></h1>
          <p className={styles.heroDescription}>
            Your best ideas are scattered across podcasts, videos, notes, and images.
            Inspiration helps you keep what matters, ask better questions, and see the links between them.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryButton} href="/workspace">Explore the workspace <ArrowUpRight size={18} /></Link>
            <a className={styles.textButton} href="#how-it-works">See how it works <ArrowRight size={17} /></a>
          </div>
          <p className={styles.heroFootnote}><Check size={15} /> Explore with sample content. No setup needed.</p>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.visualOrbit} aria-hidden="true" />
          <div className={styles.previewWindow}>
            <div className={styles.previewTopbar}>
              <span className={styles.previewMark}><Compass size={17} /> Knowledge landscape</span>
              <span className={styles.previewPill}>EXAMPLE MAP</span>
            </div>
            <IslandMap />
            <div className={styles.previewFooter}>
              <span><i className={styles.strongKey} /> Strong</span>
              <span><i className={styles.relatedKey} /> Related</span>
              <span><i className={styles.weakKey} /> Weak</span>
              <span className={styles.previewHint}>Topics from saved ideas</span>
            </div>
          </div>
          <div className={styles.floatingNote}><span>NEW CONNECTION</span><strong>AI Infrastructure ↔ LLM Models</strong><small>See why these ideas belong together <ArrowUpRight size={12} /></small></div>
        </div>
      </section>

      <section className={styles.valueStrip} aria-label="Product highlights">
        <div><span className={styles.stripIcon}><Layers3 size={19} /></span><p>Many sources.<br /><strong>One place to think.</strong></p></div>
        <div><span className={styles.stripIcon}><Check size={19} /></span><p>Your judgment.<br /><strong>Only useful memory.</strong></p></div>
        <div><span className={styles.stripIcon}><Sparkles size={19} /></span><p>Connected ideas.<br /><strong>More to discover.</strong></p></div>
      </section>

      <section id="how-it-works" className={styles.processSection} aria-labelledby="process-title">
        <div className={styles.sectionHeading}>
          <div><span className={styles.sectionKicker}>THE PRODUCT LOOP</span><h2 id="process-title">From passing thought<br />to lasting insight.</h2></div>
          <p>Inspiration gives every idea a simple path: capture it, decide whether to keep it, then put it to work.</p>
        </div>
        <div className={styles.processGrid}>
          <article className={styles.processCard}>
            <span className={styles.stepNumber}>01 / CAPTURE</span>
            <div className={styles.captureIllustration} aria-hidden="true">
              <div className={styles.sourceRow}><span className={styles.sourceDot} /> Podcast <span>↗</span></div>
              <div className={styles.sourceRow}><span className={styles.sourceDot} /> Video link <span>↗</span></div>
              <div className={styles.sourceRow}><span className={styles.sourceDot} /> A note or image <span>↗</span></div>
              <span className={styles.captureSpark}><Sparkles size={20} /></span>
            </div>
            <h3>Bring the fragments in.</h3>
            <p>Start with a link, a thought, or an image. Get draft ideas without building a filing system first.</p>
          </article>
          <article className={styles.processCard}>
            <span className={styles.stepNumber}>02 / CURATE</span>
            <div className={styles.curateIllustration} aria-hidden="true">
              <div className={styles.curateLabel}>Ideas worth keeping <span>2 selected</span></div>
              <div className={styles.curateRow}><span className={styles.checkedBox}><Check size={13} /></span> Retrieval quality starts with curation.</div>
              <div className={styles.curateRow}><span className={styles.emptyBox} /> A passing detail from the source.</div>
              <div className={styles.curateRow}><span className={styles.checkedBox}><Check size={13} /></span> Review decisions at clear checkpoints.</div>
            </div>
            <h3>Choose what becomes memory.</h3>
            <p>Review the draft. Keep the signal. Your selected ideas become the material for future answers.</p>
          </article>
          <article className={styles.processCard}>
            <span className={styles.stepNumber}>03 / EXPLORE</span>
            <div className={styles.exploreIllustration} aria-hidden="true">
              <div className={styles.questionBubble}>What should we build first?</div>
              <div className={styles.answerBubble}><MessageCircle size={16} /> Start with retrieval quality and visible checkpoints.<small>Based on 2 saved ideas ↗</small></div>
            </div>
            <h3>Ask, then find new links.</h3>
            <p>Get answers grounded in what you saved. The map reveals related topics; Agent Inbox brings useful links back to you.</p>
          </article>
        </div>
      </section>

      <section id="connections" className={styles.connectionsSection} aria-labelledby="connections-title">
        <div className={styles.connectionsInner}>
          <div className={styles.connectionsCopy}>
            <span className={styles.sectionKicker}>THE INSPIRATION DIFFERENCE</span>
            <h2 id="connections-title">A knowledge base<br />with a <em>point of view.</em></h2>
            <p>Each island is a topic formed from ideas you chose to save. The paths between islands show how closely topics relate, so a connection can become a conversation instead of another forgotten bookmark.</p>
            <div className={styles.connectionExample}><span className={styles.exampleIcon}><Sparkles size={18} /></span><div><strong>One concrete example</strong><p>AI infrastructure and LLM models share a strong link. Finance and AI infrastructure have a weaker one. Open a topic to see its chats and saved ideas.</p></div></div>
            <Link className={styles.inlineLink} href="/workspace">Explore the example map <ArrowUpRight size={17} /></Link>
          </div>
          <div className={styles.connectionsVisual}>
            <div className={styles.largeMapFrame}><div className={styles.largeMapTop}><span><Compass size={17} /> Connections</span><span>04 topics · 03 sources</span></div><IslandMap compact /><div className={styles.largeMapBottom}><span><i className={styles.strongKey} /> Strong</span><span><i className={styles.relatedKey} /> Related</span><span><i className={styles.weakKey} /> Weak</span></div></div>
          </div>
        </div>
      </section>

      <section className={styles.closingSection} aria-labelledby="closing-title">
        <div className={styles.closingArt} aria-hidden="true"><span className={styles.closingIsland} /><span className={styles.closingIsland} /><span className={styles.closingIsland} /><span className={styles.closingPath} /></div>
        <span className={styles.sectionKicker}>MAKE ROOM FOR THE NEXT IDEA</span>
        <h2 id="closing-title">What you keep today can<br /><em>connect tomorrow.</em></h2>
        <p>Take a look inside Inspiration with a ready-made example workspace.</p>
        <Link className={styles.primaryButton} href="/workspace">Open the workspace <ArrowUpRight size={18} /></Link>
      </section>

      <footer className={styles.footer}><Link className={styles.footerBrand} href="/"><Waves size={18} /> inspiration.</Link><span>Ideas worth keeping. Connections worth finding.</span><Link href="/workspace">Workspace <ArrowUpRight size={15} /></Link></footer>
    </main>
  );
}
