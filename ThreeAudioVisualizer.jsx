import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useTheme } from './ThemeContext';
import soundFx from './soundEngine';
import { PALETTE } from './palette';

// NoteTap 3D scene: a spiral notebook (pages flip, waveform strip, highlighted
// "marked" lines, bookmark ribbon) sitting on a circular sound-spectrum turntable.
//  - Drag (mouse / touch) = rotate the scene, with inertia
//  - Tap / click           = "Mark important": ribbon pops, page flips, sound wave ripples out
//  - isRecording = true    = spectrum gets taller / faster and sound waves emit automatically
export default function ThreeAudioVisualizer({ isRecording = false, size = "large", heightClass }) {
  const containerRef = useRef(null);
  const { theme } = useTheme();
  const [noWebGL, setNoWebGL] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const pal = PALETTE[theme] || PALETTE.light;
    const hexNum = (s) => parseInt(s.slice(1), 16);
    const GREEN = hexNum(pal.primary);
    const AMBER = hexNum(pal.secondary);
    const COVER = hexNum(pal.cover);
    const PAPER = hexNum(pal.paper);
    const accent = isRecording ? AMBER : GREEN;

    const w = container.clientWidth || 320;
    const h = container.clientHeight || (size === "large" ? 280 : 160);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
    camera.position.set(0, -0.22, 5.1);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch (err) {
      console.warn('WebGL not available:', err);
      setNoWebGL(true);   // friendly fallback instead of a blank page
      return;
    }
    setNoWebGL(false);
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // ---------- helpers ----------
    const fill = (color, opacity = 1) =>
      new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity });
    const lineMat = (color, opacity) =>
      new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    const addEdges = (mesh, color, opacity) => {
      const lines = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), lineMat(color, opacity));
      mesh.add(lines);
      return lines;
    };
    const ruledLines = (width, yTop, step, count, color, opacity) => {
      const pts = [];
      for (let r = 0; r < count; r++) {
        const y = yTop - r * step;
        pts.push(-width / 2, y, 0, width / 2, y, 0);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      return new THREE.LineSegments(g, lineMat(color, opacity));
    };

    // Everything the user can rotate lives in this group
    const group = new THREE.Group();
    const BASE_TILT = 0.28;
    group.rotation.x = BASE_TILT;
    scene.add(group);

    // ---------- 1. NOTEBOOK ----------
    const W = 1.5, H = 2.0, D = 0.18;
    const book = new THREE.Group();
    group.add(book);

    const cover = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), fill(COVER));
    addEdges(cover, accent, 0.95);
    book.add(cover);

    const pages = new THREE.Mesh(new THREE.BoxGeometry(W * 0.9, H * 0.93, 0.09), fill(PAPER));
    pages.position.set(0.03, 0, D / 2 + 0.045);
    addEdges(pages, accent, 0.35);
    book.add(pages);

    // ruled lines on the front page (local to pages, front face at z = 0.045)
    const FRONT = 0.047;
    const rules = ruledLines(W * 0.74, 0.52, 0.17, 8, accent, 0.5);
    rules.position.set(0.02, 0, FRONT);
    pages.add(rules);

    // amber highlighted "marked" lines
    const highlights = [1, 3, 6].map((idx) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.62, 0.085), fill(AMBER, 0.3));
      m.position.set(-0.04, 0.52 - idx * 0.17 + 0.055, FRONT + 0.002);
      pages.add(m);
      return m;
    });

    // mini waveform strip at the top of the page
    const strip = [];
    const STRIP_N = 15;
    for (let i = 0; i < STRIP_N; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.045, 1), fill(accent, 0.95));
      m.position.set(-0.45 + i * 0.0645, 0.73, FRONT + 0.003);
      m.scale.y = 0.05;
      pages.add(m);
      strip.push(m);
    }

    // spiral binding rings on the left edge
    for (let i = 0; i < 9; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.017, 8, 18), fill(accent, 0.95));
      ring.position.set(-W / 2, -0.84 + i * 0.21, 0.06);
      book.add(ring);
    }

    // bookmark ribbon
    const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.55, 0.012), fill(AMBER));
    ribbon.position.set(0.42, H / 2, D / 2 + 0.1);
    book.add(ribbon);

    // flipping page (pivot on the spine)
    const flipPivot = new THREE.Group();
    flipPivot.position.set(0.03 - W * 0.45, 0, D / 2 + 0.09 + 0.012);
    book.add(flipPivot);
    const flipMats = [];
    const flipPage = new THREE.Mesh(
      new THREE.PlaneGeometry(W * 0.9, H * 0.93),
      new THREE.MeshBasicMaterial({ color: PAPER, side: THREE.DoubleSide, transparent: true, opacity: 1 })
    );
    flipPage.position.x = W * 0.45;
    flipMats.push({ mat: flipPage.material, base: 1 });
    const flipEdge = addEdges(flipPage, accent, 0.6);
    flipMats.push({ mat: flipEdge.material, base: 0.6 });
    const flipRules = ruledLines(W * 0.74, 0.52, 0.17, 8, accent, 0.5);
    flipRules.position.set(0.02, 0, 0.003);
    flipPage.add(flipRules);
    flipMats.push({ mat: flipRules.material, base: 0.5 });
    flipPivot.add(flipPage);
    flipPivot.visible = false;

    // ---------- 2. SOUND SPECTRUM TURNTABLE ----------
    const ringGroup = new THREE.Group();
    ringGroup.position.y = -1.32;
    group.add(ringGroup);

    const R = 1.55, N = 56;
    const baseDisc = new THREE.Mesh(
      new THREE.RingGeometry(R - 0.14, R + 0.14, 72),
      new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.12, side: THREE.DoubleSide })
    );
    baseDisc.rotation.x = -Math.PI / 2;
    ringGroup.add(baseDisc);
    const baseLine = new THREE.Mesh(
      new THREE.RingGeometry(R - 0.17, R - 0.15, 96),
      new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    );
    baseLine.rotation.x = -Math.PI / 2;
    ringGroup.add(baseLine);

    const barGeo = new THREE.BoxGeometry(0.055, 1, 0.055);
    barGeo.translate(0, 0.5, 0);
    const cGreen = new THREE.Color(GREEN), cAmber = new THREE.Color(AMBER);
    const bars = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const k = Math.abs((i / N) * 2 - 1);
      const m = new THREE.Mesh(barGeo, fill(cGreen.clone().lerp(cAmber, k)));
      m.position.set(Math.cos(a) * R, 0, Math.sin(a) * R);
      m.scale.y = 0.1;
      ringGroup.add(m);
      bars.push(m);
    }

    // sound-wave ripples (spawned by taps / while recording)
    const ripples = [];
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(
        new THREE.RingGeometry(0.97, 1, 96),
        new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0, side: THREE.DoubleSide })
      );
      m.rotation.x = -Math.PI / 2;
      m.visible = false;
      ringGroup.add(m);
      ripples.push({ mesh: m, life: 0 });
    }
    let rippleIdx = 0;
    const spawnRipple = () => {
      const r = ripples[rippleIdx++ % ripples.length];
      r.life = 1;
      r.mesh.visible = true;
    };

    // floating "keyword" particles
    const P = 70;
    const pPos = new Float32Array(P * 3);
    for (let i = 0; i < P; i++) {
      const rad = 1.7 + Math.random() * 0.9;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pPos[i * 3] = rad * Math.sin(ph) * Math.cos(th);
      pPos[i * 3 + 1] = rad * Math.cos(ph) * 0.8;
      pPos[i * 3 + 2] = rad * Math.sin(ph) * Math.sin(th);
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const particles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ color: AMBER, size: 0.045, transparent: true, opacity: 0.8 })
    );
    group.add(particles);

    // ---------- 3. TOUCH / MOUSE INTERACTION ----------
    const el = renderer.domElement;
    el.style.touchAction = 'none';   // touch-drag rotates instead of scrolling the page
    el.style.cursor = 'grab';

    let dragging = false;
    let lastX = 0, lastY = 0, startX = 0, startY = 0, startT = 0;
    let velX = 0, velY = 0;
    let pulse = 0;                    // 1 -> 0 after a tap
    let flipT0 = -10;                 // clock time when the current page flip started
    const clock = new THREE.Clock();
    const clampX = (v) => Math.max(-1.0, Math.min(1.3, v));

    const onDown = (e) => {
      dragging = true;
      lastX = startX = e.clientX;
      lastY = startY = e.clientY;
      startT = performance.now();
      velX = velY = 0;
      el.style.cursor = 'grabbing';
      if (el.setPointerCapture) el.setPointerCapture(e.pointerId);
    };
    const onMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      group.rotation.y += dx * 0.012;
      group.rotation.x = clampX(group.rotation.x + dy * 0.012);
      velY = dx * 0.012;
      velX = dy * 0.012;
    };
    const onUp = (e) => {
      if (!dragging) return;
      dragging = false;
      el.style.cursor = 'grab';
      const moved = Math.hypot(e.clientX - startX, e.clientY - startY);
      if (moved < 6 && performance.now() - startT < 400) {   // tap = "mark important"
        pulse = 1;
        flipT0 = clock.getElapsedTime();
        spawnRipple();
        soundFx.playMark();
      }
    };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);

    // ---------- 4. ANIMATION LOOP ----------
    let animId;
    let nextFlip = 1.2;
    let nextRipple = 0.6;
    const speed = isRecording ? 1.8 : 1;
    const amp = isRecording ? 0.95 : 0.4;
    const ease = (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const ts = t * speed;

      // gentle floating notebook
      book.position.y = 0.14 + Math.sin(t * 1.2) * 0.05;
      book.rotation.y = Math.sin(t * 0.5) * 0.12;
      ringGroup.rotation.y = t * 0.15;
      particles.rotation.y = t * 0.06;

      // inertia after releasing the drag, and settle back to the base tilt
      if (!dragging) {
        group.rotation.y += velY;
        group.rotation.x = clampX(group.rotation.x + velX);
        velX *= 0.95;
        velY *= 0.95;
        group.rotation.x += (BASE_TILT - group.rotation.x) * 0.02;
      }

      // tap pulse
      pulse *= 0.93;
      const s = 1 + pulse * 0.06 + (dragging ? 0.02 : 0);
      group.scale.set(s, s, s);
      highlights.forEach((m, i) => { m.material.opacity = 0.3 + pulse * 0.5 + (Math.sin(t * 2 + i) * 0.5 + 0.5) * 0.1; });
      ribbon.position.y = H / 2 + pulse * 0.18;

      // spectrum bars
      for (let i = 0; i < N; i++) {
        const a = Math.abs(Math.sin(ts * 2.2 + i * 0.55)) * (0.55 + 0.45 * Math.sin(ts * 1.1 + i * 0.21));
        bars[i].scale.y = 0.06 + a * amp + pulse * 0.5 * Math.abs(Math.sin(i * 0.7 + ts * 6));
      }

      // waveform strip on the page
      for (let i = 0; i < STRIP_N; i++) {
        const v = (Math.sin(ts * 3 + i * 0.9) + Math.sin(ts * 1.7 + i * 1.7)) * 0.25 + 0.5;
        strip[i].scale.y = 0.03 + v * (isRecording ? 0.2 : 0.1) + pulse * 0.1;
      }

      // page flip (every few seconds, and on every tap)
      if (t >= nextFlip) { flipT0 = t; nextFlip = t + 4.5; }
      const p = (t - flipT0) / 1.6;
      if (p >= 0 && p <= 1) {
        flipPivot.visible = true;
        flipPivot.rotation.y = -Math.PI * 0.98 * ease(p);
        const fade = p > 0.7 ? 1 - (p - 0.7) / 0.3 : 1;
        flipMats.forEach(({ mat, base }) => { mat.opacity = base * fade; });
      } else {
        flipPivot.visible = false;
      }

      // sound-wave ripples
      if (isRecording && t >= nextRipple) { spawnRipple(); nextRipple = t + 1.1; }
      ripples.forEach((r) => {
        if (r.life <= 0) return;
        r.life -= 0.014;
        const k = 1 - r.life;
        r.mesh.scale.setScalar(R * (1 + k * 0.45));
        r.mesh.material.opacity = Math.max(0, r.life) * 0.85;
        if (r.life <= 0) r.mesh.visible = false;
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
      renderer.dispose();
      if (container) container.innerHTML = '';
    };
  }, [isRecording, size, theme]);

  return (
    <div className="relative w-full">
      <div
        ref={containerRef}
        className={`w-full ${heightClass || (size === "large" ? "h-64 sm:h-72" : "h-40")} flex items-center justify-center`}
      >
        {noWebGL && (
          <div className="text-center text-xs font-mono text-c8c9c8e px-6">
            <div className="text-4xl mb-2">📓</div>
            3D view is not supported on this device/browser.<br />Enable hardware acceleration to see it.
          </div>
        )}
      </div>
      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-mono text-c7a8e80 pointer-events-none select-none whitespace-nowrap">
        👆 Drag to rotate • Tap to mark important
      </span>
    </div>
  );
}
