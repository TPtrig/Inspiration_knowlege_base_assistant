"use client";

import { useEffect } from "react";
import styles from "./landing.module.css";

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export default function LandingMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-landing-motion-root]");
    if (!root) return;

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposeMotion = () => {};

    const initialize = () => {
      disposeMotion();
      if (preference.matches) return;

      const reveals = Array.from(root.querySelectorAll<HTMLElement>([
        `.${styles.valueStrip} > div`,
        `.${styles.sectionHeading}`,
        `.${styles.processCard}`,
        `.${styles.connectionsCopy}`,
        `.${styles.connectionsVisual}`,
        `.${styles.closingSection} > :not(.${styles.closingArt})`
      ].join(",")));
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(({ target, isIntersecting }) => {
          if (!isIntersecting) return;
          target.classList.remove(styles.revealPending);
          observer.unobserve(target);
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0 });

      reveals.forEach((element) => {
        element.classList.add(styles.revealTarget);
        const siblings = element.parentElement?.children;
        const index = siblings ? Array.from(siblings).indexOf(element) : 0;
        element.style.setProperty("--reveal-delay", `${Math.min(index, 3) * 75}ms`);
        // Keep content already on screen visible, including restored scroll positions.
        if (element.getBoundingClientRect().top >= window.innerHeight) {
          element.classList.add(styles.revealPending);
          observer.observe(element);
        }
      });

      const readings = Array.from(root.querySelectorAll<HTMLElement>("[data-reading]")).map((heading) => ({
        heading,
        words: Array.from(heading.querySelectorAll<HTMLElement>(`.${styles.readingWord}`))
      }));
      const hero = root.querySelector<HTMLElement>(`.${styles.hero}`);
      const heroVisual = root.querySelector<HTMLElement>(`.${styles.heroVisual}`);
      const connections = root.querySelector<HTMLElement>(`.${styles.connectionsSection}`);
      const map = root.querySelector<HTMLElement>(`.${styles.largeMapFrame}`);
      const closing = root.querySelector<HTMLElement>(`.${styles.closingSection}`);
      const art = root.querySelector<HTMLElement>(`.${styles.closingArt}`);
      let frame = 0;

      const update = () => {
        frame = 0;
        const height = window.innerHeight;
        const travel = window.innerWidth <= 700 ? 10 : 24;
        readings.forEach(({ heading, words }) => {
          const top = heading.getBoundingClientRect().top;
          const progress = clamp((height * .85 - top) / (height * .45));
          words.forEach((word, index) => {
            const strength = clamp(progress * 1.45 - (index / Math.max(words.length - 1, 1)) * .45);
            word.style.setProperty("--word-opacity", `${.35 + strength * .65}`);
          });
        });
        if (hero && heroVisual) {
          const distance = Math.max(0, -hero.getBoundingClientRect().top);
          heroVisual.style.setProperty("--drift-y", `${clamp(distance * .055, 0, travel)}px`);
        }
        if (connections && map) {
          const { top, height: sectionHeight } = connections.getBoundingClientRect();
          map.style.setProperty("--drift-y", `${clamp((height * .5 - top - sectionHeight * .5) * .05, -travel, travel)}px`);
          const mapTop = map.parentElement?.getBoundingClientRect().top ?? top;
          connections.style.setProperty("--connection-progress", `${clamp((height * .9 - mapTop) / (height * .6))}`);
        }
        if (closing && art) {
          const { top, height: sectionHeight } = closing.getBoundingClientRect();
          art.style.setProperty("--drift-y", `${clamp((height * .5 - top - sectionHeight * .5) * .07, -travel, travel)}px`);
        }
      };
      const schedule = () => {
        if (!frame && !document.hidden) frame = requestAnimationFrame(update);
      };
      const revealFocus = (event: FocusEvent) => {
        if (!(event.target instanceof Element)) return;
        const target = event.target.closest(`.${styles.revealPending}`);
        if (target) {
          target.classList.remove(styles.revealPending);
          observer.unobserve(target);
        }
      };

      update();
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule);
      document.addEventListener("visibilitychange", schedule);
      root.addEventListener("focusin", revealFocus);

      disposeMotion = () => {
        observer.disconnect();
        cancelAnimationFrame(frame);
        window.removeEventListener("scroll", schedule);
        window.removeEventListener("resize", schedule);
        document.removeEventListener("visibilitychange", schedule);
        root.removeEventListener("focusin", revealFocus);
        reveals.forEach((element) => {
          element.classList.remove(styles.revealPending, styles.revealTarget);
          element.style.removeProperty("--reveal-delay");
        });
        readings.forEach(({ words }) => words.forEach((word) => word.style.removeProperty("--word-opacity")));
        [heroVisual, map, art].forEach((element) => element?.style.removeProperty("--drift-y"));
        connections?.style.removeProperty("--connection-progress");
      };
    };

    initialize();
    preference.addEventListener("change", initialize);
    return () => {
      disposeMotion();
      preference.removeEventListener("change", initialize);
    };
  }, []);

  return null;
}
