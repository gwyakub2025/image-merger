import React from 'react';

interface GulfWayLogoProps {
  className?: string;
  color?: string;
  size?: number | string;
  title?: string;
  withText?: boolean;
  textColor?: string;
}

/**
 * Gulf Way Group Official Pin Logo
 * Matches the official Gulf Way marker emblem:
 * - Upper circular ring with capital 'G' crossbar
 * - Precision left & right horizontal separator slits
 * - Lower body with central stylized 'W' chevron peak
 * - Independent diamond tip at the base
 */
export const GulfWayLogo: React.FC<GulfWayLogoProps> = ({
  className = 'w-7 h-7',
  color = '#4f8ec2',
  size,
  title = 'Gulf Way Group',
  withText = false,
  textColor = 'text-slate-900',
}) => {
  const style = size
    ? { width: typeof size === 'number' ? `${size}px` : size, height: typeof size === 'number' ? `${size}px` : size }
    : undefined;

  const svgElement = (
    <svg
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} shrink-0`}
      style={style}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        {/* Subtle highlight gradient to preserve vibrancy across themes */}
        <linearGradient id="gulfWayGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5795ca" />
          <stop offset="100%" stopColor="#4383b7" />
        </linearGradient>
      </defs>

      {/* 1. Upper Loop / Top Arch of the G */}
      <path
        d="M 50 2
           C 23.5 2 4.2 22.5 4 47
           L 20.8 47
           C 21.2 31.8 34.2 19.5 50 19.5
           C 65.8 19.5 78.8 31.8 79.2 47
           L 96 47
           C 95.8 22.5 76.5 2 50 2 Z"
        fill={color || 'url(#gulfWayGradient)'}
      />

      {/* 2. G Crossbar on the right */}
      <path
        d="M 59.5 37.5
           L 96 37.5
           L 96 47
           L 59.5 47
           Z"
        fill={color || 'url(#gulfWayGradient)'}
      />

      {/* 3. Lower Body with Stylized 'W' Peak & Slits */}
      {/* 
        Horizontal slit at y=48 on both left and right sides.
        The inner curve creates the distinct 'W': dips on the left & right, sharp central apex.
        At the bottom, it has an inverted chevron cutout (/\) separating it from the diamond.
      */}
      <path
        d="M 4 49.5
           L 20.8 49.5
           C 25 61 31.5 64 35.5 64
           C 39.5 64 45 57 50 52
           C 55 57 60.5 64 64.5 64
           C 68.5 64 75 61 79.2 49.5
           L 96 49.5
           L 62 86.5
           L 50 74.5
           L 38 86.5
           Z"
        fill={color || 'url(#gulfWayGradient)'}
      />

      {/* 4. Standalone Diamond Tip at the bottom point */}
      <path
        d="M 50 78
           L 61.5 89.5
           L 50 118
           L 38.5 89.5
           Z"
        fill={color || 'url(#gulfWayGradient)'}
      />
    </svg>
  );

  if (!withText) {
    return svgElement;
  }

  return (
    <div className="flex items-center gap-2.5">
      {svgElement}
      <div className="flex flex-col min-w-0">
        <span className={`font-bold text-sm tracking-tight leading-none ${textColor} truncate`}>
          Gulf Way Group
        </span>
        <span className="text-[10px] text-slate-400 font-medium tracking-normal mt-0.5">
          Enterprise Systems
        </span>
      </div>
    </div>
  );
};
