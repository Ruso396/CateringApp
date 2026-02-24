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
  customDesignUrl: string | null = null
): Promise<string> {
  // STRICT VALIDATION: Ensure we're only using data, not UI
  if (!event || !event.title) {
    throw new Error('Invalid event data: Event title is required');
  }
  if (!items || !Array.isArray(items)) {
    throw new Error('Invalid table data: Items array is required');
  }
  if (type !== 'grocery' && type !== 'vegetable') {
    throw new Error(`Invalid list type: Must be 'grocery' or 'vegetable', got '${type}'`);
  }
  if (!profile) {
    throw new Error('Invalid profile data: Profile is required');
  }

  // Validate we have actual table data (not UI components)
  // Allow empty strings and zeros - these are valid data (will show as "-" in PDF)
  const validItems = items.filter(
    (item) =>
      item &&
      typeof item === 'object' &&
      typeof item.s_no === 'number' &&
      typeof item.name === 'string' && // Empty string is valid (will show "-")
      typeof item.kg === 'number' && // 0 is valid (will show "-" or "0" based on logic)
      typeof item.gram === 'number' // 0 is valid (will show "-" or "0" based on logic)
  );

  // If we have items but none are valid, that's an error
  if (items.length > 0 && validItems.length === 0) {
    throw new Error('Invalid table data structure: Items must have s_no (number), name (string), kg (number), gram (number) fields');
  }

  // Use validItems for rendering (filters out any malformed data)
  const itemsToRender = validItems.length > 0 ? validItems : items;

  // Generate HTML template using ONLY structured data
  // This is the ONLY way PDFs are generated - through HTML template, NOT screenshots
  const html = generatePdfHtmlTemplate(
    event,
    type,
    itemsToRender,
    profile,
    selectedDesign,
    customDesignUrl
  );

  // CRITICAL: Generate PDF from HTML string ONLY
  // This method converts pure HTML to PDF - it does NOT:
  // - Capture React Native views
  // - Take screenshots
  // - Render any UI components
  // - Access the current screen/view hierarchy
  // It ONLY processes the HTML string we provide
  
  try {
    const { uri } = await Print.printToFileAsync({ 
      html,
      base64: false,
      // Ensure we're not using any view references
      width: 612, // Standard US Letter width in points
      height: 792, // Standard US Letter height in points
    });
    
    if (!uri || typeof uri !== 'string') {
      throw new Error('PDF generation failed: No file URI returned');
    }

    // Validate the PDF was actually created (basic check)
    if (!uri.includes('.pdf') && !uri.startsWith('file://') && !uri.startsWith('content://')) {
      console.warn('PDF URI format unexpected:', uri);
    }

    return uri;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`PDF generation failed: ${errorMsg}. Ensure HTML template is valid and contains only table data.`);
  }
}

// Re-export types for convenience
export type { PdfProfile, PdfTableRow };

