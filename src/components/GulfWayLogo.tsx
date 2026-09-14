import React from 'react';

interface GulfWayLogoProps {
  className?: string;
  color?: string;
  size?: number | string;
  title?: string;
  variant?: 'symbol' | 'horizontal' | 'full';
  withText?: boolean;
  textColor?: string;
  subtitle?: string;
}

/**
 * GulfWay Enterprise Suite Official Logo
 * Exact vector reconstruction of the official GulfWay pin emblem:
 * - Upper concentric circular loop with integrated 'G' crossbar & clean horizontal slits
 * - Lower body with smooth stylized 'W' wave apex & inverted chevron base
 * - Independent precision diamond tip standing at the bottom vertex
 * - Clean geometric 'GULFWAY®' typography with high-density tracking
 */
export const GulfWayLogo: React.FC<GulfWayLogoProps> = ({
  className = 'w-7 h-7',
  color,
  size,
  title = 'GulfWay Enterprise Suite',
  variant = 'symbol',
  withText = false,
  textColor = 'text-slate-900',
  subtitle = 'Enterprise Suite',
}) => {
  const isHorizontal = variant === 'horizontal' || withText;
  const isFull = variant === 'full';

  const style = size
    ? { width: typeof size === 'number' ? `${size}px` : size, height: typeof size === 'number' ? `${size}px` : size }
    : undefined;

  // Render Full Stacked Lockup: Emblem + GULFWAY® Wordmark below
  if (isFull) {
    return (
      <svg
        viewBox="0 0 500 680"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} shrink-0`}
        style={style}
        role="img"
        aria-label={title}
      >
        <title>{title}</title>
        <defs>
          <linearGradient id="gulfwayGradientFull" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5897CA" />
            <stop offset="100%" stopColor="#4887BF" />
          </linearGradient>
        </defs>

        {/* 1. Upper Loop / Top Arch of the G */}
        <path
          d="M 5.5 265 A 245 245 0 1 1 494.5 265 L 285 265 L 285 203 L 402.9 203 A 160 160 0 1 0 90.7 265 Z"
          fill={color || 'url(#gulfwayGradientFull)'}
        />

        {/* 2. Middle 'W' Pin Body */}
        <path
          d="M 7.8 287 A 245 245 0 0 1 37.1 371.2 L 176 633 L 250 559 L 324 633 L 462.9 371.2 A 245 245 0 0 1 492.2 287 L 405.7 287 C 405.7 347 375 405 330 405 C 288 405 272 307 250 307 C 228 307 212 405 170 405 C 125 405 94.3 347 94.3 287 Z"
          fill={color || 'url(#gulfwayGradientFull)'}
        />

        {/* 3. Standalone Diamond Tip */}
        <polygon
          points="250,587 324,661 250,739 176,661"
          fill={color || 'url(#gulfwayGradientFull)'}
        />

        {/* 4. GULFWAY® Wordmark */}
        <g fill={color || '#508EC2'} fontFamily="'Montserrat', 'Century Gothic', -apple-system, sans-serif" fontWeight="300">
          <text x="250" y="860" fontSize="76" textAnchor="middle" letterSpacing="14">
            GULFWAY
          </text>
          <circle cx="472" cy="810" r="8" fill="none" stroke={color || '#508EC2'} strokeWidth="1.8" />
          <text x="472" y="813" fontSize="10" fontWeight="600" textAnchor="middle" letterSpacing="0">
            R
          </text>
        </g>
      </svg>
    );
  }

  // Symbol Icon (Standard Emblem)
  const symbolSvg = (
    <svg
      viewBox="0 0 500 750"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} shrink-0`}
      style={style}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="gulfwayGradientSymbol" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5897CA" />
          <stop offset="100%" stopColor="#4887BF" />
        </linearGradient>
      </defs>

      {/* 1. Upper Loop / Top Arch of the G */}
      <path
        d="M 5.5 265 A 245 245 0 1 1 494.5 265 L 285 265 L 285 203 L 402.9 203 A 160 160 0 1 0 90.7 265 Z"
        fill={color || 'url(#gulfwayGradientSymbol)'}
      />

      {/* 2. Middle 'W' Pin Body */}
      <path
        d="M 7.8 287 A 245 245 0 0 1 37.1 371.2 L 176 633 L 250 559 L 324 633 L 462.9 371.2 A 245 245 0 0 1 492.2 287 L 405.7 287 C 405.7 347 375 405 330 405 C 288 405 272 307 250 307 C 228 307 212 405 170 405 C 125 405 94.3 347 94.3 287 Z"
        fill={color || 'url(#gulfwayGradientSymbol)'}
      />

      {/* 3. Standalone Diamond Tip */}
      <polygon
        points="250,587 324,661 250,739 176,661"
        fill={color || 'url(#gulfwayGradientSymbol)'}
      />
    </svg>
  );

  if (!isHorizontal) {
    return symbolSvg;
  }

  // Horizontal variant (Emblem + Corporate Wordmark)
  return (
    <div className="flex items-center gap-2.5">
      {symbolSvg}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1">
          <span className={`font-bold text-sm tracking-tight leading-none ${textColor} truncate`}>
            GulfWay
          </span>
          <span className="text-[9px] text-[#508EC2] font-semibold tracking-wide">®</span>
        </div>
        <span className="text-[10px] text-slate-400 font-medium tracking-normal mt-0.5">
          {subtitle}
        </span>
      </div>
    </div>
  );
};

