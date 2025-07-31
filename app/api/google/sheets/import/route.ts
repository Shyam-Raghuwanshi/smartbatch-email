import { NextRequest } from 'next/server';
import { GoogleSheetsService } from '@/lib/google/sheets';
import { GoogleOAuthManager } from '@/lib/google/oauth';

export async function POST(req: NextRequest) {
  try {
    const { spreadsheetId, sheetName, userId } = await req.json();

    if (!spreadsheetId || !sheetName) {
      return Response.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const oauthManager = GoogleOAuthManager.getInstance();
    const sheetsService = GoogleSheetsService.getInstance();

    // Check rate limit
    const canProceed = await oauthManager.checkRateLimit(userId);
    if (!canProceed) {
      return Response.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Get cached token or refresh if needed
    let accessToken = oauthManager.getCachedToken(userId);
    if (!accessToken) {
      // Here you would typically refresh the token using the stored refresh token
      // For now, we'll return an error
      return Response.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch sheet data
    const range = `${sheetName}!A1:Z`;
    const data = await sheetsService.getSheetData(spreadsheetId, range, accessToken);

    if (!data.values || data.values.length < 2) {
      return Response.json(
        { error: 'No data found in sheet' },
        { status: 400 }
      );
    }

    // Process the data
    const [headerRow, ...dataRows] = data.values;
    const contacts = [];
    const errors = [];

    for (const row of dataRows) {
      const { isValid, errors: validationErrors } = await sheetsService.validateContact(row);
      
      if (isValid) {
        const contact = sheetsService.transformToContact(row, headerRow);
        contacts.push(contact);
      } else {
        errors.push(...validationErrors);
      }
    }

    return Response.json({
      success: true,
      contacts,
      totalProcessed: dataRows.length,
      successCount: contacts.length,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Sheet import error:', error);
    return Response.json(
      { error: 'Failed to import contacts' },
      { status: 500 }
    );
  }
}
