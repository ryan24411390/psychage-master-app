// PDF print/share SEAM (pure — no expo import, so it is Vitest-testable). The native
// impl lives in expo-printer.ts. Generation is LOCAL (works offline); the share is
// platform-handled. PII-on-share is flagged for review.

export interface PdfPrinter {
  /** Render the HTML to a local PDF file; returns its file URI. LOCAL — no network. */
  printToFile(html: string): Promise<string>;
  /** Hand the file to the platform share sheet. */
  share(uri: string): Promise<void>;
}

/** Generate the PDF locally, then hand it to the share sheet (in that order). */
export async function generateAndShare(html: string, printer: PdfPrinter): Promise<void> {
  const uri = await printer.printToFile(html);
  await printer.share(uri);
}
