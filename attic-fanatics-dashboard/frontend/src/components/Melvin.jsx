import React, { useRef, useEffect, useCallback } from 'react';

// Melvin pixel art — 22 cols wide
// Color key: P=purple head, p=light purple, D=dark purple, B=body/overalls inside, O=overalls outside
// S=skin/face, E=eye, s=smile, _=transparent, F=fire orange, f=fire red-orange
// A=arm, G=grip(orange when forge), W=white

const IDLE_FRAMES = [
  // Frame 0: idle, eyes half-closed
  [
    '_,_,_,_,_,_,_,P,P,P,P,P,P,P,P,_,_,_,_,_,_,_',
    '_,_,_,_,_,P,P,P,P,P,P,P,P,P,P,P,P,_,_,_,_,_',
    '_,_,_,_,P,P,P,P,P,P,P,P,P,P,P,P,P,P,_,_,_,_',
    '_,_,_,P,P,P,S,S,S,S,S,S,S,S,S,S,P,P,P,_,_,_',
    '_,_,P,P,P,S,S,S,S,S,S,S,S,S,S,S,S,P,P,P,_,_',
    '_,_,P,P,S,S,S,E,S,S,S,S,S,S,E,S,S,S,P,P,_,_',
    '_,_,P,P,S,S,S,S,S,S,S,S,S,S,S,S,S,S,P,P,_,_',
    '_,_,P,P,S,S,S,S,S,s,s,s,s,S,S,S,S,S,P,P,_,_',
    '_,_,_,P,P,S,S,S,S,S,S,S,S,S,S,S,S,P,P,_,_,_',
    '_,_,_,_,P,P,P,S,S,S,S,S,S,S,P,P,P,_,_,_,_,_',
    '_,_,_,_,_,P,P,P,P,P,P,P,P,P,P,P,_,_,_,_,_,_',
    // body
    'A,A,A,_,O,O,O,O,O,O,O,O,O,O,O,O,_,_,_,_,_,_',
    'A,_,_,O,O,B,B,B,B,B,B,B,B,B,B,O,O,_,_,_,_,_',
    '_,_,_,O,B,B,B,B,B,B,B,B,B,B,B,B,O,_,_,_,_,_',
    '_,_,_,O,B,B,B,B,B,B,B,B,B,B,B,B,O,_,_,_,_,_',
    '_,_,_,O,O,O,O,O,O,O,O,O,O,O,O,O,O,_,_,_,_,_',
  ],
  // Frame 1: blink
  [
    '_,_,_,_,_,_,_,P,P,P,P,P,P,P,P,_,_,_,_,_,_,_',
    '_,_,_,_,_,P,P,P,P,P,P,P,P,P,P,P,P,_,_,_,_,_',
    '_,_,_,_,P,P,P,P,P,P,P,P,P,P,P,P,P,P,_,_,_,_',
    '_,_,_,P,P,P,S,S,S,S,S,S,S,S,S,S,P,P,P,_,_,_',
    '_,_,P,P,P,S,S,S,S,S,S,S,S,S,S,S,S,P,P,P,_,_',
    '_,_,P,P,S,S,S,S,S,S,S,S,S,S,S,S,S,S,P,P,_,_',
    '_,_,P,P,S,S,S,S,S,S,S,S,S,S,S,S,S,S,P,P,_,_',
    '_,_,P,P,S,S,S,S,S,s,s,s,s,S,S,S,S,S,P,P,_,_',
    '_,_,_,P,P,S,S,S,S,S,S,S,S,S,S,S,S,P,P,_,_,_',
    '_,_,_,_,P,P,P,S,S,S,S,S,S,S,P,P,P,_,_,_,_,_',
    '_,_,_,_,_,P,P,P,P,P,P,P,P,P,P,P,_,_,_,_,_,_',
    'A,A,A,_,O,O,O,O,O,O,O,O,O,O,O,O,_,_,_,_,_,_',
    'A,_,_,O,O,B,B,B,B,B,B,B,B,B,B,O,O,_,_,_,_,_',
    '_,_,_,O,B,B,B,B,B,B,B,B,B,B,B,B,O,_,_,_,_,_',
    '_,_,_,O,B,B,B,B,B,B,B,B,B,B,B,B,O,_,_,_,_,_',
    '_,_,_,O,O,O,O,O,O,O,O,O,O,O,O,O,O,_,_,_,_,_',
  ],
];

