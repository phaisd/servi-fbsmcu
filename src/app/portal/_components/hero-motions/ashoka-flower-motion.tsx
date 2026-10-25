"use client";

import * as React from "react";

export function AshokaFlowerMotion() {
  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none select-none overflow-hidden">
      <style>{`
        @keyframes ashoka-sway {
          0%, 100% {
            transform: rotate(-1.5deg) scale(0.98);
          }
          50% {
            transform: rotate(2deg) scale(1.02);
          }
        }
        @keyframes ashoka-stamen-flutter {
          0%, 100% {
            transform: rotate(0deg) scale(0.98);
          }
          50% {
            transform: rotate(3deg) scale(1.03);
          }
        }
        @keyframes warm-aura-pulse {
          0%, 100% { opacity: 0.35; transform: scale(0.92); }
          50% { opacity: 0.7; transform: scale(1.08); }
        }
        @keyframes pollen-drift {
          0% { transform: translateY(0) translateX(0) scale(0.5); opacity: 0; }
          30% { opacity: 0.85; }
          70% { opacity: 0.6; }
          100% { transform: translateY(-80px) translateX(25px) scale(1.1); opacity: 0; }
        }
      `}</style>

      {/* Warm Saffron & Coral Aura */}
      <div
        className="absolute w-[460px] h-[460px] sm:w-[600px] sm:h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(245,158,11,0.32) 0%, rgba(239,68,68,0.2) 40%, rgba(255,255,255,0) 70%)",
          animation: "warm-aura-pulse 6.5s ease-in-out infinite",
        }}
      />

      {/* Golden/Amber Pollen Particles Drifting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
          { left: "40%", bottom: "30%", delay: "0s", duration: "5s", size: "w-2.5 h-2.5" },
          { left: "46%", bottom: "34%", delay: "1.4s", duration: "4.8s", size: "w-2 h-2" },
          { left: "55%", bottom: "32%", delay: "2.5s", duration: "5.5s", size: "w-3 h-3" },
          { left: "35%", bottom: "38%", delay: "0.7s", duration: "6s", size: "w-1.5 h-1.5" },
          { left: "60%", bottom: "36%", delay: "1.8s", duration: "5.2s", size: "w-2 h-2" },
          { left: "50%", bottom: "42%", delay: "3.2s", duration: "4.5s", size: "w-2.5 h-2.5" },
        ].map((p, idx) => (
          <div
            key={idx}
            className={`absolute ${p.size} rounded-full bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 shadow-[0_0_10px_rgba(245,158,11,0.85)]`}
            style={{
              left: p.left,
              bottom: p.bottom,
              animation: `pollen-drift ${p.duration} ease-in-out infinite ${p.delay}`,
            }}
          />
        ))}
      </div>

      {/* Ashoka Blossoms Cluster SVG */}
      <div
        className="relative z-10 w-[300px] h-[300px] sm:w-[420px] sm:h-[420px] lg:w-[500px] lg:h-[500px]"
        style={{
          animation: "ashoka-sway 8s ease-in-out infinite",
          transformOrigin: "bottom center",
          filter: "drop-shadow(0 16px 32px rgba(217, 119, 6, 0.22)) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08))",
        }}
      >
        <svg
          viewBox="0 0 600 600"
          className="w-full h-full overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Ashoka Branch & Leaf Gradients */}
            <linearGradient id="ashokaBranch" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#451a03" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>

            <linearGradient id="ashokaLeaf" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#15803d" />
              <stop offset="70%" stopColor="#166534" />
              <stop offset="100%" stopColor="#14532d" />
            </linearGradient>

            {/* Ashoka Flower Petal Gradient (Yellow to Saffron-Orange to Scarlet) */}
            <linearGradient id="ashokaPetalWarm" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="40%" stopColor="#fbbf24" />
              <stop offset="75%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>

            <linearGradient id="ashokaPetalScarlet" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="30%" stopColor="#f59e0b" />
              <stop offset="70%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>

            {/* Golden Stamen Filament Gradient */}
            <linearGradient id="ashokaStamen" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#ea580c" />
              <stop offset="60%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#fef08a" />
            </linearGradient>

            <radialGradient id="ashokaCore" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#991b1b" />
            </radialGradient>
          </defs>

          {/* 1. Branch and Leaves (กิ่งและใบอโศกทรงรียาว) */}
          <g id="branch-and-leaves">
            {/* Main Branch */}
            <path
              d="M 300 520 Q 305 440 300 360"
              stroke="url(#ashokaBranch)"
              strokeWidth="12"
              strokeLinecap="round"
              fill="none"
            />
            {/* Left Leaf */}
            <path
              d="M 298 460 C 230 460 170 420 130 380 C 180 340 260 380 298 420 Z"
              fill="url(#ashokaLeaf)"
              opacity="0.9"
            />
            <path d="M 298 435 Q 220 405 135 382" stroke="#22c55e" strokeWidth="2" fill="none" opacity="0.6" />

            {/* Right Leaf */}
            <path
              d="M 302 470 C 370 470 430 430 470 390 C 420 350 340 390 302 430 Z"
              fill="url(#ashokaLeaf)"
              opacity="0.9"
            />
            <path d="M 302 445 Q 380 415 465 392" stroke="#22c55e" strokeWidth="2" fill="none" opacity="0.6" />
          </g>

          {/* 2. Long Graceful Ashoka Stamens (เกสรยาวสัญลักษณ์เด่นของดอกอโศก) */}
          <g
            id="stamens-cluster"
            style={{
              animation: "ashoka-stamen-flutter 5s ease-in-out infinite",
              transformOrigin: "300px 300px",
            }}
          >
            {[
              { angle: -65, length: 155, curve: -20 },
              { angle: -50, length: 175, curve: -15 },
              { angle: -35, length: 190, curve: -10 },
              { angle: -20, length: 200, curve: -5 },
              { angle: -5, length: 205, curve: 0 },
              { angle: 10, length: 205, curve: 5 },
              { angle: 25, length: 195, curve: 10 },
              { angle: 40, length: 180, curve: 15 },
              { angle: 55, length: 165, curve: 20 },
              { angle: 70, length: 150, curve: 25 },
            ].map((stamen, i) => {
              const rad = ((stamen.angle - 90) * Math.PI) / 180;
              const endX = Math.round((300 + Math.cos(rad) * stamen.length) * 100) / 100;
              const endY = Math.round((300 + Math.sin(rad) * stamen.length) * 100) / 100;
              const midX = Math.round((300 + Math.cos(rad) * (stamen.length * 0.5) + stamen.curve) * 100) / 100;
              const midY = Math.round((300 + Math.sin(rad) * (stamen.length * 0.5)) * 100) / 100;

              return (
                <g key={i}>
                  <path
                    d={`M 300 310 Q ${midX} ${midY} ${endX} ${endY}`}
                    stroke="url(#ashokaStamen)"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                  {/* Glowing Anther Tip (หัวเกสรสีแดงส้มเรืองแสง) */}
                  <ellipse
                    cx={endX}
                    cy={endY}
                    rx="4.5"
                    ry="3.5"
                    fill="#fef08a"
                    stroke="#dc2626"
                    strokeWidth="1.5"
                    transform={`rotate(${stamen.angle}, ${endX}, ${endY})`}
                  />
                  <circle cx={endX} cy={endY} r="1.5" fill="#ffffff" />
                </g>
              );
            })}
          </g>

          {/* 3. Ashoka Flower Blossom Cluster (ช่อดอกอโศกทรงกลม) */}
          <g id="flower-blossoms">
            {/* Center Background Blossom */}
            <circle cx="300" cy="300" r="48" fill="url(#ashokaCore)" />

            {/* Petals Radial Cluster (4-5 กลีบต่อดอก ย่อยรวมเป็นช่อใหญ่) */}
            {[
              { x: 300, y: 245, scale: 1, rot: 0, grad: "url(#ashokaPetalWarm)" },
              { x: 350, y: 270, scale: 0.95, rot: 45, grad: "url(#ashokaPetalScarlet)" },
              { x: 360, y: 325, scale: 0.9, rot: 90, grad: "url(#ashokaPetalWarm)" },
              { x: 335, y: 365, scale: 0.85, rot: 135, grad: "url(#ashokaPetalScarlet)" },
              { x: 265, y: 365, scale: 0.85, rot: 225, grad: "url(#ashokaPetalScarlet)" },
              { x: 240, y: 325, scale: 0.9, rot: 270, grad: "url(#ashokaPetalWarm)" },
              { x: 250, y: 270, scale: 0.95, rot: 315, grad: "url(#ashokaPetalScarlet)" },
              // Inner Core Layer
              { x: 285, y: 280, scale: 0.7, rot: 20, grad: "url(#ashokaPetalWarm)" },
              { x: 315, y: 280, scale: 0.7, rot: -20, grad: "url(#ashokaPetalWarm)" },
              { x: 315, y: 315, scale: 0.7, rot: 50, grad: "url(#ashokaPetalScarlet)" },
              { x: 285, y: 315, scale: 0.7, rot: -50, grad: "url(#ashokaPetalScarlet)" },
            ].map((petal, idx) => (
              <g
                key={idx}
                transform={`translate(${petal.x}, ${petal.y}) rotate(${petal.rot}) scale(${petal.scale})`}
              >
                <path
                  d="M 0 0 C -22 -15 -35 -40 0 -65 C 35 -40 22 -15 0 0 Z"
                  fill={petal.grad}
                  opacity="0.95"
                />
                <circle cx="0" cy="-6" r="3" fill="#fde047" opacity="0.8" />
              </g>
            ))}

            {/* Blossom Golden Core Center Hub */}
            <circle cx="300" cy="305" r="14" fill="#fef08a" />
            <circle cx="300" cy="305" r="7" fill="#ea580c" />
          </g>
        </svg>
      </div>
    </div>
  );
}
