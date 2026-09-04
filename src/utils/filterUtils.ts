import { ImageFilterType } from '../types';

export interface FilterOption {
  id: ImageFilterType;
  label: string;
  shortLabel: string;
  description: string;
  cssFilter: string;
  badgeBg: string;
  badgeText: string;
}

export const FILTER_OPTIONS: FilterOption[] = [
  {
    id: 'none',
    label: 'Original',
    shortLabel: 'ORIGINAL',
    description: 'Natural unfiltered source colors',
    cssFilter: 'none',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-600',
  },
  {
    id: 'grayscale',
    label: 'Grayscale',
    shortLabel: 'B&W',
    description: 'Monochrome classic black & white tone',
    cssFilter: 'grayscale(100%)',
    badgeBg: 'bg-slate-800',
    badgeText: 'text-white',
  },
  {
    id: 'sepia',
    label: 'Sepia',
    shortLabel: 'SEPIA',
    description: 'Warm nostalgic vintage antique tint',
    cssFilter: 'sepia(100%) saturate(120%)',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
  },
  {
    id: 'contrast',
    label: 'High Contrast',
    shortLabel: 'CONTRAST',
    description: 'Punchy deep blacks & vivid sharpness',
    cssFilter: 'contrast(175%) brightness(105%)',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
  },
];

export function getFilterOption(filter?: ImageFilterType): FilterOption {
  const match = FILTER_OPTIONS.find((f) => f.id === filter);
  return match || FILTER_OPTIONS[0];
}

export function getFilterCss(filter?: ImageFilterType): string {
  const option = getFilterOption(filter);
  return option.cssFilter;
}
