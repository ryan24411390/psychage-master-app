import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import type { PdfPrinter } from './printer';

// The native PdfPrinter. Imports expo-print/expo-sharing, so it is consumed only by
// the route (never by Vitest — the pure order logic + the HTML builder are tested
// without these native modules). Generation is LOCAL/offline-capable; the share is
// the platform sheet.
export const expoPdfPrinter: PdfPrinter = {
  async printToFile(html: string) {
    const { uri } = await Print.printToFileAsync({ html });
    return uri;
  },
  async share(uri: string) {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    }
  },
};
