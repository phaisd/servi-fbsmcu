"use client";

import * as React from "react";

export function DharmachakraMotion() {
  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none select-none overflow-hidden">
      <style>{`
        @keyframes wheel-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes wheel-counter-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes golden-radiance-pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.94); }
          50% { opacity: 0.8; transform: scale(1.08); }
        }
      `}</style>

      {/* Radiant Golden Halo */}
      <div
        className="absolute w-[480px] h-[480px] sm:w-[620px] sm:h-[620px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(251,191,36,0.35) 0%, rgba(217,119,6,0.2) 45%, rgba(255,255,255,0) 70%)",
          animation: "golden-radiance-pulse 6s ease-in-out infinite",
        }}
      />

      {/* The 8-Spoke Golden Wheel of Dhamma */}
      <div
        className="relative z-10 w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] lg:w-[480px] lg:h-[480px]"
        style={{
          animation: "wheel-rotate 55s linear infinite",
          filter: "drop-shadow(0 14px 30px rgba(180, 83, 9, 0.28)) drop-shadow(0 4px 10px rgba(0, 0, 0, 0.1))",
        }}
      >
        <svg
          viewBox="0 0 600 600"
          className="w-full h-full overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="dhammaGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="25%" stopColor="#fbbf24" />
              <stop offset="65%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>

            <linearGradient id="dhammaGoldLight" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
          </defs>

          {/* Outer Rim */}
          <circle cx="300" cy="300" r="230" stroke="url(#dhammaGold)" strokeWidth="24" fill="none" />
          <circle cx="300" cy="300" r="206" stroke="url(#dhammaGold)" strokeWidth="6" fill="none" />
          <circle cx="300" cy="300" r="242" stroke="url(#dhammaGold)" strokeWidth="3" fill="none" opacity="0.6" />

          {/* 16 Decorative Studs on the Outer Rim */}
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (i * 360) / 16;
            const rad = (angle * Math.PI) / 180;
            const x = Math.round((300 + Math.cos(rad) * 230) * 100) / 100;
            const y = Math.round((300 + Math.sin(rad) * 230) * 100) / 100;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="8" fill="url(#dhammaGoldLight)" stroke="#92400e" strokeWidth="2" />
                <circle cx={x} cy={y} r="3" fill="#ffffff" />
              </g>
            );
          })}

          {/* 8 Spokes (อริยมรรคมีองค์ 8) */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 360) / 8;
            return (
              <g key={i} transform={`rotate(${angle}, 300, 300)`}>
                {/* Spoke Shaft */}
                <path
                  d="M 293 300 L 291 100 L 309 100 L 307 300 Z"
                  fill="url(#dhammaGold)"
                />
                {/* Spoke Ridge */}
                <line x1="300" y1="300" x2="300" y2="100" stroke="#fef08a" strokeWidth="3" />
                {/* Spoke Crown Capital */}
                <path d="M 285 106 L 315 106 L 300 95 Z" fill="#fef08a" />
              </g>
            );
          })}

          {/* Central Hub (ดุมกงล้อ) */}
          <circle cx="300" cy="300" r="75" fill="url(#dhammaGold)" stroke="#78350f" strokeWidth="4" />
          <circle cx="300" cy="300" r="62" stroke="#fef08a" strokeWidth="3" fill="none" />
          <circle cx="300" cy="300" r="42" fill="#78350f" />
          <circle cx="300" cy="300" r="28" fill="url(#dhammaGoldLight)" />
          <circle cx="300" cy="300" r="10" fill="#ffffff" />
        </svg>
      </div>
    </div>
  );
}
