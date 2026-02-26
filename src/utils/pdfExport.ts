/**
 * PDF Export Utility
 * 
 * CRITICAL: This module generates PDFs ONLY from structured data.
 * NO screenshots, NO UI rendering, NO React Native view capture.
 * 
 * This module:
 * - Uses pdfTemplateGenerator to create HTML template
 * - Converts HTML → PDF using expo-print
 * - Returns PDF file URI
 */

import type { Event } from '@/src/types';
import * as Print from 'expo-print';
import { generatePdfHtmlTemplate, type PdfProfile, type PdfTableRow } from './pdfTemplateGenerator';

/**
 * Generates a PDF for the given event and list type using ONLY structured HTML/data.
 * 
 * IMPORTANT: This function generates PDFs from HTML strings only - NO screenshots,
 * NO UI capture, NO React Native view rendering. Pure data-driven PDF generation.
 * 
 * - Header (profile image, name, mobile, address OR custom design image) on every page
 * - Event section (title, date, export type)
 * - 40-row grid per page (20 left + 20 right); empty cells show "-"
 * 
 * Used by both Export and Share flows.
 * 
 * @param event - Event data (title, date) - ONLY data, no UI
 * @param type - List type ('grocery' | 'vegetable')
 * @param items - Table rows array - ONLY data from selected event
 * @param profile - Profile data for header - ONLY data, no UI components
 * @param selectedDesign - Selected header design type ('default' | 'custom')
 * @param customDesignUrl - Custom design image URL (null if not using custom)
 * @returns PDF file URI (generated from HTML string, NOT screenshots)
 */
export async function generateListPdf(
  event: Pick<Event, 'title' | 'date'>,
  type: 'grocery' | 'vegetable',
  items: PdfTableRow[],
  profile: PdfProfile,
  selectedDesign: 'default' | 'custom' = 'default',
  customDesignUrl: string | null = null,
  footerText: string = ''
): Promise<string> {

  const validItems = items.filter(
    (item) =>
      item &&
      typeof item === 'object' &&
      typeof item.s_no === 'number' &&
      typeof item.name === 'string' &&
      typeof item.kg === 'number' &&
      typeof item.gram === 'number'
  );

  const itemsToRender = validItems.length > 0 ? validItems : items;

  const html = generatePdfHtmlTemplate(
    event,
    type,
    itemsToRender,
    profile,
    selectedDesign,
    customDesignUrl,
    footerText
  );

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  return uri;
}
// Re-export types for convenience
export type { PdfProfile, PdfTableRow };