const WAVE_FRAMES = [
  // wave arm up
  [
    '_,_,_,_,_,_,_,P,P,P,P,P,P,P,P,_,_,_,_,_,_,_',
    '_,_,_,_,_,P,P,P,P,P,P,P,P,P,P,P,P,_,_,_,_,_',
    '_,_,_,_,P,P,P,P,P,P,P,P,P,P,P,P,P,P,_,_,_,_',
    '_,_,_,P,P,P,S,S,S,S,S,S,S,S,S,S,P,P,P,_,_,_',
    '_,_,P,P,P,S,S,S,S,S,S,S,S,S,S,S,S,P,P,P,_,_',
    '_,_,P,P,S,S,S,E,S,S,S,S,S,S,E,S,S,S,P,P,_,_',
    '_,_,P,P,S,S,S,S,S,S,S,S,S,S,S,S,S,S,P,P,_,_',
    '_,_,P,P,S,S,S,S,S,s,s,s,s,S,S,S,S,S,P,P,_,_',
    '_,_,_,P,P,S,S,S,S,S,S,S,S,S,S,S,S,P,P,_,_,_',
    '_,_,_,_,P,P,P,S,S,S,S,S,S,S,P,P,P,_,_,_,_,_',
    '_,_,_,_,_,P,P,P,P,P,P,P,P,P,P,P,_,_,_,_,_,_',
    '_,A,A,_,O,O,O,O,O,O,O,O,O,O,O,O,_,_,_,_,A,A',
    '_,A,_,O,O,B,B,B,B,B,B,B,B,B,B,O,O,_,_,_,A,_',
    '_,_,_,O,B,B,B,B,B,B,B,B,B,B,B,B,O,_,_,_,_,_',
    '_,_,_,O,B,B,B,B,B,B,B,B,B,B,B,B,O,_,_,_,_,_',
    '_,_,_,O,O,O,O,O,O,O,O,O,O,O,O,O,O,_,_,_,_,_',
  ],
  // wave arm mid
  [
    '_,_,_,_,_,_,_,P,P,P,P,P,P,P,P,_,_,_,_,_,_,_',
    '_,_,_,_,_,P,P,P,P,P,P,P,P,P,P,P,P,_,_,_,_,_',
    '_,_,_,_,P,P,P,P,P,P,P,P,P,P,P,P,P,P,_,_,_,_',
    '_,_,_,P,P,P,S,S,S,S,S,S,S,S,S,S,P,P,P,_,_,_',
    '_,_,P,P,P,S,S,S,S,S,S,S,S,S,S,S,S,P,P,P,_,_',
    '_,_,P,P,S,S,S,E,S,S,S,S,S,S,E,S,S,S,P,P,_,_',
    '_,_,P,P,S,S,S,S,S,S,S,S,S,S,S,S,S,S,P,P,_,_',
    '_,_,P,P,S,S,S,S,S,s,s,s,s,S,S,S,S,S,P,P,_,_',
    '_,_,_,P,P,S,S,S,S,S,S,S,S,S,S,S,S,P,P,_,_,_',
    '_,_,_,_,P,P,P,S,S,S,S,S,S,S,P,P,P,_,_,_,_,_',
    '_,_,_,_,_,P,P,P,P,P,P,P,P,P,P,P,_,_,_,_,_,_',
    'A,A,_,_,O,O,O,O,O,O,O,O,O,O,O,O,_,_,_,A,A,_',
    'A,_,_,O,O,B,B,B,B,B,B,B,B,B,B,O,O,_,_,_,A,_',
    '_,_,_,O,B,B,B,B,B,B,B,B,B,B,B,B,O,_,_,_,_,_',
    '_,_,_,O,B,B,B,B,B,B,B,B,B,B,B,B,O,_,_,_,_,_',
    '_,_,_,O,O,O,O,O,O,O,O,O,O,O,O,O,O,_,_,_,_,_',
  ],
];

