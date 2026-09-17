import { SheetTemplate, SheetTemplateId, BatchConfig, PageOrientation } from '../types';

export const DEFAULT_SHEET_TEMPLATES: SheetTemplate[] = [
  {
    id: 'single-hero',
    name: 'Single Spotlight',
    shortLabel: '1 / Sheet',
    imagesPerPage: 1,
    description: '1 full-page hero image per A4 sheet. Maximum resolution and detail.',
    iconType: 'single',
    recommendedOrientation: 'portrait',
    badge: '1 IMAGE',
  },
  {
    id: 'dual-stacked',
    name: 'Dual Stacked',
    shortLabel: '2 / Sheet',
    imagesPerPage: 2,
    description: '2 stacked horizontal rows. Classic corporate dual layout.',
    iconType: 'dual-stacked',
    recommendedOrientation: 'portrait',
    badge: '2 IMAGES',
  },
  {
    id: 'dual-split',
    name: 'Dual Split Columns',
    shortLabel: '2 Split',
    imagesPerPage: 2,
    description: '2 side-by-side vertical columns. Perfect for landscape or comparison.',
    iconType: 'dual-split',
    recommendedOrientation: 'landscape',
    badge: '2 IMAGES',
  },
  {
    id: 'triple-featured',
    name: 'Triple Hero Top',
    shortLabel: '3 Hero',
    imagesPerPage: 3,
    description: '1 prominent top showcase + 2 side-by-side bottom slots.',
    iconType: 'triple-featured',
    recommendedOrientation: 'portrait',
    badge: '3 IMAGES',
  },
  {
    id: 'triple-rows',
    name: 'Triple Rows',
    shortLabel: '3 Rows',
    imagesPerPage: 3,
    description: '3 equal horizontal panorama rows from top to bottom.',
    iconType: 'triple-rows',
    recommendedOrientation: 'portrait',
    badge: '3 IMAGES',
  },
  {
    id: 'quad-grid',
    name: 'Quad Grid (2×2)',
    shortLabel: '4 Grid',
    imagesPerPage: 4,
    description: '4 equal quadrants. Ideal for ID cards, permits, inspections, and sets.',
    iconType: 'quad',
    recommendedOrientation: 'portrait',
    badge: '4 IMAGES',
  },
  {
    id: 'contact-6',
    name: 'Contact Sheet (2×3)',
    shortLabel: '6 Proof',
    imagesPerPage: 6,
    description: '6 images in a 2×3 grid. Standard photo proof dossier & archive.',
    iconType: 'contact-6',
    recommendedOrientation: 'portrait',
    badge: '6 IMAGES',
  },
  {
    id: 'catalog-8',
    name: 'Compact Catalog (2×4)',
    shortLabel: '8 Index',
    imagesPerPage: 8,
    description: '8 items in a 2×4 grid. High-density inventory, assets, and receipts.',
    iconType: 'catalog-8',
    recommendedOrientation: 'portrait',
    badge: '8 IMAGES',
  },
  {
    id: 'gallery-9',
    name: 'Gallery Grid (3×3)',
    shortLabel: '9 Grid',
    imagesPerPage: 9,
    description: '9 equal slots in a balanced 3×3 matrix.',
    iconType: 'gallery-9',
    recommendedOrientation: 'portrait',
    badge: '9 IMAGES',
  },
  {
    id: 'dense-12',
    name: 'High-Density (3×4)',
    shortLabel: '12 Micro',
    imagesPerPage: 12,
    description: '12 miniature thumbnail slots for large volume archival batches.',
    iconType: 'dense-12',
    recommendedOrientation: 'portrait',
    badge: '12 IMAGES',
  },
];

/**
 * Calculate dynamic layout when user describes target number of sheets
 */
