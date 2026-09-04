import React from 'react';

interface GulfWayLogoProps {
  className?: string;
  color?: string;
  title?: string;
}

/**
 * Gulf Way Group Official Pin Logo
 * Pin contour with stylized 'G', 'W', and diamond tip base
 */
export const GulfWayLogo: React.FC<GulfWayLogoProps> = ({
  className = 'w-7 h-7',
  color = '#508ec2',
  title = 'Gulf Way Group',
}) => {
  return (
    <svg
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      
      {/* Upper-left arc */}
      <path
        d="M50 2
           C25 2 4.5 22 4 47
           L4 55
           L21 55
           L21 47
           C21.5 31 34 19 50 19
           C66 19 78.5 31 79 47
           L96 47
           C95.5 22 75 2 50 2 Z"
        fill={color}
      />

      {/* G horizontal bar and right arm */}
      <path
        d="M96 49.5
           L59.5 49.5
           L59.5 61
           L76.5 61
           L64.5 82
           L50 64
           L35.5 82
           L23.5 61
           L21 61
           L21 57.5
           L4 57.5
           L4 60
           L37 101
           L41.5 96.5
           L30 81.5
           L50 99
           L70 81.5
           L58.5 96.5
           L63 101
           L96 60
           L96 49.5 Z"
        fill={color}
      />

      {/* Bottom Diamond Tip */}
      <path
        d="M50 94.5
           L62 106.5
           L50 118.5
           L38 106.5 Z"
        fill={color}
      />
    </svg>
  );
};
