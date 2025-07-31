import { GOOGLE_APIS } from './config';
import { GoogleOAuthManager } from './oauth';

interface SheetData {
  range: string;
  values: any[][];
}

export class GoogleSheetsService {
  private static instance: GoogleSheetsService;
  private oauthManager: GoogleOAuthManager;

  private constructor() {
    this.oauthManager = GoogleOAuthManager.getInstance();
  }

  static getInstance(): GoogleSheetsService {
    if (!GoogleSheetsService.instance) {
      GoogleSheetsService.instance = new GoogleSheetsService();
    }
    return GoogleSheetsService.instance;
  }

  async getSpreadsheetInfo(spreadsheetId: string, accessToken: string) {
    const response = await fetch(
      `${GOOGLE_APIS.sheets}/spreadsheets/${spreadsheetId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get spreadsheet info: ${response.statusText}`);
    }

    return response.json();
  }

  async getSheetData(
    spreadsheetId: string,
    range: string,
    accessToken: string
  ): Promise<SheetData> {
    const response = await fetch(
      `${GOOGLE_APIS.sheets}/spreadsheets/${spreadsheetId}/values/${range}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get sheet data: ${response.statusText}`);
    }

    return response.json();
  }

  async validateContact(row: any[]): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    // Validate email (assuming it's in the first column)
    const email = row[0];
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      errors.push('Invalid or missing email address');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  transformToContact(row: any[], headerRow: string[]): Record<string, any> {
    const contact: Record<string, any> = {};
    
    headerRow.forEach((header, index) => {
      const normalizedHeader = header.toLowerCase().trim();
      switch (normalizedHeader) {
        case 'email':
          contact.email = row[index];
          break;
        case 'first name':
        case 'firstname':
          contact.firstName = row[index];
          break;
        case 'last name':
        case 'lastname':
          contact.lastName = row[index];
          break;
        case 'phone':
        case 'phone number':
          contact.phone = row[index];
          break;
        case 'company':
          contact.company = row[index];
          break;
        case 'tags':
          contact.tags = row[index] ? row[index].split(',').map((t: string) => t.trim()) : [];
          break;
      }
    });

    return contact;
  }
}
