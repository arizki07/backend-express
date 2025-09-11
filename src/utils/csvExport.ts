import { Parser } from 'json2csv';
import fs from 'fs';

export const exportCSV = (data: any[], fields: string[], filePath?: string) => {
  const parser = new Parser({ fields });
  const csv = parser.parse(data);

  if (filePath) {
    fs.writeFileSync(filePath, csv);
  }

  return csv;
};
