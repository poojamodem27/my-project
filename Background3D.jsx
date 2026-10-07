import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from './ThemeContext';
import { PALETTE } from './palette';

// Project-wide 3D background: layered "silk" sound waves on the horizon + soft glow orbs.
// calm=false -> full scene (welcome page), calm=true -> softer scene behind the app pages.

const VERT = `
uniform float uTime; uniform float uAmp; uniform float uFreq; uniform float uPhase;
varying float vH; varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 p = position;
  float h = sin(p.x * uFreq + uTime * 0.55 + uPhase) * 0.55
          + sin(p.y * uFreq * 1.3 - uTime * 0.40 + uPhase * 1.7) * 0.35
          + sin((p.x + p.y) * uFreq * 0.6 + uTime * 0.30) * 0.25;
  p.z += h * uAmp;
  vH = h;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;

const FRAG = `
uniform vec3 uColorA; uniform vec3 uColorB; uniform float uAlpha; uniform float uLines;
varying float vH; varying vec2 vUv;
void main() {
  vec3 col = mix(uColorA, uColorB, smoothstep(0.0, 1.0, vUv.x * 0.8 + vH * 0.25 + 0.1));
  float fade = smoothstep(0.0, 0.3, vUv.y) * (1.0 - smoothstep(0.7, 1.0, vUv.y));
  float side = smoothstep(0.0, 0.12, vUv.x) * (1.0 - smoothstep(0.88, 1.0, vUv.x));
  float contour = abs(fract(vH * 3.2 + 0.5) - 0.5);
  float line = 1.0 - smoothstep(0.0, 0.07, contour);
  float a = uAlpha * (0.3 + 0.7 * smoothstep(-0.6, 0.9, vH)) + line * uLines;
  gl_FragColor = vec4(col, clamp(a, 0.0, 1.0) * fade * side);
}`;

function orbTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export default function Background3D({ calm = false }) {
  const mountRef = useRef(null);
  const { theme } = useTheme();
  const calmRef = useRef(calm);
  calmRef.current = calm;   // read inside the loop, no scene restart

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const pal = PALETTE[theme] || PALETTE.light;
    const dark = theme === 'dark';
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); } catch (e) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 200);
    camera.position.set(0, 2.4, 9);

    // 1. silk wave layers
    const layerCfg = [
      { y: -3.4, z: -6, a: pal.secondary, b: pal.bg, alpha: 0.34, lines: 0.05, amp: 1.7, freq: 0.30, phase: 0 },
      { y: -3.0, z: -2, a: pal.primary, b: pal.secondary, alpha: 0.24, lines: 0.09, amp: 1.4, freq: 0.42, phase: 2 },
      { y: -2.6, z: 2, a: pal.primary, b: pal.primary, alpha: 0.15, lines: 0.12, amp: 1.1, freq: 0.55, phase: 4 },
    ];
    const layers = layerCfg.map((c) => {
      const mat = new THREE.ShaderMaterial({
        vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 }, uAmp: { value: c.amp }, uFreq: { value: c.freq }, uPhase: { value: c.phase },
          uColorA: { value: new THREE.Color(c.a) }, uColorB: { value: new THREE.Color(c.b) },
          uAlpha: { value: c.alpha }, uLines: { value: c.lines },
        },
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(52, 18, 110, 56), mat);
      mesh.rotation.x = -Math.PI / 2.3;
      mesh.position.set(0, c.y, c.z);
      scene.add(mesh);
      return { mesh, mat, cfg: c };
    });

    // 2. soft glow orbs
    const tex = orbTexture();
    const orbs = [[-7, 4.5, -10, 12, pal.secondary], [8, 5, -11, 13, pal.primary], [0, 6, -13, 15, pal.secondary]].map(([x, y, z, s, col], i) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: col, transparent: true, opacity: dark ? 0.12 : 0.22, depthWrite: false }));
      sp.position.set(x, y, z); sp.scale.set(s, s, 1); sp.userData = { x, y, i };
      scene.add(sp);
      return sp;
    });

    let mx = 0, my = 0;
    const onMove = (e) => { mx = (e.clientX / window.innerWidth - 0.5) * 2; my = (e.clientY / window.innerHeight - 0.5) * 2; };
    const onResize = () => {
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    let pulse = 0;
    const onPulse = (e) => { pulse = Math.max(pulse, (e.detail || 1)); };
    window.addEventListener('notetap-pulse', onPulse);
    let id, k = 0;   // k: 0 = welcome (full) -> 1 = inner pages (calm)
    const loop = () => {
      id = requestAnimationFrame(loop);
      const t = clock.getElapsedTime();
      k += ((calmRef.current ? 1 : 0) - k) * 0.05;
      pulse *= 0.965;
      layers.forEach(({ mesh, mat, cfg }) => {
        mat.uniforms.uTime.value = t;
        mat.uniforms.uAlpha.value = cfg.alpha * (1 - 0.45 * k) * (1 + pulse * 0.8);
        mat.uniforms.uAmp.value = cfg.amp * (1 + pulse * 1.1);
        mesh.position.y = cfg.y - k * 0.7;
      });
      orbs.forEach((o) => {
        o.position.x = o.userData.x + Math.sin(t * 0.15 + o.userData.i) * 1.2;
        o.position.y = o.userData.y + Math.cos(t * 0.12 + o.userData.i * 2) * 0.8;
        o.material.opacity = (dark ? 0.12 : 0.22) * (1 - 0.3 * k) * (1 + pulse * 1.2);
      });
      camera.position.x += (mx * 1.1 - camera.position.x) * 0.03;
      camera.position.y += (2.4 - my * 0.4 - camera.position.y) * 0.03;
      camera.lookAt(0, 0.9, -4);
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('notetap-pulse', onPulse);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
      tex.dispose();
      renderer.dispose();
      mount.innerHTML = '';
    };
  }, [theme]);

  return (
    <>
      <div ref={mountRef} aria-hidden="true" className="fixed inset-0 z-0" />
      {/* soft milk veil on inner pages keeps text clean and readable */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-700"
        style={{ opacity: calm ? 1 : 0, background: 'linear-gradient(180deg, rgb(var(--page-bg) / 0.5), rgb(var(--page-bg) / 0.2))' }}
      />
    </>
  );
}
