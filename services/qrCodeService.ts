/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import QRCode from 'qrcode';

/**
 * Generates a QR Code image Buffer from a given URL string.
 * Returns an ArrayBuffer compatible with docx ImageRun.
 */
export const generateQRCode = async (text: string): Promise<ArrayBuffer> => {
  try {
    // Generate QR Code as Data URL
    const dataUrl = await QRCode.toDataURL(text, {
      width: 120,    // Image width in pixels
      margin: 0,     // No margin to maximize content
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Convert Base64 Data URL to ArrayBuffer
    const res = await fetch(dataUrl);
    return await res.arrayBuffer();
  } catch (err) {
    console.error('QR Code generation failed:', err);
    // Return a 1x1 empty pixel as fallback to prevent crash
    return new ArrayBuffer(0); 
  }
};
