import PdfPrinter from 'pdfmake';
import { TDocumentDefinitions, TFontDictionary } from 'pdfmake/interfaces';
const FONTS: TFontDictionary = {
  Lato: {
    normal: 'node_modules/lato-font/fonts/lato-normal/lato-normal.woff',
    bold: 'node_modules/lato-font/fonts/lato-bold/lato-bold.woff',
    italics: 'node_modules/lato-font/fonts/lato-normal-italic/lato-normal-italic.woff',
    bolditalics: 'node_modules/lato-font/fonts/lato-bold-italic/lato-bold-italic.woff'
  },
};

export class MakePdf {
  private printer: PdfPrinter = new PdfPrinter(FONTS);

  public getPDF(docDef: TDocumentDefinitions): Promise<Buffer> {
    const defaultDef: TDocumentDefinitions =  {
      defaultStyle: {
        font: 'Lato'
      },
      content:  [],
    };

    const pdfDoc = this.printer.createPdfKitDocument({
      ...defaultDef,
      ...docDef
    });
    return new Promise((resolve, reject) =>{ try {
      const chunks = [];
      pdfDoc.on('data', chunk => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.end();
    } catch(err) {
      reject(err);
    }});
  }
}
