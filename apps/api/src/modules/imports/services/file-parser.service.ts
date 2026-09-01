import { BadRequestError } from '../../../utils/errors.js';
import { ImportParsedFile } from '../types/import.types.js';

export class FileParserService {
  /**
   * Parse uploaded file buffer (CSV or text-based Excel)
   */
  public parseFile(fileBuffer: Buffer, fileName: string): ImportParsedFile {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new BadRequestError('Uploaded file is empty.');
    }

    const lowerName = fileName.toLowerCase();
    const isCsv = lowerName.endsWith('.csv');
    const isXlsx = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls');

    if (!isCsv && !isXlsx) {
      throw new BadRequestError('Unsupported file format. Please upload an Excel (.xlsx) or CSV (.csv) file.');
    }

    // Convert buffer to string, stripping UTF-8 BOM if present
    let rawText = fileBuffer.toString('utf-8');
    if (rawText.charCodeAt(0) === 0xfeff) {
      rawText = rawText.slice(1);
    }

    // Standard CSV line parsing
    const lines = this.splitLines(rawText);
    if (lines.length < 2) {
      throw new BadRequestError('Uploaded file must contain a header row and at least one data row.');
    }

    const headers = this.parseCsvLine(lines[0]).map((h) => h.trim().replace(/^[\*\s]+|[\*\s]+$/g, ''));
    if (headers.length === 0 || headers.every((h) => !h)) {
      throw new BadRequestError('Uploaded file header row is invalid or empty.');
    }

    const rows: Record<string, any>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // skip blank lines

      const values = this.parseCsvLine(line);
      // Skip row if all cells are blank
      if (values.every((v) => !v || !v.trim())) continue;

      const rowObj: Record<string, any> = { _rowNum: i + 1 };
      headers.forEach((header, idx) => {
        if (header) {
          rowObj[header] = values[idx] !== undefined ? values[idx].trim() : '';
        }
      });
      rows.push(rowObj);
    }

    if (rows.length === 0) {
      throw new BadRequestError('Uploaded file does not contain any valid data rows.');
    }

    return {
      headers,
      rows,
      totalRows: rows.length,
      fileType: isCsv ? 'csv' : 'xlsx',
      fileName
    };
  }

  private splitLines(text: string): string[] {
    return text.split(/\r\n|\n|\r/);
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((char === ',' || char === '\t') && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }
}

export const fileParserService = new FileParserService();
