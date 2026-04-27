const XLSX = require('xlsx');
const fs = require('fs');

const buf = fs.readFileSync('ZenFB.xlsx');
const workbook = XLSX.read(buf);
const result = {};

workbook.SheetNames.forEach(sheetName => {
  const roa = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
  if (roa.length) result[sheetName] = roa;
});

console.log(JSON.stringify(result, null, 2));
