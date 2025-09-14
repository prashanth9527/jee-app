import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // This endpoint helps debug environment variables and connectivity
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
      NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL,
    },
    request: {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
    },
    connectivity: {
      backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001',
      hasBackendUrl: !!process.env.NEXT_PUBLIC_BACKEND_URL,
    } as any
  };

  // Test backend connectivity if BACKEND_URL is set
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    try {
      const testUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/blogs`;
      console.log('Testing backend connectivity to:', testUrl);
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      debugInfo.connectivity = {
        ...debugInfo.connectivity,
        backendTest: {
          url: testUrl,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
        }
      };

      if (response.ok) {
        const data = await response.json();
        debugInfo.connectivity.backendTest.data = data;
      } else {
        const errorText = await response.text();
        debugInfo.connectivity.backendTest.error = errorText;
      }
    } catch (error: any) {
      debugInfo.connectivity.backendTest = {
        error: error?.message || 'Unknown error',
        type: error?.name || 'Error',
      };
    }
  }

  return NextResponse.json(debugInfo, { status: 200 });
}
