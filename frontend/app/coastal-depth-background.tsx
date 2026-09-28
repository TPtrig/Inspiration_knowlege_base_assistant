"use client";

import { useEffect, useRef } from "react";
import styles from "./landing.module.css";

function contourPath(index: number, phase: number) {
  const centerX = 480;
  const centerY = 360;
  const radiusX = 90 + index * 31;
  const radiusY = 61 + index * 23;
  const points = Array.from({ length: 72 }, (_, point) => {
    const angle = (point / 72) * Math.PI * 2;
    const swell = 1 + .055 * Math.sin(angle * 3 + phase) + .035 * Math.cos(angle * 5 - phase);
    const x = centerX + Math.cos(angle) * radiusX * swell;
    const y = centerY + Math.sin(angle) * radiusY * (swell + .025 * Math.sin(angle * 4 + phase));
    return `${point === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  });

  return `${points.join(" ")} Z`;
}

function DepthContours({ phase }: { phase: number }) {
  return (
    <svg viewBox="0 0 960 720" aria-hidden="true" focusable="false">
      {Array.from({ length: 11 }, (_, index) => (
        <path
          key={index}
          d={contourPath(index, phase)}
          fill={index === 0 ? "#b8ded0" : "none"}
          fillOpacity={index === 0 ? .22 : undefined}
          stroke="currentColor"
          strokeWidth={index % 3 === 0 ? 2 : 1.2}
          strokeOpacity={Math.max(.24, .73 - index * .045)}
        />
      ))}
    </svg>
  );
}

export default function CoastalDepthBackground() {
  const backgroundRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const background = backgroundRef.current;
    if (!background || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let pointerX = 0;
    let pointerY = 0;
    let frame = 0;

    const update = () => {
      frame = 0;
      const scrollRange = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const scrollProgress = window.scrollY / scrollRange;
      background.style.setProperty("--far-x", `${(-pointerX * 9).toFixed(1)}px`);
      background.style.setProperty("--far-y", `${(-pointerY * 6 - scrollProgress * 18).toFixed(1)}px`);
      background.style.setProperty("--middle-x", `${(pointerX * 16).toFixed(1)}px`);
      background.style.setProperty("--middle-y", `${(pointerY * 12 - scrollProgress * 42).toFixed(1)}px`);
      background.style.setProperty("--near-x", `${(-pointerX * 25).toFixed(1)}px`);
      background.style.setProperty("--near-y", `${(-pointerY * 19 - scrollProgress * 72).toFixed(1)}px`);
    };

    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerX = event.clientX / window.innerWidth * 2 - 1;
      pointerY = event.clientY / window.innerHeight * 2 - 1;
      scheduleUpdate();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    update();

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className={styles.depthBackground} ref={backgroundRef} aria-hidden="true">
      <div className={`${styles.depthPlane} ${styles.depthPlaneFar}`}><DepthContours phase={.4} /></div>
      <div className={`${styles.depthPlane} ${styles.depthPlaneMiddle}`}><DepthContours phase={1.8} /></div>
      <div className={`${styles.depthPlane} ${styles.depthPlaneNear}`}><DepthContours phase={3.1} /></div>
      <div className={styles.depthLight} />
    </div>
  );
}