export function calculateTargetSheetLayout(totalImages: number, targetSheets: number) {
  const safeTargetSheets = Math.max(1, targetSheets);
  const imagesPerPage = Math.max(1, Math.ceil(totalImages / safeTargetSheets));
  
  // Choose nearest matching template id
  let suggestedTemplate: SheetTemplateId = 'custom-grid';
  if (imagesPerPage === 1) suggestedTemplate = 'single-hero';
  else if (imagesPerPage === 2) suggestedTemplate = 'dual-stacked';
  else if (imagesPerPage === 3) suggestedTemplate = 'triple-featured';
  else if (imagesPerPage === 4) suggestedTemplate = 'quad-grid';
  else if (imagesPerPage === 6) suggestedTemplate = 'contact-6';
  else if (imagesPerPage === 8) suggestedTemplate = 'catalog-8';
  else if (imagesPerPage === 9) suggestedTemplate = 'gallery-9';
  else if (imagesPerPage === 12) suggestedTemplate = 'dense-12';

  // Compute distribution breakdown
  const actualSheets = Math.ceil(totalImages / imagesPerPage);
  const remainder = totalImages % imagesPerPage;
  const fullSheets = remainder === 0 ? actualSheets : actualSheets - 1;

  return {
    targetSheets: safeTargetSheets,
    actualSheets,
    imagesPerPage,
    suggestedTemplate,
    summary: `${totalImages} images distributed across ${actualSheets} sheet(s) (~${imagesPerPage} per sheet)`,
    fullSheetsCount: fullSheets,
    lastSheetCount: remainder === 0 ? imagesPerPage : remainder,
  };
}

/**
 * Apply template setting to configuration
 */
export function applyTemplateToConfig(
  templateId: SheetTemplateId,
  prevConfig: BatchConfig
): Partial<BatchConfig> {
  const found = DEFAULT_SHEET_TEMPLATES.find((t) => t.id === templateId);

  if (templateId === 'single-hero') {
    return {
      templateId,
      imagesPerPage: 1,
      gridCols: 1,
      gridRows: 1,
    };
  }

  if (templateId === 'dual-stacked') {
    return {
      templateId,
      imagesPerPage: 2,
      orientation: 'portrait',
      gridCols: 1,
      gridRows: 2,
    };
  }

  if (templateId === 'dual-split') {
    return {
      templateId,
      imagesPerPage: 2,
      orientation: 'landscape',
      gridCols: 2,
      gridRows: 1,
    };
  }

  if (templateId === 'triple-featured') {
    return {
      templateId,
      imagesPerPage: 3,
      layout3Style: 'featured-top',
      gridCols: undefined,
      gridRows: undefined,
    };
  }

  if (templateId === 'triple-rows') {
    return {
      templateId,
      imagesPerPage: 3,
      layout3Style: 'equal-rows',
      gridCols: 1,
      gridRows: 3,
    };
  }

  if (templateId === 'triple-cols') {
    return {
      templateId,
      imagesPerPage: 3,
      layout3Style: 'equal-cols',
      orientation: 'landscape',
      gridCols: 3,
      gridRows: 1,
    };
  }

  if (templateId === 'quad-grid') {
    return {
      templateId,
      imagesPerPage: 4,
      gridCols: 2,
      gridRows: 2,
    };
  }

  if (templateId === 'contact-6') {
    return {
      templateId,
      imagesPerPage: 6,
      gridCols: prevConfig.orientation === 'portrait' ? 2 : 3,
      gridRows: prevConfig.orientation === 'portrait' ? 3 : 2,
    };
  }

  if (templateId === 'catalog-8') {
    return {
      templateId,
      imagesPerPage: 8,
      gridCols: prevConfig.orientation === 'portrait' ? 2 : 4,
      gridRows: prevConfig.orientation === 'portrait' ? 4 : 2,
    };
  }

  if (templateId === 'gallery-9') {
    return {
      templateId,
      imagesPerPage: 9,
      gridCols: 3,
      gridRows: 3,
    };
  }

  if (templateId === 'dense-12') {
    return {
      templateId,
      imagesPerPage: 12,
      gridCols: prevConfig.orientation === 'portrait' ? 3 : 4,
      gridRows: prevConfig.orientation === 'portrait' ? 4 : 3,
    };
  }

  if (found) {
    return {
      templateId,
      imagesPerPage: found.imagesPerPage,
    };
  }

  return { templateId };
}