// Peekover frames — Melvin's arms hook over the top of the input bar
// Only head + arms visible (body hidden behind bar)
const PEEK_FRAMES = [
  // idle peek: arms stretched wide hooking down over bar edge
  [
    'G,A,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,A,G',
    '_,_,A,_,_,_,P,P,P,P,P,P,P,P,P,_,_,_,A,_,_,_',
    '_,_,_,A,_,P,P,P,P,P,P,P,P,P,P,P,_,A,_,_,_,_',
    '_,_,_,_,P,P,P,P,P,P,P,P,P,P,P,P,P,_,_,_,_,_',
    '_,_,_,_,P,P,S,S,S,S,S,S,S,S,S,S,P,P,_,_,_,_',
    '_,_,_,_,P,S,S,S,E,S,S,S,S,E,S,S,S,P,_,_,_,_',
    '_,_,_,_,P,S,S,S,S,S,S,S,S,S,S,S,S,P,_,_,_,_',
    '_,_,_,_,P,S,S,S,S,s,s,s,s,S,S,S,S,P,_,_,_,_',
    '_,_,_,_,P,P,S,S,S,S,S,S,S,S,S,S,P,P,_,_,_,_',
    '_,_,_,_,_,P,P,P,S,S,S,S,S,S,P,P,P,_,_,_,_,_',
    '_,_,_,_,_,_,P,P,P,P,P,P,P,P,P,P,_,_,_,_,_,_',
  ],
  // blink peek
  [
    'G,A,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,A,G',
    '_,_,A,_,_,_,P,P,P,P,P,P,P,P,P,_,_,_,A,_,_,_',
    '_,_,_,A,_,P,P,P,P,P,P,P,P,P,P,P,_,A,_,_,_,_',
    '_,_,_,_,P,P,P,P,P,P,P,P,P,P,P,P,P,_,_,_,_,_',
    '_,_,_,_,P,P,S,S,S,S,S,S,S,S,S,S,P,P,_,_,_,_',
    '_,_,_,_,P,S,S,S,S,S,S,S,S,S,S,S,S,P,_,_,_,_',
    '_,_,_,_,P,S,S,S,S,S,S,S,S,S,S,S,S,P,_,_,_,_',
    '_,_,_,_,P,S,S,S,S,s,s,s,s,S,S,S,S,P,_,_,_,_',
    '_,_,_,_,P,P,S,S,S,S,S,S,S,S,S,S,P,P,_,_,_,_',
    '_,_,_,_,_,P,P,P,S,S,S,S,S,S,P,P,P,_,_,_,_,_',
    '_,_,_,_,_,_,P,P,P,P,P,P,P,P,P,P,_,_,_,_,_,_',
  ],
];

// Forge peek frames (fire in chest area, but chest hidden — just show orange grip + open eyes)
const FORGE_PEEK_FRAMES = [
  [
    'G,A,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,A,G',
    '_,_,A,_,_,_,P,P,P,P,P,P,P,P,P,_,_,_,A,_,_,_',
    '_,_,_,A,_,P,P,P,P,P,P,P,P,P,P,P,_,A,_,_,_,_',
    '_,_,_,_,P,P,P,P,P,P,P,P,P,P,P,P,P,_,_,_,_,_',
    '_,_,_,_,P,P,S,S,S,S,S,S,S,S,S,S,P,P,_,_,_,_',
    '_,_,_,_,P,S,S,S,E,S,S,S,S,E,S,S,S,P,_,_,_,_',
    '_,_,_,_,P,S,S,S,S,S,S,S,S,S,S,S,S,P,_,_,_,_',
    '_,_,_,_,P,S,S,S,S,s,s,s,s,s,S,S,S,P,_,_,_,_',
    '_,_,_,_,P,P,S,S,S,S,S,S,S,S,S,S,P,P,_,_,_,_',
    '_,_,_,_,_,P,P,P,S,S,S,S,S,S,P,P,P,_,_,_,_,_',
    '_,_,_,_,_,_,P,P,P,P,P,P,P,P,P,P,_,_,_,_,_,_',
  ],
  [
    'G,A,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,A,G',
    '_,_,A,_,_,_,P,P,P,P,P,P,P,P,P,_,_,_,A,_,_,_',
    '_,_,_,A,_,P,P,P,P,P,P,P,P,P,P,P,_,A,_,_,_,_',
    '_,_,_,_,P,P,P,P,P,P,P,P,P,P,P,P,P,_,_,_,_,_',
    '_,_,_,_,P,P,S,S,S,S,S,S,S,S,S,S,P,P,_,_,_,_',
    '_,_,_,_,P,S,S,S,E,S,S,S,S,E,S,S,S,P,_,_,_,_',
    '_,_,_,_,P,S,S,S,S,S,S,S,S,S,S,S,S,P,_,_,_,_',
    '_,_,_,_,P,S,S,S,S,s,s,s,s,s,s,S,S,P,_,_,_,_',
    '_,_,_,_,P,P,S,S,S,S,S,S,S,S,S,S,P,P,_,_,_,_',
    '_,_,_,_,_,P,P,P,S,S,S,S,S,S,P,P,P,_,_,_,_,_',
    '_,_,_,_,_,_,P,P,P,P,P,P,P,P,P,P,_,_,_,_,_,_',
  ],
];

