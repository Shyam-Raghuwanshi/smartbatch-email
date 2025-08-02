import { NextRequest } from 'next/server';
import { GoogleSheetsService } from '@/lib/services/google-sheets';

async function isTokenValid(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`
    );
    return response.ok;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { accessToken, spreadsheetId, sheetName, refreshToken } = await req.json();

    if (!accessToken || !spreadsheetId || !sheetName) {
      return Response.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    let workingToken = accessToken;

    // Always check if token is valid first and refresh if needed
    const isValid = await isTokenValid(accessToken);
    
    if (!isValid) {
      if (!refreshToken) {
        return Response.json(
          { error: 'Access token expired and no refresh token available. Please reconnect your Google account.' },
          { status: 401 }
        );
      }
      
      // Try to refresh the token
      console.log('Access token expired, attempting to refresh...', {
        hasRefreshToken: !!refreshToken,
        refreshTokenLength: refreshToken?.length
      });
      
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return Response.json(
          { error: 'Server configuration error' },
          { status: 500 }
        );
      }

      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        workingToken = refreshData.access_token;
        console.log('Token refreshed successfully');
      } else {
        const errorText = await refreshResponse.text();
        console.error('Token refresh failed:', {
          status: refreshResponse.status,
          statusText: refreshResponse.statusText,
          error: errorText
        });
        return Response.json(
          { error: 'Token expired and refresh failed. Please reconnect your Google account.' },
          { status: 401 }
        );
      }
    }

    // Now try to get the sheet data with the validated/refreshed token
    const sheetsService = new GoogleSheetsService(workingToken);

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
      newAccessToken: workingToken !== accessToken ? workingToken : undefined,
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
