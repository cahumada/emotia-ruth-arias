const EBOOK_ORIGIN = /(?:utm_medium=(?:qr|pdf_link)|[?&]origen=ebook)/;

// Regla de negocio: el QR y el enlace del PDF llevan directo al audio, sin repetir el formulario.
export function isEbookEntry(search: string, hash: string): boolean {
  return hash === "#audio" && EBOOK_ORIGIN.test(search);
}