const COLOR_MAP = {
  P: '#a855f7',
  p: '#c084fc',
  D: '#7c3aed',
  B: '#6d28d9',
  O: '#7c3aed',
  S: '#fde68a',
  E: '#1a1a2e',
  s: '#b45309',
  A: '#a855f7',
  G: '#ff5200',
  F: '#ff5200',
  f: '#cc4200',
  W: '#ffffff',
  _: null,
};

function parseFrame(frame) {
  return frame.map(row => row.split(','));
}

function drawFrame(ctx, frame, px) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const rows = parseFrame(frame);
  rows.forEach((row, y) => {
    row.forEach((code, x) => {
      const color = COLOR_MAP[code.trim()];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * px, y * px, px, px);
      }
    });
  });
}

// Glitch effect
function drawGlitchFrame(ctx, baseFrame, px) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const rows = parseFrame(baseFrame);
  const glitchColors = ['#ef4444', '#06b6d4', null];
  rows.forEach((row, y) => {
    row.forEach((code, x) => {
      const color = COLOR_MAP[code.trim()];
      if (color) {
        const isHead = ['P', 'p', 'D'].includes(code.trim());
        if (isHead && Math.random() < 0.35) {
          const gc = glitchColors[Math.floor(Math.random() * glitchColors.length)];
          if (gc) { ctx.fillStyle = gc; ctx.fillRect(x * px, y * px, px, px); }
        } else {
          ctx.fillStyle = color;
          ctx.fillRect(x * px, y * px, px, px);
        }
      }
    });
  });
}

// ── Melvin component ──────────────────────────────────────────────────────────

export function MelvinGreeting({ style }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({ frame: 0, tick: 0 });
  const rafRef = useRef(null);
  const PX = 5;
  const COLS = 22;
  const ROWS_FULL = 16;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = stateRef.current;
    s.tick++;
    // alternate wave/idle every 480ms at 60fps ≈ every 29 frames
    const useWave = Math.floor(s.tick / 29) % 2 === 0;
    const frames = useWave ? WAVE_FRAMES : IDLE_FRAMES;
    if (s.tick % 29 === 0) s.frame = (s.frame + 1) % frames.length;
    drawFrame(ctx, frames[s.frame], PX);
    rafRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={COLS * PX}
      height={ROWS_FULL * PX}
      style={{ imageRendering: 'pixelated', ...style }}
    />
  );
}

export function MelvinPeek({ animState = 'idle' }) {
  const canvasRef = useRef(null);
  const tickRef = useRef(0);
  const rafRef = useRef(null);
  const glitchSubRef = useRef(0);
  const PX = 3;
  const COLS = 22;
  const ROWS = 11;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    tickRef.current++;
    const t = tickRef.current;

    if (animState === 'glitch') {
      // cycle glitch sub-frames every 130ms ≈ 8 frames
      if (t % 8 === 0) glitchSubRef.current = (glitchSubRef.current + 1) % 3;
      drawGlitchFrame(ctx, PEEK_FRAMES[0], PX);
    } else if (animState === 'forge') {
      // alternate forge frames every 220ms ≈ 13 frames
      const fi = Math.floor(t / 13) % FORGE_PEEK_FRAMES.length;
      drawFrame(ctx, FORGE_PEEK_FRAMES[fi], PX);
    } else {
      // idle: blink every 2.6s ≈ 156 frames, show blink for 110ms ≈ 7 frames
      const cycle = t % 156;
      const isBlink = cycle < 7;
      drawFrame(ctx, PEEK_FRAMES[isBlink ? 1 : 0], PX);
    }

    rafRef.current = requestAnimationFrame(draw);
  }, [animState]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={COLS * PX}
      height={ROWS * PX}
      style={{ imageRendering: 'pixelated', display: 'block' }}
    />
  );
}

export function MelvinLogin({ style }) {
  const canvasRef = useRef(null);
  const tickRef = useRef(0);
  const rafRef = useRef(null);
  const PX = 4;
  const COLS = 22;
  const ROWS_FULL = 16;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    tickRef.current++;
    const t = tickRef.current;
    const cycle = t % 156;
    const isBlink = cycle < 7;
    drawFrame(ctx, IDLE_FRAMES[isBlink ? 1 : 0], PX);
    rafRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={COLS * PX}
      height={ROWS_FULL * PX}
      style={{ imageRendering: 'pixelated', ...style }}
    />
  );
}
