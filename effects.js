import { useEffect } from 'react';

// Site-wide interactive effects: cursor spotlight + gentle 3D tilt on cards
export function useSiteEffects() {
  useEffect(() => {
    const root = document.documentElement;
    let tilted = null;
    const reset = () => {
      if (tilted) { tilted.style.transition = 'transform .45s cubic-bezier(.2,.7,.2,1)'; tilted.style.transform = ''; tilted = null; }
    };
    const onMove = (e) => {
      root.style.setProperty('--mx', e.clientX + 'px');
      root.style.setProperty('--my', e.clientY + 'px');
      const t = e.target.closest ? e.target.closest('main .rounded-2xl.border') : null;
      // skip big cards, forms and the 3D canvas card
      if (!t || t.offsetWidth > 560 || t.querySelector('canvas, input, textarea, select')) { reset(); return; }
      if (tilted !== t) { reset(); tilted = t; t.style.transition = 'transform .12s ease-out'; }
      const r = t.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      t.style.transform = `perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateY(-3px)`;
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerleave', reset);
    return () => { document.removeEventListener('pointermove', onMove); document.removeEventListener('pointerleave', reset); };
  }, []);
}
