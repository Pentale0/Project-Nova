import React from 'react';

export const PersonaArtwork: React.FC = () => {
  return (
    <div className="relative w-full h-full min-h-[580px] lg:min-h-[720px] overflow-hidden select-none pointer-events-none flex flex-col justify-between">
      {/* Top Left System Badge (No money/yen) */}
      <div className="relative z-20 pt-4 pl-4 pointer-events-auto">
        <div className="bg-[#FFFFFF] text-[#050B14] p-3 border-2 border-[#050B14] shadow-[4px_4px_0px_#050B14] inline-block transform -skew-x-12">
          <div className="transform skew-x-12 leading-tight">
            <div className="font-p3r text-2xl font-black tracking-tight text-[#050B14]">
              NOVA 01
            </div>
            <div className="text-[10px] font-bold tracking-widest text-[#050B14]/80 uppercase font-sans">
              MAIN SYSTEM
            </div>
          </div>
        </div>
      </div>

      {/* Vertical 01 NOVA Watermark along the left edge */}
      <div className="absolute top-24 left-2 z-10 opacity-20 pointer-events-none">
        <div className="font-p3r text-7xl lg:text-8xl font-black text-[#050B14] transform -rotate-90 origin-top-left tracking-tighter">
          01 NOVA
        </div>
      </div>

      {/* Stylized Vector Silhouette / Character Art matching the P3R inverted figure in image */}
      <div className="relative z-10 flex-1 flex items-center justify-center my-auto">
        <svg
          viewBox="0 0 400 500"
          className="w-full max-w-[360px] lg:max-w-[420px] h-auto drop-shadow-[6px_6px_0px_rgba(5,11,20,0.4)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Audio Cable floating upwards */}
          <path
            d="M200 420 C180 340, 240 280, 210 210 C180 140, 260 90, 210 20"
            stroke="#050B14"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M205 420 C185 340, 245 280, 215 210 C185 140, 265 90, 215 20"
            stroke="#00E5FF"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Floating ribbon straps */}
          <path
            d="M170 380 C150 300, 200 240, 160 160 C130 100, 180 50, 150 10"
            stroke="#050B14"
            strokeWidth="4"
            fill="none"
          />
          <path
            d="M190 390 C220 320, 170 250, 220 170 C250 110, 210 60, 240 10"
            stroke="#050B14"
            strokeWidth="3"
            fill="none"
          />

          {/* Stylized Headphones */}
          <g transform="translate(180, 310) rotate(-15)">
            <ellipse cx="40" cy="40" rx="26" ry="32" fill="#FFFFFF" stroke="#050B14" strokeWidth="3.5" />
            <circle cx="40" cy="40" r="16" fill="#001F54" stroke="#00E5FF" strokeWidth="2.5" />
            <circle cx="40" cy="40" r="8" fill="#00E5FF" />
            <rect x="36" y="8" width="8" height="14" fill="#FF0055" />
          </g>

          {/* Inverted Character Head Contour (Stylized Vector Manga) */}
          <g transform="translate(100, 220)">
            {/* Neck & Chin */}
            <path
              d="M120 40 L160 110 L140 160 L100 175 L60 145 L50 80 Z"
              fill="#FFFFFF"
              stroke="#050B14"
              strokeWidth="3.5"
            />
            {/* Soft Shadow on neck */}
            <path d="M120 40 L150 95 L115 130 Z" fill="#E2E8F0" />

            {/* Jawline & Inverted Face Profile */}
            <path
              d="M60 145 C45 120, 40 85, 45 50 C48 30, 60 10, 80 0"
              stroke="#050B14"
              strokeWidth="3.5"
              fill="none"
            />

            {/* Cyan Eye */}
            <g transform="translate(48, 85) rotate(165)">
              <ellipse cx="14" cy="8" rx="10" ry="5" fill="#050B14" />
              <ellipse cx="14" cy="8" rx="6" ry="4" fill="#00E5FF" />
              <circle cx="12" cy="7" r="2" fill="#FFFFFF" />
              <path d="M4 11 C8 5, 20 5, 24 10" stroke="#050B14" strokeWidth="2.5" fill="none" />
            </g>

            {/* Inverted Nose & Lip line */}
            <path d="M44 48 L41 38 L48 36" stroke="#050B14" strokeWidth="2.5" fill="none" />
            <path d="M48 22 C46 20, 42 20, 40 22" stroke="#050B14" strokeWidth="2" fill="none" />
          </g>

          {/* Dynamic Cyan & Navy Hair cascading downwards */}
          <g transform="translate(40, 310)">
            {/* Base Dark Navy Hair */}
            <path
              d="M120 20 C80 80, 40 120, 20 170 C60 150, 90 130, 110 100 C70 140, 50 190, 40 210 C90 170, 130 140, 150 90 C120 150, 110 200, 100 230 C150 180, 180 140, 200 80 Z"
              fill="#001F54"
              stroke="#050B14"
              strokeWidth="3"
            />
            {/* Electric Cyan Sharp Hair Highlights (exact match to screenshot) */}
            <path
              d="M90 70 C60 120, 30 160, 10 200 C40 180, 70 150, 90 120 Z"
              fill="#00E5FF"
              stroke="#050B14"
              strokeWidth="2"
            />
            <path
              d="M130 90 C100 150, 70 200, 50 235 C80 200, 110 170, 130 130 Z"
              fill="#00E5FF"
              stroke="#050B14"
              strokeWidth="2"
            />
            <path
              d="M160 110 C140 170, 120 215, 105 245 C135 210, 155 180, 170 140 Z"
              fill="#00E5FF"
              stroke="#050B14"
              strokeWidth="2"
            />

            {/* Crimson Red Hair Accent Ribbon */}
            <path
              d="M110 150 L125 190 L115 195 L102 155 Z"
              fill="#FF0055"
              stroke="#050B14"
              strokeWidth="1.5"
            />
          </g>
        </svg>
      </div>

      {/* Floating crisp shards at bottom left */}
      <div className="relative z-10 pb-6 pl-6 flex items-center gap-3">
        <div className="w-4 h-4 bg-[#FF0055] border-2 border-[#050B14] shadow-[2px_2px_0px_#050B14] transform rotate-45"></div>
        <div className="w-6 h-6 bg-[#00E5FF] border-2 border-[#050B14] shadow-[2px_2px_0px_#050B14] transform -rotate-12"></div>
        <span className="font-p3r text-xs tracking-wider text-[#050B14]">
          SYSTEM ID // 01 MAIN
        </span>
      </div>
    </div>
  );
};
