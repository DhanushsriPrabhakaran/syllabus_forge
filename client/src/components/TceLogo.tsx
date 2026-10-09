import React from 'react';

interface TceLogoProps {
  variant?: 'full' | 'compact' | 'light' | 'white';
  className?: string;
  subtext?: string;
}

export const TceLogo: React.FC<TceLogoProps> = ({
  variant = 'full',
  className = '',
  subtext = 'An Autonomous Institution Affiliated to Anna University',
}) => {
  const isWhite = variant === 'white';
  const isCompact = variant === 'compact';

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* TCE Crest Icon / Shield Motif */}
      <div className="relative flex-shrink-0 w-11 h-11 rounded-lg bg-gradient-to-br from-[#7B1113] via-[#8B1E2D] to-[#560B0D] p-1 shadow-md border border-[#C59B27]/40 flex items-center justify-center">
        {/* Subtle decorative inner ring */}
        <div className="absolute inset-0.5 rounded-[6px] border border-[#C59B27]/60 pointer-events-none" />
        <svg
          viewBox="0 0 48 48"
          className="w-8 h-8 text-[#FAF7F2]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Temple Gopuram / Tower Silhouette */}
          <path
            d="M24 6L21 11H27L24 6Z"
            fill="#C59B27"
          />
          <path
            d="M19 12H29V15H19V12Z"
            fill="#FAF7F2"
          />
          <path
            d="M17 16H31V20H17V16Z"
            fill="#C59B27"
          />
          <path
            d="M15 21H33V26H15V21Z"
            fill="#FAF7F2"
          />
          {/* Base pedestal */}
          <path
            d="M12 27H36V31H12V27Z"
            fill="#C59B27"
          />
          {/* Open Book / Wheel at Base */}
          <path
            d="M14 33C17 31.5 21 31.5 24 33.5C27 31.5 31 31.5 34 33V39C31 37.5 27 37.5 24 39C21 37.5 17 37.5 14 39V33Z"
            fill="#FAF7F2"
            stroke="#C59B27"
            strokeWidth="1"
          />
          {/* Little Flame / Kalasam on Top */}
          <circle cx="24" cy="5" r="1.5" fill="#C59B27" />
        </svg>
      </div>

      {/* Typography */}
      <div className="flex flex-col leading-tight">
        <div className="flex items-center space-x-2">
          <span
            className={`font-extrabold tracking-tight font-tce text-base sm:text-lg ${
              isWhite ? 'text-white' : 'text-[#7B1113]'
            }`}
          >
            THIAGARAJAR COLLEGE OF ENGINEERING
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#C59B27] text-white tracking-widest hidden sm:inline-block">
            ESTD. 1957
          </span>
        </div>
        {!isCompact && (
          <div className="flex items-center space-x-2 text-[11px] font-medium text-slate-500 mt-0.5">
            <span className={isWhite ? 'text-slate-200' : 'text-slate-600'}>
              {subtext}
            </span>
            <span className="text-[#C59B27] font-semibold hidden md:inline">• Madurai - 625 015</span>
          </div>
        )}
      </div>
    </div>
  );
};
