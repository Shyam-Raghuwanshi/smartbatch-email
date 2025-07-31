import { NextRequest } from 'next/server';
import { GoogleSheetsService } from '@/lib/services/google-sheets';

export async function POST(req: NextRequest) {
  try {
    const { accessToken, spreadsheetId, sheetName } = await req.json();

    if (!accessToken || !spreadsheetId || !sheetName) {
      return Response.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const sheetsService = new GoogleSheetsService(accessToken);

    // Get spreadsheet data
    const range = `${sheetName}!A1:Z1000`; // Adjust range as needed
    const rows = await sheetsService.getSheetData(spreadsheetId, range);

    if (!rows || rows.length < 2) {
      return Response.json(
        { error: 'No data found in spreadsheet' },
        { status: 400 }
      );
    }

    // Return raw data for frontend processing
    return Response.json({
      success: true,
      values: rows, // Return raw rows data for frontend processing
      totalRows: rows.length - 1, // Subtract header row
    });
  } catch (error) {
    console.error('Sheet data fetch error:', error);
    return Response.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch sheet data',
      },
      { status: 500 }
    );
  }
}
