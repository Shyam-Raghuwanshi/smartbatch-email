// app/api/test-data/route.ts

export async function GET(req: Request) {
  try {
    console.log('Test API endpoint called');
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    // Get API key from headers
    const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');

    console.log('Extracted API key:', apiKey ? '[PRESENT]' : '[MISSING]');

    if (!apiKey) {
      console.log('No API key provided');
      return new Response(
        JSON.stringify({ error: 'API key is required. Provide it via x-api-key header or Authorization Bearer token.' }),
        {
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
          },
        }
      );
    }

    if (apiKey !== "test_key") {
      console.log('Invalid API key provided:', apiKey);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
          },
        }
      );
    }

    console.log('API key validated, returning test data');

    // Simulate the expected SmartBatch-like response
    return new Response(
      JSON.stringify({
        "contacts": [
          {
            "email": "user@example.com",
            "firstName": "John",
            "lastName": "Doe",
            "phone": "+1234567890",
            "company": "Acme Corp",
            "position": "Developer",
            "tags": ["lead", "premium"]
          },
          {
            "email": "jane@example.com",
            "firstName": "Jane",
            "lastName": "Smith",
            "phone": "+0987654321",
            "company": "Tech Corp",
            "position": "Designer",
            "tags": ["client", "vip"]
          }
        ]
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
        },
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
        },
      }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    },
  });
}
