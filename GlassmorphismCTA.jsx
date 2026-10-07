import { useState, useEffect, useRef } from 'react';

export default function GlassmorphismCTA({
  onClick,
  title = "Start Learning",
  subtitle = "Next Step in Workflow",
  avatarSrc = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
  shimmerColor = "rgba(230, 205, 184, 0.8)",
  glowColor = "rgba(230, 205, 184, 0.25)",
  speed = "3.8s",
  className = ""
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group isolate inline-flex cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] rounded-full relative ${className}`}
      style={{
        '--spread': '90deg',
        '--shimmer-color': shimmerColor,
        '--radius': '9999px',
        '--speed': speed,
        '--cut': '1px',
        '--bg': 'rgba(59, 42, 36, 0.96)',
        boxShadow: '0 10px 28px -12px rgba(59, 42, 36, 0.55)'
      }}
    >
      {/* Revolving outer conic shimmer highlight */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute inset-[-200%] w-[400%] h-[400%]"
          style={{ animation: `rotate-gradient ${speed} linear infinite` }}
        >
          <div 
            className="absolute inset-0"
            style={{
              background: `conic-gradient(from calc(270deg - 45deg), transparent 0, ${shimmerColor} 90deg, transparent 90deg)`
            }}
          />
        </div>
      </div>

      <div 
        className="absolute rounded-full backdrop-blur-md pointer-events-none"
        style={{ inset: '1px', background: 'var(--bg)' }}
      />

      <div 
        className="z-10 flex gap-3 sm:w-auto overflow-hidden text-sm sm:text-base font-medium text-white w-full py-3.5 px-6 relative items-center"
        style={{ borderRadius: '9999px' }}
      >
        {/* Revolving border beam */}
        <div 
          style={{
            position: 'absolute',
            content: "''",
            display: 'block',
            width: '200%',
            height: '200%',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.14), rgba(230, 205, 184, 0.25), rgba(212, 160, 162, 0.2), transparent)',
            animation: `borderBeamRotation ${speed} infinite linear`,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        />

        <div 
          style={{
            position: 'absolute',
            inset: '1px',
            background: 'rgba(46, 32, 27, 0.98)',
            borderRadius: '9999px',
            backdropFilter: 'blur(10px)',
            pointerEvents: 'none',
          }}
        />

        {/* Avatar portrait */}
        <img 
          src={avatarSrc} 
          alt="Avatar" 
          className="relative w-8 h-8 rounded-full border border-[#E6CDB8]/50 object-cover  z-10 flex-shrink-0"
        />

        {/* Label texts */}
        <div className="flex flex-col text-left relative z-10">
          <span className="font-bold text-[#FBF7F1] tracking-tight text-sm sm:text-base flex items-center gap-1.5 leading-tight">
            <span>{title}</span>
            <span className="text-[#D4A0A2] group-hover:translate-x-1 transition-transform">&rarr;</span>
          </span>
          <span className="text-[10px] text-[#CDB8AB] font-mono leading-tight">
            {subtitle}
          </span>
        </div>

        {/* Generative Sparkle badge */}
        <div className="relative z-10 ml-auto w-6 h-6 rounded-full bg-[#D4A0A2]/20 border border-[#D4A0A2]/40 flex items-center justify-center text-[#D4A0A2] text-xs">
          ★
        </div>
      </div>
    </button>
  );
}

