"use client";

import * as React from "react";

export function LotusBloomMotion() {
  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none select-none overflow-hidden">
      <style>{`
        @keyframes lotus-breathe {
          0%, 100% {
            transform: scale(0.96) translateY(4px);
          }
          50% {
            transform: scale(1.03) translateY(-6px);
          }
        }
        @keyframes petal-bloom-outer-left {
          0%, 100% { transform: rotate(0deg) scale(0.94); }
          50% { transform: rotate(-7deg) scale(1.04); }
        }
        @keyframes petal-bloom-outer-right {
          0%, 100% { transform: rotate(0deg) scale(0.94); }
          50% { transform: rotate(7deg) scale(1.04); }
        }
        @keyframes petal-bloom-mid-left {
          0%, 100% { transform: rotate(0deg) scale(0.96); }
          50% { transform: rotate(-4deg) scale(1.03); }
        }
        @keyframes petal-bloom-mid-right {
          0%, 100% { transform: rotate(0deg) scale(0.96); }
          50% { transform: rotate(4deg) scale(1.03); }
        }
        @keyframes aura-pulse {
          0%, 100% { opacity: 0.35; transform: scale(0.92); }
          50% { opacity: 0.75; transform: scale(1.1); }
        }
        @keyframes aura-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes sparkle-float {
          0% { transform: translateY(0px) scale(0.6); opacity: 0; }
          40% { opacity: 0.9; }
          80% { opacity: 0.7; }
          100% { transform: translateY(-70px) scale(1.1); opacity: 0; }
        }
        @keyframes ripple-wave {
          0% { transform: scale(0.85); opacity: 0.6; }
          100% { transform: scale(1.35); opacity: 0; }
        }
      `}</style>

      {/* Radiant Background Aura Rays */}
      <div
        className="absolute w-[440px] h-[440px] sm:w-[580px] sm:h-[580px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(251,191,36,0.3) 0%, rgba(244,114,182,0.18) 40%, rgba(255,255,255,0) 70%)",
          animation: "aura-pulse 7s ease-in-out infinite",
        }}
      />

      {/* Rotating Divine Ray Spokes */}
      <div
        className="absolute w-[500px] h-[500px] sm:w-[650px] sm:h-[650px] opacity-25 pointer-events-none"
        style={{
          background: "conic-gradient(from 0deg, rgba(251,191,36,0.2) 0deg 20deg, transparent 20deg 45deg, rgba(244,114,182,0.2) 45deg 65deg, transparent 65deg 90deg, rgba(251,191,36,0.2) 90deg 110deg, transparent 110deg 135deg, rgba(244,114,182,0.2) 135deg 155deg, transparent 155deg 180deg, rgba(251,191,36,0.2) 180deg 200deg, transparent 200deg 225deg, rgba(244,114,182,0.2) 225deg 245deg, transparent 245deg 270deg, rgba(251,191,36,0.2) 270deg 290deg, transparent 290deg 315deg, rgba(244,114,182,0.2) 315deg 335deg, transparent 335deg 360deg)",
          animation: "aura-rotate 60s linear infinite",
        }}
      />

      {/* Water Ripple Waves at the Base */}
      <div className="absolute bottom-[22%] sm:bottom-[18%] w-64 h-16 sm:w-80 sm:h-20 pointer-events-none">
        <div
          className="absolute inset-0 rounded-[100%] border border-amber-300/40"
          style={{ animation: "ripple-wave 4s ease-out infinite" }}
        />
        <div
          className="absolute inset-0 rounded-[100%] border border-rose-300/40"
          style={{ animation: "ripple-wave 4s ease-out infinite 2s" }}
        />
      </div>

      {/* Golden Sparkles Floating Upward */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
          { left: "42%", bottom: "35%", delay: "0s", duration: "4.5s", size: "w-2 h-2" },
          { left: "48%", bottom: "38%", delay: "1.2s", duration: "5.2s", size: "w-2.5 h-2.5" },
          { left: "54%", bottom: "34%", delay: "2.4s", duration: "4.8s", size: "w-2 h-2" },
          { left: "38%", bottom: "42%", delay: "0.8s", duration: "6s", size: "w-1.5 h-1.5" },
          { left: "58%", bottom: "40%", delay: "1.9s", duration: "5.5s", size: "w-2 h-2" },
          { left: "45%", bottom: "45%", delay: "3.1s", duration: "4.2s", size: "w-3 h-3" },
        ].map((s, idx) => (
          <div
            key={idx}
            className={`absolute ${s.size} rounded-full bg-gradient-to-r from-amber-300 to-amber-100 shadow-[0_0_8px_rgba(251,191,36,0.9)]`}
            style={{
              left: s.left,
              bottom: s.bottom,
              animation: `sparkle-float ${s.duration} ease-in-out infinite ${s.delay}`,
            }}
          />
        ))}
      </div>

      {/* The Master Blooming Sacred Lotus SVG */}
      <div
        className="relative z-10 w-[300px] h-[300px] sm:w-[420px] sm:h-[420px] lg:w-[500px] lg:h-[500px] transition-transform duration-700"
        style={{
          animation: "lotus-breathe 7s ease-in-out infinite",
          filter: "drop-shadow(0 14px 28px rgba(180, 83, 9, 0.18)) drop-shadow(0 4px 10px rgba(0, 0, 0, 0.08))",
        }}
      >
        <svg
          viewBox="0 0 600 600"
          className="w-full h-full overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradients for Lotus Petals */}
            <linearGradient id="lotusPadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="70%" stopColor="#047857" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>

            <linearGradient id="outerPetalPink" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#fce7f3" />
              <stop offset="70%" stopColor="#f472b6" />
              <stop offset="100%" stopColor="#db2777" />
            </linearGradient>

            <linearGradient id="midPetalPink" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#fff1f2" />
              <stop offset="45%" stopColor="#fbcfe8" />
              <stop offset="85%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#be185d" />
            </linearGradient>

            <linearGradient id="innerPetalPink" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#fdf2f8" />
              <stop offset="85%" stopColor="#f472b6" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>

            <radialGradient id="goldenPistil" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="45%" stopColor="#f59e0b" />
              <stop offset="90%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#b45309" />
            </radialGradient>

            <linearGradient id="goldStem" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>

          {/* 1. Lotus Pad (ใบบัวรองรับฐาน) */}
          <g transform="translate(300, 480) scale(1, 0.42)">
            <ellipse cx="0" cy="0" rx="240" ry="85" fill="url(#lotusPadGrad)" opacity="0.85" />
            {/* Pad Veins */}
            <path d="M 0 0 L -180 -35 M 0 0 L -140 45 M 0 0 L 0 75 M 0 0 L 140 45 M 0 0 L 180 -35 M 0 0 L -80 -60 M 0 0 L 80 -60" stroke="#10b981" strokeWidth="2.5" opacity="0.4" fill="none" />
            <circle cx="0" cy="0" r="14" fill="#047857" />
          </g>

          {/* 2. Outer Lower Petals (บัวชั้นนอก - ค่อยๆ คลี่กว้าง) */}
          <g id="outer-petals" transform="translate(300, 430)">
            {/* Far Left Outermost Petal */}
            <path
              d="M 0 0 C -120 -20 -220 -30 -240 -110 C -220 -150 -130 -110 0 0 Z"
              fill="url(#outerPetalPink)"
              opacity="0.95"
              style={{
                transformOrigin: "0px 0px",
                animation: "petal-bloom-outer-left 7s ease-in-out infinite",
              }}
            />
            {/* Far Right Outermost Petal */}
            <path
              d="M 0 0 C 120 -20 220 -30 240 -110 C 220 -150 130 -110 0 0 Z"
              fill="url(#outerPetalPink)"
              opacity="0.95"
              style={{
                transformOrigin: "0px 0px",
                animation: "petal-bloom-outer-right 7s ease-in-out infinite",
              }}
            />
            {/* Low Left Petal */}
            <path
              d="M 0 0 C -100 -50 -180 -100 -180 -180 C -140 -200 -80 -140 0 0 Z"
              fill="url(#outerPetalPink)"
              style={{
                transformOrigin: "0px 0px",
                animation: "petal-bloom-mid-left 7s ease-in-out infinite",
              }}
            />
            {/* Low Right Petal */}
            <path
              d="M 0 0 C 100 -50 180 -100 180 -180 C 140 -200 80 -140 0 0 Z"
              fill="url(#outerPetalPink)"
              style={{
                transformOrigin: "0px 0px",
                animation: "petal-bloom-mid-right 7s ease-in-out infinite",
              }}
            />
          </g>

          {/* 3. Mid Layer Petals (กลีบชั้นกลาง) */}
          <g id="mid-petals" transform="translate(300, 430)">
            {/* Mid Left */}
            <path
              d="M 0 0 C -80 -80 -140 -170 -110 -250 C -60 -250 -30 -160 0 0 Z"
              fill="url(#midPetalPink)"
              style={{
                transformOrigin: "0px 0px",
                animation: "petal-bloom-mid-left 7s ease-in-out infinite 0.3s",
              }}
            />
            {/* Mid Right */}
            <path
              d="M 0 0 C 80 -80 140 -170 110 -250 C 60 -250 30 -160 0 0 Z"
              fill="url(#midPetalPink)"
              style={{
                transformOrigin: "0px 0px",
                animation: "petal-bloom-mid-right 7s ease-in-out infinite 0.3s",
              }}
            />
            {/* Center-Left Petal */}
            <path
              d="M 0 0 C -50 -100 -80 -210 -50 -290 C -10 -275 0 -180 0 0 Z"
              fill="url(#innerPetalPink)"
              style={{
                transformOrigin: "0px 0px",
                animation: "petal-bloom-mid-left 7s ease-in-out infinite 0.5s",
              }}
            />
            {/* Center-Right Petal */}
            <path
              d="M 0 0 C 50 -100 80 -210 50 -290 C 10 -275 0 -180 0 0 Z"
              fill="url(#innerPetalPink)"
              style={{
                transformOrigin: "0px 0px",
                animation: "petal-bloom-mid-right 7s ease-in-out infinite 0.5s",
              }}
            />
            {/* Crown Center Petal (กลีบยอดใจกลาง ยื่นสง่างาม) */}
            <path
              d="M 0 0 C -40 -120 -40 -240 0 -320 C 40 -240 40 -120 0 0 Z"
              fill="url(#innerPetalPink)"
            />
            {/* Center Petal Subtle Highlight Spine */}
            <path d="M 0 -20 L 0 -310" stroke="#fbcfe8" strokeWidth="2.5" opacity="0.6" strokeLinecap="round" />
          </g>

          {/* 4. Golden Core & Stamens (ฝักบัวและเกสรสีทองอร่าม) */}
          <g id="lotus-heart" transform="translate(300, 390)">
            {/* Golden Pod / Receptacle */}
            <ellipse cx="0" cy="0" rx="38" ry="24" fill="url(#goldenPistil)" />
            {/* Pod Seed Nodes (จุดเมล็ดบัว) */}
            <circle cx="0" cy="-6" r="3.5" fill="#78350f" />
            <circle cx="-16" cy="-3" r="3" fill="#78350f" />
            <circle cx="16" cy="-3" r="3" fill="#78350f" />
            <circle cx="-8" cy="6" r="3" fill="#78350f" />
            <circle cx="8" cy="6" r="3" fill="#78350f" />
            <circle cx="-24" cy="4" r="2.5" fill="#78350f" />
            <circle cx="24" cy="4" r="2.5" fill="#78350f" />

            {/* Golden Stamens (เส้นเกสรรอบฝัก) */}
            {[-32, -26, -20, -14, -8, -2, 4, 10, 16, 22, 28, 34].map((x, i) => {
              const yCurve = Math.round((-18 - Math.sin((i / 11) * Math.PI) * 14) * 100) / 100;
              const startX = Math.round(x * 1.1 * 100) / 100;
              const ctrlX = Math.round(x * 1.3 * 100) / 100;
              const endX = Math.round(x * 1.4 * 100) / 100;
              const endY = Math.round((yCurve - 8) * 100) / 100;
              const circleY = Math.round((yCurve - 9) * 100) / 100;
              return (
                <g key={i}>
                  <path
                    d={`M ${startX} 6 Q ${ctrlX} ${yCurve} ${endX} ${endY}`}
                    stroke="url(#goldStem)"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <circle cx={endX} cy={circleY} r="3" fill="#fef08a" stroke="#d97706" strokeWidth="1" />
                </g>
              );
            })}
          </g>

          {/* Light Reflection Droplets on Lower Petals */}
          <ellipse cx="250" cy="415" rx="5" ry="3" fill="#ffffff" opacity="0.75" />
          <ellipse cx="340" cy="425" rx="4" ry="2.5" fill="#ffffff" opacity="0.65" />
        </svg>
      </div>
    </div>
  );
}
