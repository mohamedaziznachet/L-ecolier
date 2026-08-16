const fs = require('fs');
let pdf = require('pdf-parse');
if (pdf.default) pdf = pdf.default;
if (typeof pdf !== 'function' && pdf.PDFParse) {
  const { PDFParse } = pdf;
  pdf = (buf) => new PDFParse(buf).parse();
}

async function parsePdf() {
  const dataBuffer = fs.readFileSync('C:/Users/DELL/Desktop/sel3a.pdf');
  const data = await pdf(dataBuffer);
  console.log('PDF Number of pages:', data.numpages);
  console.log('PDF Text length:', data.text.length);
  console.log('PDF Text sample (first 3000 chars):\n', data.text.substring(0, 3000));

  fs.writeFileSync('C:/Users/DELL/.gemini/antigravity/brain/61185f1b-a2d3-488d-af35-d7c263f8c1bd/scratch/sel3a_raw_text.txt', data.text);
  console.log('Saved raw text to sel3a_raw_text.txt');
}

parsePdf().catch(console.error);
