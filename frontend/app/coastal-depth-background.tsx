"use client";

import { useEffect, useRef } from "react";
import styles from "./landing.module.css";

const X_STEPS = 54;
const Z_STEPS = 30;
const MAX_Z = 12;

type Point = { x: number; y: number };

function surfaceHeight(x: number, z: number, time: number) {
  const longWave = Math.sin(x * .76 + z * .42 - time * 1.08) * .3;
  const crossWave = Math.sin(x * 1.37 - z * .53 + time * .72) * .17;
  const ridge = Math.exp(-((x - 1.3) ** 2 / 17 + (z - 5.2) ** 2 / 24)) * .64;
  const rippleAge = time % 6.8 - 2.8;
  const distance = Math.hypot(x - .5, (z - 4.2) * .8);
  const ripple = rippleAge > 0 && rippleAge < 3.1
    ? Math.exp(-(((distance - rippleAge * 2.8) / .55) ** 2)) * .62 * (1 - rippleAge / 3.5)
    : 0;

  return longWave + crossWave + ridge + ripple;
}

function project(x: number, z: number, time: number, width: number, height: number, scroll: number): Point {
  const scale = Math.max(width * .076, height * .122);
  const depth = .6 + z * .07;
  const waveHeight = surfaceHeight(x, z, time);

  return {
    x: width * (.73 + scroll * .025) + x * scale * depth + z * scale * .028,
    y: height * .08 + z * scale * .62 - waveHeight * scale * .79 * depth - scroll * height * .035
  };
}

function traceLine(context: CanvasRenderingContext2D, points: Point[]) {
  context.beginPath();
  points.forEach((point, index) => {
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  });
}

function drawSea(context: CanvasRenderingContext2D, width: number, height: number, time: number, scroll: number) {
  context.clearRect(0, 0, width, height);
  const xValues = Array.from({ length: X_STEPS + 1 }, (_, index) => -7 + index * 14 / X_STEPS);

  for (let row = 0; row < Z_STEPS; row += 1) {
    const backZ = row * MAX_Z / Z_STEPS;
    const frontZ = (row + 1) * MAX_Z / Z_STEPS;
    const back = xValues.map((x) => project(x, backZ, time, width, height, scroll));
    const front = xValues.map((x) => project(x, frontZ, time, width, height, scroll));
    const depth = row / Z_STEPS;

    traceLine(context, back);
    for (let index = front.length - 1; index >= 0; index -= 1) {
      context.lineTo(front[index].x, front[index].y);
    }
    context.closePath();
    const middle = Math.floor(front.length / 2);
    const shade = context.createLinearGradient(0, back[middle].y, 0, front[middle].y + 1);
    shade.addColorStop(0, `rgba(229, 250, 232, ${(.1 + depth * .11).toFixed(3)})`);
    shade.addColorStop(1, `rgba(39, 124, 117, ${(.13 + depth * .13).toFixed(3)})`);
    context.fillStyle = shade;
    context.fill();

    if (row % 2 === 0) {
      const shadow = front.map((point) => ({ x: point.x, y: point.y + 7 + depth * 4 }));
      traceLine(context, shadow);
      context.strokeStyle = `rgba(24, 97, 96, ${(.04 + depth * .08).toFixed(3)})`;
      context.lineWidth = 9 + depth * 6;
      context.stroke();

      traceLine(context, front);
      context.strokeStyle = `rgba(39, 116, 117, ${(.22 + depth * .18).toFixed(3)})`;
      context.lineWidth = 1 + depth * 1.2;
      context.stroke();

      if (row % 6 === 0) {
        traceLine(context, front);
        context.strokeStyle = `rgba(255, 255, 238, ${(.3 + depth * .28).toFixed(3)})`;
        context.lineWidth = 2.5;
        context.stroke();
      }
    }
  }

  const glints = [
    { x: -1.8, z: 2.2, radius: 4 },
    { x: 3.1, z: 4.8, radius: 5 },
    { x: -.3, z: 7.9, radius: 3.5 },
    { x: 4.7, z: 9.5, radius: 4 }
  ];

  glints.forEach((glint, index) => {
    const point = project(glint.x, glint.z, time, width, height, scroll);
    const strength = .4 + .35 * Math.sin(time * 1.5 + index * 1.9);
    const glow = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, glint.radius * 7);
    glow.addColorStop(0, `rgba(255, 255, 242, ${strength.toFixed(3)})`);
    glow.addColorStop(1, "rgba(255, 255, 242, 0)");
    context.fillStyle = glow;
    context.beginPath();
    context.arc(point.x, point.y, glint.radius * 7, 0, Math.PI * 2);
    context.fill();
  });
}

export default function CoastalDepthBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastFrame = 0;
    const startedAt = performance.now();

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      if (reducedMotion) drawSea(context, width, height, 0, 0);
    };

    const render = (now: number) => {
      if (now - lastFrame >= 32) {
        const scrollRange = Math.max(1, document.documentElement.scrollHeight - height);
        const scroll = Math.min(1, Math.max(0, window.scrollY / scrollRange));
        drawSea(context, width, height, (now - startedAt) / 1000, scroll);
        lastFrame = now;
      }
      frame = window.requestAnimationFrame(render);
    };

    resize();
    if (reducedMotion) drawSea(context, width, height, 0, 0);
    else frame = window.requestAnimationFrame(render);
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className={styles.depthBackground} aria-hidden="true">
      <div className={styles.depthHorizon} />
      <canvas className={styles.depthCanvas} ref={canvasRef} />
      <div className={styles.depthShimmer} />
    </div>
  );
}
