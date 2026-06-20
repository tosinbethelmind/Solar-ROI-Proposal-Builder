const pdfMake = require('pdfmake/build/pdfmake');
const pdfFonts = require('pdfmake/build/vfs_fonts');

console.log('pdfMake keys:', Object.keys(pdfMake));
console.log('pdfFonts keys:', Object.keys(pdfFonts));
if (pdfFonts.pdfMake) {
  console.log('pdfFonts.pdfMake keys:', Object.keys(pdfFonts.pdfMake));
} else {
  console.log('pdfFonts.pdfMake is undefined');
}
