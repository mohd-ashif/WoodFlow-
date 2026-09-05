import zlib from 'zlib';
import { BadRequestError } from '../../../utils/errors.js';
import { ImportParsedFile } from '../types/import.types.js';

export class FileParserService {
  /**
   * Parse uploaded file buffer (Native .xlsx ZIP, XML SpreadsheetML, HTML table, or CSV/TSV)
   */
  public parseFile(fileBuffer: Buffer, fileName: string): ImportParsedFile {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new BadRequestError('Uploaded file is empty.');
    }

    const lowerName = fileName.toLowerCase();
    const isCsv = lowerName.endsWith('.csv');
    const isXlsx = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls');

    if (!isCsv && !isXlsx) {
      throw new BadRequestError('Unsupported file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.');
    }

    try {
      let headers: string[] = [];
      let rows: Record<string, any>[] = [];

      // 1. Check if binary ZIP archive (Native .xlsx)
      if (fileBuffer.length > 4 && fileBuffer[0] === 0x50 && fileBuffer[1] === 0x4b) {
        const parsed = this.parseNativeXlsxZip(fileBuffer);
        headers = parsed.headers;
        rows = parsed.rows;
      } else {
        // Convert buffer to string, stripping UTF-8 BOM
        let rawText = fileBuffer.toString('utf-8');
        if (rawText.charCodeAt(0) === 0xfeff) {
          rawText = rawText.slice(1);
        }

        // 2. Check if XML SpreadsheetML or HTML table format
        if (
          rawText.includes('<Workbook') ||
          rawText.includes('<Row') ||
          rawText.includes('<table') ||
          rawText.includes('<?xml')
        ) {
          const parsed = this.parseXmlOrHtml(rawText);
          headers = parsed.headers;
          rows = parsed.rows;
        } else {
          // 3. Standard CSV / TSV line parsing
          const lines = this.splitLines(rawText);
          const rawParsed: string[][] = [];
          for (const line of lines) {
            if (!line || !line.trim()) continue;
            const values = this.parseCsvLine(line);
            if (values.some((v) => v && String(v).trim().length > 0)) {
              rawParsed.push(values);
            }
          }
          const parsed = this.processParsedRows(rawParsed);
          headers = parsed.headers;
          rows = parsed.rows;
        }
      }

      if (rows.length === 0) {
        throw new BadRequestError('Excel worksheet must contain a header row and at least 1 data row.');
      }

      return {
        headers,
        rows,
        totalRows: rows.length,
        fileType: isCsv ? 'csv' : 'xlsx',
        fileName,
      };
    } catch (err: any) {
      if (err instanceof BadRequestError) throw err;
      throw new BadRequestError(`Failed to parse file "${fileName}": ${err.message || 'Invalid or corrupted file structure.'}`);
    }
  }

  /**
   * Universal row processor for headers & data row conversion
   */
  private processParsedRows(parsedRows: string[][]): { headers: string[]; rows: Record<string, any>[] } {
    if (!parsedRows || parsedRows.length === 0) {
      throw new BadRequestError('Uploaded spreadsheet contains no readable rows.');
    }

    const firstRowText = parsedRows[0].join(' ').toLowerCase();
    const headerKeywords = [
      'product', 'name', 'sku', 'category', 'unit', 'price', 'cost',
      'stock', 'code', 'title', 'description', 'details', 'rate', 'quantity', 'item', 'group',
      'oduct', 'nam', 'elling', 'pening', 'ninum', 'coustmer', 'pcs', 'piece'
    ];
    const hasHeaderRow = headerKeywords.some((kw) => firstRowText.includes(kw));

    let headers: string[] = [];
    let startIdx = 1;

    if (hasHeaderRow && parsedRows.length > 1) {
      headers = parsedRows[0].map((h, i) => h.trim().replace(/^[\*\s]+|[\*\s]+$/g, '') || `Col ${i + 1}`);
      startIdx = 1;
    } else {
      headers = parsedRows[0].map((_, i) => `Col ${i + 1}`);
      startIdx = 0;
    }

    const rows: Record<string, any>[] = [];

    for (let idx = startIdx; idx < parsedRows.length; idx++) {
      const values = parsedRows[idx];
      if (values[0] && values[0].toLowerCase().includes('instruction')) continue;
      if (values.every((v) => !v || !String(v).trim())) continue;

      const rowObj: Record<string, any> = { _rowNum: idx + 1 };
      headers.forEach((header, colIdx) => {
        if (header) {
          rowObj[header] = values[colIdx] !== undefined ? String(values[colIdx]).trim() : '';
        }
      });
      rows.push(rowObj);
    }

    return { headers, rows };
  }

  /**
   * Parse binary .xlsx ZIP archive using NodeJS zlib with Central Directory + Local Header decoding
   */
  private parseNativeXlsxZip(buffer: Buffer): { headers: string[]; rows: Record<string, any>[] } {
    const filesMap = new Map<string, string>();

    // Strategy A: Scan Central Directory at end of ZIP (Handles Data Descriptors & compSize=0)
    let eocdIdx = -1;
    for (let j = buffer.length - 22; j >= 0; j--) {
      if (buffer[j] === 0x50 && buffer[j + 1] === 0x4b && buffer[j + 2] === 0x05 && buffer[j + 3] === 0x06) {
        eocdIdx = j;
        break;
      }
    }

    if (eocdIdx >= 0) {
      const cdOffset = buffer.readUInt32LE(eocdIdx + 16);
      const cdEntries = buffer.readUInt16LE(eocdIdx + 10);
      let curr = cdOffset;

      for (let k = 0; k < cdEntries && curr < eocdIdx; k++) {
        if (buffer[curr] === 0x50 && buffer[curr + 1] === 0x4b && buffer[curr + 2] === 0x01 && buffer[curr + 3] === 0x02) {
          const compMethod = buffer.readUInt16LE(curr + 10);
          const compSize = buffer.readUInt32LE(curr + 20);
          const nameLen = buffer.readUInt16LE(curr + 28);
          const extraLen = buffer.readUInt16LE(curr + 30);
          const commentLen = buffer.readUInt16LE(curr + 32);
          const localOffset = buffer.readUInt32LE(curr + 42);
          const fileName = buffer.toString('utf-8', curr + 46, curr + 46 + nameLen);

          if (localOffset < buffer.length - 30) {
            const locNameLen = buffer.readUInt16LE(localOffset + 26);
            const locExtraLen = buffer.readUInt16LE(localOffset + 28);
            const dataStart = localOffset + 30 + locNameLen + locExtraLen;
            const dataEnd = dataStart + compSize;

            if (dataEnd <= buffer.length && compSize > 0) {
              try {
                const compressed = buffer.subarray(dataStart, dataEnd);
                let decompressed: Buffer;
                if (compMethod === 8) {
                  decompressed = zlib.inflateRawSync(compressed);
                } else if (compMethod === 0) {
                  decompressed = compressed;
                } else {
                  decompressed = Buffer.alloc(0);
                }
                if (decompressed.length > 0) {
                  filesMap.set(fileName.replace(/\\/g, '/').toLowerCase(), decompressed.toString('utf-8'));
                }
              } catch {
                // Ignore unparseable entry
              }
            }
          }
          curr += 46 + nameLen + extraLen + commentLen;
        } else {
          break;
        }
      }
    }

    // Strategy B: Fallback Local Header linear scan if Central Directory returned 0 files
    if (filesMap.size === 0) {
      let i = 0;
      while (i < buffer.length - 30) {
        if (buffer[i] === 0x50 && buffer[i + 1] === 0x4b && buffer[i + 2] === 0x03 && buffer[i + 3] === 0x04) {
          const compMethod = buffer.readUInt16LE(i + 8);
          const compSize = buffer.readUInt32LE(i + 18);
          const nameLen = buffer.readUInt16LE(i + 26);
          const extraLen = buffer.readUInt16LE(i + 28);
          const fileName = buffer.toString('utf-8', i + 30, i + 30 + nameLen);
          const dataStart = i + 30 + nameLen + extraLen;
          const dataEnd = dataStart + compSize;

          if (dataEnd <= buffer.length && compSize > 0) {
            try {
              const compressed = buffer.subarray(dataStart, dataEnd);
              let decompressed: Buffer;
              if (compMethod === 8) {
                decompressed = zlib.inflateRawSync(compressed);
              } else if (compMethod === 0) {
                decompressed = compressed;
              } else {
                decompressed = Buffer.alloc(0);
              }
              if (decompressed.length > 0) {
                filesMap.set(fileName.replace(/\\/g, '/').toLowerCase(), decompressed.toString('utf-8'));
              }
            } catch {
              // Ignore
            }
          }
          i = dataEnd > i ? dataEnd : i + 1;
        } else {
          i++;
        }
      }
    }

    // Extract shared strings (case-insensitive key search)
    let sharedStringsXml = '';
    for (const [name, content] of filesMap.entries()) {
      if (name.includes('sharedstrings') && name.endsWith('.xml')) {
        sharedStringsXml = content;
        break;
      }
    }

    const sharedStrings: string[] = [];
    const siMatches = sharedStringsXml.match(/<(?:[a-z0-9_]+:)?si[\s\S]*?<\/(?:[a-z0-9_]+:)?si>/gi) || [];

    for (const si of siMatches) {
      const textMatches = si.match(/<(?:[a-z0-9_]+:)?t[\s\S]*?>([\s\S]*?)<\/(?:[a-z0-9_]+:)?t>/gi) || [];
      const val = textMatches.map((t) => t.replace(/<[^>]+>/g, '')).join('');
      sharedStrings.push(
        val
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim()
      );
    }

    // Extract worksheet XML (case-insensitive sheet search)
    let sheetXml = '';
    for (const [name, content] of filesMap.entries()) {
      if (name.includes('sheet') && name.endsWith('.xml') && !name.includes('_rels')) {
        sheetXml = content;
        break;
      }
    }

    if (!sheetXml) {
      throw new BadRequestError('Excel workbook contains no readable worksheet data.');
    }

    // Helper: Convert column letter "A", "B", "AA" to 0-based column index
    const colLetterToIdx = (colStr: string): number => {
      let idx = 0;
      for (let c = 0; c < colStr.length; c++) {
        idx = idx * 26 + (colStr.charCodeAt(c) - 64);
      }
      return Math.max(0, idx - 1);
    };

    const rowMatches = sheetXml.match(/<(?:[a-z0-9_]+:)?row[\s\S]*?<\/(?:[a-z0-9_]+:)?row>|<(?:[a-z0-9_]+:)?row[^>]*?\/>/gi) || [];
    const parsedRows: string[][] = [];

    for (const rXml of rowMatches) {
      const cMatches = rXml.match(/<(?:[a-z0-9_]+:)?c[\s\S]*?<\/(?:[a-z0-9_]+:)?c>|<(?:[a-z0-9_]+:)?c[^>]*?\/>/gi) || [];
      if (cMatches.length === 0) continue;

      const cells: string[] = [];
      let maxColIdx = 0;

      for (const cXml of cMatches) {
        // Extract column index from r attribute e.g. r="C2", r='C2', r=C2
        const rAttrMatch = cXml.match(/\br=['"]?([A-Z]+)\d+/i);
        let colIdx = cells.length;
        if (rAttrMatch) {
          colIdx = colLetterToIdx(rAttrMatch[1].toUpperCase());
        }

        const isShared = /t="s"/i.test(cXml);
        let cellVal = '';

        if (isShared) {
          const vMatch = cXml.match(/<(?:[a-z0-9_]+:)?v>([\s\S]*?)<\/(?:[a-z0-9_]+:)?v>/i);
          if (vMatch) {
            const idx = parseInt(vMatch[1], 10);
            cellVal = sharedStrings[idx] || '';
          }
        }

        if (!cellVal) {
          // Check for <t> tags (inlineStr, direct string, or rich text)
          const tMatches = cXml.match(/<(?:[a-z0-9_]+:)?t[\s\S]*?>([\s\S]*?)<\/(?:[a-z0-9_]+:)?t>/gi);
          if (tMatches && tMatches.length > 0) {
            cellVal = tMatches.map((t) => t.replace(/<[^>]+>/g, '')).join('');
          } else {
            // Check for <v> tag (numbers, formulas, raw values)
            const vMatch = cXml.match(/<(?:[a-z0-9_]+:)?v>([\s\S]*?)<\/(?:[a-z0-9_]+:)?v>/i);
            if (vMatch) {
              cellVal = vMatch[1];
            }
          }
        }

        cellVal = cellVal
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim();

        // Ensure array is expanded to colIdx
        while (cells.length < colIdx) {
          cells.push('');
        }
        cells[colIdx] = cellVal;
        if (colIdx > maxColIdx) maxColIdx = colIdx;
      }

      if (cells.some((c) => c && c.length > 0)) {
        parsedRows.push(cells);
      }
    }

    return this.processParsedRows(parsedRows);
  }

  private parseXmlOrHtml(rawText: string): { headers: string[]; rows: Record<string, any>[] } {
    const rowMatches = rawText.match(/<(Row|tr)[\s\S]*?<\/\1>/gi);
    if (!rowMatches || rowMatches.length === 0) {
      throw new BadRequestError('Uploaded Excel document contains no valid rows.');
    }

    const parsedRows: string[][] = [];

    for (const rowXml of rowMatches) {
      const cellMatches = rowXml.match(/<(Cell|td|th)[\s\S]*?<\/\1>/gi);
      if (!cellMatches || cellMatches.length === 0) continue;

      const cells: string[] = [];
      for (const cellXml of cellMatches) {
        const dataMatch = cellXml.match(/<(?:ss:)?Data[\s\S]*?>([\s\S]*?)<\/(?:ss:)?Data>/i);
        let val = '';
        if (dataMatch) {
          val = dataMatch[1];
        } else {
          val = cellXml.replace(/<[^>]+>/g, '');
        }
        val = val
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim();
        cells.push(val);
      }

      if (cells.some((c) => c.length > 0)) {
        parsedRows.push(cells);
      }
    }

    return this.processParsedRows(parsedRows);
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
