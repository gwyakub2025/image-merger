// Vector SVG symbols, tick marks, cross marks, checkboxes, and stamps for PDF Editor

export interface SymbolPreset {
  id: string;
  name: string;
  category: 'check' | 'cross' | 'checkbox' | 'stamp' | 'logo';
  width: number;
  height: number;
  dataUrl: string;
}

const svgToDataUrl = (svg: string): string => {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
};

export const SYMBOL_PRESETS: SymbolPreset[] = [
  // 1. TICKS / CHECKMARKS
  {
    id: 'tick-green',
    name: 'Green Checkmark',
    category: 'check',
    width: 28,
    height: 28,
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
        <path d="M10 24 L20 34 L38 14" fill="none" stroke="#16a34a" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `),
  },
  {
    id: 'tick-green-circle',
    name: 'Green Circle Tick',
    category: 'check',
    width: 28,
    height: 28,
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
        <circle cx="24" cy="24" r="21" fill="#16a34a"/>
        <path d="M14 24 L22 32 L34 18" fill="none" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `),
  },
  {
    id: 'tick-blue',
    name: 'Blue Checkmark',
    category: 'check',
    width: 28,
    height: 28,
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
        <path d="M10 24 L20 34 L38 14" fill="none" stroke="#2563eb" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `),
  },
  {
    id: 'tick-black',
    name: 'Classic Black Tick',
    category: 'check',
    width: 28,
    height: 28,
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
        <path d="M10 24 L20 34 L38 14" fill="none" stroke="#0f172a" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `),
  },
  {
    id: 'tick-double-blue',
    name: 'Double Checkmark',
    category: 'check',
    width: 36,
    height: 28,
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 48" width="60" height="48">
        <path d="M8 24 L18 34 L36 14" fill="none" stroke="#0284c7" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M22 24 L32 34 L50 14" fill="none" stroke="#0284c7" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `),
  },

  // 2. CROSSES / X MARKS
  {
    id: 'cross-red',
    name: 'Red X Mark',
    category: 'cross',
    width: 28,
    height: 28,
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
        <path d="M12 12 L36 36 M36 12 L12 36" fill="none" stroke="#dc2626" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `),
  },
  {
    id: 'cross-red-circle',
    name: 'Red Circle X',
    category: 'cross',
    width: 28,
    height: 28,
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
        <circle cx="24" cy="24" r="21" fill="#dc2626"/>
        <path d="M16 16 L32 32 M32 16 L16 32" fill="none" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `),
  },
  {
    id: 'cross-black',
    name: 'Classic Black X',
    category: 'cross',
    width: 28,
    height: 28,
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
        <path d="M12 12 L36 36 M36 12 L12 36" fill="none" stroke="#0f172a" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `),
  },

  // 3. CHECKBOXES
  {
    id: 'box-checked-green',
    name: 'Checked Box (Green)',
    category: 'checkbox',
    width: 30,
    height: 30,
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
        <rect x="6" y="6" width="36" height="36" rx="6" fill="#f0fdf4" stroke="#16a34a" stroke-width="4"/>
        <path d="M14 24 L22 32 L34 16" fill="none" stroke="#16a34a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `),
  },
  {
    id: 'box-checked-blue',
    name: 'Checked Box (Blue)',
    category: 'checkbox',
    width: 30,
    height: 30,
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
        <rect x="6" y="6" width="36" height="36" rx="6" fill="#eff6ff" stroke="#2563eb" stroke-width="4"/>
        <path d="M14 24 L22 32 L34 16" fill="none" stroke="#2563eb" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `),
  },
  {
    id: 'box-empty',
    name: 'Empty Checkbox',
    category: 'checkbox',
    width: 30,
    height: 30,
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
        <rect x="6" y="6" width="36" height="36" rx="6" fill="#ffffff" stroke="#475569" stroke-width="4"/>
      </svg>
    `),
  },
  {
    id: 'box-crossed',
    name: 'Crossed Box',
    category: 'checkbox',
    width: 30,
    height: 30,
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
        <rect x="6" y="6" width="36" height="36" rx="6" fill="#fef2f2" stroke="#dc2626" stroke-width="4"/>
        <path d="M16 16 L32 32 M32 16 L16 32" fill="none" stroke="#dc2626" stroke-width="4.5" stroke-linecap="round"/>
      </svg>
    `),
  },
  {
    id: 'radio-checked',
    name: 'Radio Button Checked',
    category: 'checkbox',
    width: 28,
    height: 28,
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
        <circle cx="24" cy="24" r="20" fill="#ffffff" stroke="#2563eb" stroke-width="4"/>
        <circle cx="24" cy="24" r="10" fill="#2563eb"/>
      </svg>
    `),
  },

  // 4. APPROVAL & STATUS STAMPS
  {
    id: 'stamp-approved',
    name: 'APPROVED Stamp',
    category: 'stamp',
    width: 140,
    height: 48,
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 68" width="200" height="68">
        <rect x="4" y="4" width="192" height="60" rx="8" fill="#f0fdf4" stroke="#16a34a" stroke-width="4" stroke-dasharray="8 4"/>
        <text x="100" y="42" font-family="Arial, sans-serif" font-weight="900" font-size="24" fill="#16a34a" text-anchor="middle" letter-spacing="3">APPROVED</text>
      </svg>
    `),
  },
  {
    id: 'stamp-rejected',
    name: 'REJECTED Stamp',
    category: 'stamp',
    width: 140,
    height: 48,
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 68" width="200" height="68">
        <rect x="4" y="4" width="192" height="60" rx="8" fill="#fef2f2" stroke="#dc2626" stroke-width="4" stroke-dasharray="8 4"/>
        <text x="100" y="42" font-family="Arial, sans-serif" font-weight="900" font-size="24" fill="#dc2626" text-anchor="middle" letter-spacing="3">REJECTED</text>
      </svg>
    `),
  },
  {
    id: 'stamp-paid',
    name: 'PAID Stamp',
    category: 'stamp',
    width: 130,
    height: 48,
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 68" width="180" height="68">
        <rect x="4" y="4" width="172" height="60" rx="8" fill="#ecfdf5" stroke="#059669" stroke-width="4"/>
        <text x="90" y="42" font-family="Arial, sans-serif" font-weight="900" font-size="26" fill="#059669" text-anchor="middle" letter-spacing="4">PAID</text>
      </svg>
    `),
  },
  {
    id: 'stamp-wps-verified',
    name: 'WPS VERIFIED Seal',
    category: 'stamp',
    width: 160,
    height: 52,
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 72" width="220" height="72">
        <rect x="4" y="4" width="212" height="64" rx="8" fill="#eff6ff" stroke="#2563eb" stroke-width="3.5"/>
        <text x="110" y="34" font-family="Arial, sans-serif" font-weight="900" font-size="18" fill="#1e40af" text-anchor="middle" letter-spacing="2">WPS VERIFIED</text>
        <text x="110" y="54" font-family="Arial, sans-serif" font-weight="700" font-size="11" fill="#3b82f6" text-anchor="middle" letter-spacing="1">GULF WAY GROUP COMPLIANCE</text>
      </svg>
    `),
  },
  {
    id: 'stamp-confidential',
    name: 'CONFIDENTIAL',
    category: 'stamp',
    width: 160,
    height: 48,
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 68" width="220" height="68">
        <rect x="4" y="4" width="212" height="60" rx="6" fill="#fff1f2" stroke="#e11d48" stroke-width="3"/>
        <text x="110" y="42" font-family="Arial, sans-serif" font-weight="900" font-size="20" fill="#e11d48" text-anchor="middle" letter-spacing="3">CONFIDENTIAL</text>
      </svg>
    `),
  },

  // 5. CORPORATE LOGO
  {
    id: 'gulf-way-emblem',
    name: 'Gulf Way Emblem',
    category: 'logo',
    width: 100,
    height: 100,
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
        <circle cx="80" cy="80" r="72" fill="#0f172a" stroke="#4f8ec2" stroke-width="4"/>
        <circle cx="80" cy="80" r="62" fill="none" stroke="#ffffff" stroke-opacity="0.2" stroke-width="1.5"/>
        <g transform="translate(40, 32)">
          <path d="M40 8 L72 38 L40 68 L8 38 Z" fill="none" stroke="#4f8ec2" stroke-width="5" stroke-linejoin="round"/>
          <text x="40" y="46" font-family="Arial, sans-serif" font-weight="900" font-size="24" fill="#ffffff" text-anchor="middle">GW</text>
        </g>
        <text x="80" y="125" font-family="Arial, sans-serif" font-weight="800" font-size="11" fill="#93c5fd" text-anchor="middle" letter-spacing="2">GULF WAY</text>
      </svg>
    `),
  },
];
