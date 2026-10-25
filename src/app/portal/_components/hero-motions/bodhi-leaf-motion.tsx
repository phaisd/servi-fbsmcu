"use client";

import * as React from "react";

export function BodhiLeafMotion() {
  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none select-none overflow-hidden">
      <style>{`
        @keyframes leaf-sway {
          0%, 100% {
            transform: rotate(-3deg) translateY(0px) scale(0.97);
          }
          50% {
            transform: rotate(3deg) translateY(-8px) scale(1.02);
          }
        }
        @keyframes leaf-vein-glow {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* Radiant Green & Gold Aura */}
      <div
        className="absolute w-[460px] h-[460px] sm:w-[600px] sm:h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(234,179,8,0.28) 0%, rgba(34,197,94,0.18) 45%, rgba(255,255,255,0) 70%)",
        }}
      />

      {/* Bodhi Leaf SVG */}
      <div
        className="relative z-10 w-[290px] h-[290px] sm:w-[410px] sm:h-[410px] lg:w-[490px] lg:h-[490px]"
        style={{
          animation: "leaf-sway 7.5s ease-in-out infinite",
          transformOrigin: "bottom center",
          filter: "drop-shadow(0 14px 28px rgba(161, 98, 7, 0.22)) drop-shadow(0 4px 10px rgba(0, 0, 0, 0.08))",
        }}
      >
        <svg
          viewBox="0 0 600 600"
          className="w-full h-full overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="bodhiGoldGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#ca8a04" />
              <stop offset="40%" stopColor="#eab308" />
              <stop offset="75%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#fef08a" />
            </linearGradient>

            <linearGradient id="bodhiVeinGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#854d0e" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
          </defs>

          {/* Leaf Body - Heart shaped with elongated drip tip (หางใบโพธิ์เรียวยาว) */}
          <path
            d="M 300 480 C 180 480 80 400 80 290 C 80 180 170 120 280 100 C 295 90 298 40 300 20 C 302 40 305 90 320 100 C 430 120 520 180 520 290 C 520 400 420 480 300 480 Z"
            fill="url(#bodhiGoldGrad)"
            opacity="0.94"
          />

          {/* Leaf Base Stem */}
          <path
            d="M 300 480 Q 295 530 285 570"
            stroke="#a16207"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />

          {/* Glowing Veins (เส้นใบเรืองแสง) */}
          <g style={{ animation: "leaf-vein-glow 4s ease-in-out infinite" }}>
            {/* Main Midrib */}
            <path
              d="M 300 480 L 300 30"
              stroke="url(#bodhiVeinGrad)"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Side Lateral Veins */}
            {[
              { y: 430, xOffset: 95, curveY: 380 },
              { y: 380, xOffset: 155, curveY: 320 },
              { y: 320, xOffset: 175, curveY: 260 },
              { y: 260, xOffset: 165, curveY: 200 },
              { y: 200, xOffset: 135, curveY: 150 },
              { y: 150, xOffset: 85, curveY: 110 },
            ].map((v, i) => (
              <g key={i}>
                {/* Left Vein */}
                <path
                  d={`M 300 ${v.y} Q ${300 - v.xOffset * 0.6} ${v.curveY + 20} ${300 - v.xOffset} ${v.curveY}`}
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  opacity="0.75"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Right Vein */}
                <path
                  d={`M 300 ${v.y} Q ${300 + v.xOffset * 0.6} ${v.curveY + 20} ${300 + v.xOffset} ${v.curveY}`}
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  opacity="0.75"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
