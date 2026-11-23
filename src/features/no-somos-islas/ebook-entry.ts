const EBOOK_MEDIUMS = new Set(["qr", "pdf_link"]);

// Business rule: the ebook's QR and its tappable link go straight to the audio, without the form again.
export function isEbookEntry(search: string, hash: string): boolean {
  if (hash !== "#audio") return false;
  const params = new URLSearchParams(search);
  return EBOOK_MEDIUMS.has(params.get("utm_medium") ?? "") || params.get("origen") === "ebook";
}
