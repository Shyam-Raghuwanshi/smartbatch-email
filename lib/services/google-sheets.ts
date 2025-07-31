import { z } from 'zod';

const GoogleSheetContactSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type GoogleSheetContact = z.infer<typeof GoogleSheetContactSchema>;

export class GoogleSheetsService {
  constructor(private accessToken: string) {}

  async getSpreadsheetInfo(spreadsheetId: string) {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get spreadsheet: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      title: data.properties.title,
      sheets: data.sheets.map((sheet: any) => ({
        id: sheet.properties.sheetId,
        title: sheet.properties.title,
      })),
    };
  }

  async getSheetData(spreadsheetId: string, range: string) {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get sheet data: ${response.statusText}`);
    }

    const data = await response.json();
    return data.values;
  }

  parseContacts(rows: string[][]): { contacts: GoogleSheetContact[], errors: string[] } {
    const errors: string[] = [];
    const contacts: GoogleSheetContact[] = [];

    // Assuming first row is headers
    const [headers, ...dataRows] = rows;

    // Create a map of column indices
    const columnMap = new Map<string, number>();
    headers.forEach((header, index) => {
      const normalizedHeader = header.toLowerCase().trim();
      switch (normalizedHeader) {
        case 'email':
        case 'email address':
          columnMap.set('email', index);
          break;
        case 'first name':
        case 'firstname':
          columnMap.set('firstName', index);
          break;
        case 'last name':
        case 'lastname':
          columnMap.set('lastName', index);
          break;
        case 'phone':
        case 'phone number':
          columnMap.set('phone', index);
          break;
        case 'company':
        case 'organization':
          columnMap.set('company', index);
          break;
        case 'tags':
        case 'labels':
          columnMap.set('tags', index);
          break;
      }
    });

    // Validate required columns
    if (!columnMap.has('email')) {
      throw new Error('Email column is required but not found in the spreadsheet');
    }

    // Process each row
    dataRows.forEach((row, rowIndex) => {
      try {
        const contact: Partial<GoogleSheetContact> = {
          email: row[columnMap.get('email')!]?.trim(),
          firstName: columnMap.has('firstName') ? row[columnMap.get('firstName')!]?.trim() : undefined,
          lastName: columnMap.has('lastName') ? row[columnMap.get('lastName')!]?.trim() : undefined,
          phone: columnMap.has('phone') ? row[columnMap.get('phone')!]?.trim() : undefined,
          company: columnMap.has('company') ? row[columnMap.get('company')!]?.trim() : undefined,
          tags: columnMap.has('tags') 
            ? row[columnMap.get('tags')!]?.split(',').map(tag => tag.trim()).filter(Boolean)
            : undefined,
        };

        // Validate the contact data
        const result = GoogleSheetContactSchema.safeParse(contact);
        if (result.success) {
          contacts.push(result.data);
        } else {
          errors.push(`Row ${rowIndex + 2}: ${result.error.errors.map(e => e.message).join(', ')}`);
        }
      } catch (error) {
        errors.push(`Row ${rowIndex + 2}: Failed to process row - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    return { contacts, errors };
  }
}
