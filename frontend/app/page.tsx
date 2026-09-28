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

function InsightMeteorVisual() {
  return (
    <div className={styles.insightVisual} role="img" aria-label="Two meteors meet, making a small firework that reveals a new insight">
      <svg viewBox="0 0 800 510" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <linearGradient id="insight-sky" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e2f2e9" />
            <stop offset="58%" stopColor="#f6f4e8" />
            <stop offset="100%" stopColor="#f4e4d6" />
          </linearGradient>
          <linearGradient id="teal-trail" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#53a99b" stopOpacity="0" />
            <stop offset="65%" stopColor="#39a999" stopOpacity=".55" />
            <stop offset="100%" stopColor="#0e827d" />
          </linearGradient>
          <linearGradient id="coral-trail" x1="1" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#ed9d77" stopOpacity="0" />
            <stop offset="70%" stopColor="#eea57e" stopOpacity=".65" />
            <stop offset="100%" stopColor="#d8795b" />
          </linearGradient>
          <radialGradient id="insight-glow">
            <stop offset="0%" stopColor="#fff3ba" stopOpacity=".95" />
            <stop offset="38%" stopColor="#f9e7b3" stopOpacity=".6" />
            <stop offset="100%" stopColor="#f9e7b3" stopOpacity="0" />
          </radialGradient>
          <filter id="meteor-glow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        <rect width="800" height="510" fill="url(#insight-sky)" />
        <circle cx="405" cy="248" r="232" fill="none" stroke="#b5d9c9" strokeOpacity=".5" />
        <circle cx="405" cy="248" r="177" fill="none" stroke="#f1d4bd" strokeOpacity=".52" />
        <path d="M49 318 C178 290 258 329 366 277" fill="none" stroke="#8cbbac" strokeOpacity=".28" strokeWidth="1.5" />
        <path d="M771 151 C635 185 562 165 434 236" fill="none" stroke="#e8bfa2" strokeOpacity=".32" strokeWidth="1.5" />
        <g fill="#78b7a5" opacity=".55">
          <circle cx="105" cy="91" r="2.5" /><circle cx="201" cy="385" r="2" />
          <circle cx="664" cy="95" r="2" /><circle cx="712" cy="351" r="3" />
        </g>
        <g fill="#e5aa86" opacity=".7">
          <circle cx="178" cy="170" r="2" /><circle cx="597" cy="417" r="2.5" />
          <circle cx="724" cy="203" r="1.8" />
        </g>

        <g className={styles.tealMeteor}>
          <path d="M192 120 C268 156 327 214 400 250" fill="none" stroke="url(#teal-trail)" strokeWidth="24" strokeLinecap="round" opacity=".17" />
          <path d="M192 120 C268 156 327 214 400 250" fill="none" stroke="url(#teal-trail)" strokeWidth="5" strokeLinecap="round" />
          <circle cx="400" cy="250" r="22" fill="#34aa9b" opacity=".5" filter="url(#meteor-glow)" />
          <circle cx="400" cy="250" r="8" fill="#f7fff5" />
          <circle cx="400" cy="250" r="4" fill="#0d8a81" />
        </g>
        <g className={styles.coralMeteor}>
          <path d="M612 388 C533 350 478 284 400 250" fill="none" stroke="url(#coral-trail)" strokeWidth="24" strokeLinecap="round" opacity=".18" />
          <path d="M612 388 C533 350 478 284 400 250" fill="none" stroke="url(#coral-trail)" strokeWidth="5" strokeLinecap="round" />
          <circle cx="400" cy="250" r="22" fill="#e69870" opacity=".48" filter="url(#meteor-glow)" />
          <circle cx="400" cy="250" r="8" fill="#fff8e9" />
          <circle cx="400" cy="250" r="4" fill="#de8063" />
        </g>

        <circle className={styles.insightGlow} cx="400" cy="250" r="112" fill="url(#insight-glow)" />
        <circle className={styles.insightRing} cx="400" cy="250" r="39" fill="none" stroke="#f6c692" strokeWidth="2" />
        <g className={styles.insightBurst} strokeLinecap="round" fill="none">
          <path d="M400 174v23 M400 303v23 M324 250h23 M453 250h23" stroke="#d78d68" strokeWidth="4" />
          <path d="M346 196l17 17 M437 287l17 17 M346 304l17-17 M437 213l17-17" stroke="#329b8c" strokeWidth="3.5" />
          <path d="M372 179l8 22 M420 299l8 22 M329 222l21 8 M450 270l21 8 M330 280l21-8 M449 230l21-8" stroke="#e4b45f" strokeWidth="2.5" />
          <circle cx="400" cy="250" r="9" fill="#fff9db" stroke="#dfa86a" strokeWidth="2" />
          <circle cx="375" cy="224" r="3" fill="#f1ba74" /><circle cx="429" cy="232" r="3" fill="#58af9d" />
          <circle cx="382" cy="281" r="2.5" fill="#e79e78" /><circle cx="424" cy="274" r="2.5" fill="#e8b975" />
        </g>
      </svg>
      <span className={styles.insightCaption}>New insight<span aria-hidden="true">✦</span></span>
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
          <InsightMeteorVisual />
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
