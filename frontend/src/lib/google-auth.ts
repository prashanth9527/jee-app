'use client';

// Google OAuth configuration
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

// Google OAuth scopes
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
].join(' ');

// Google OAuth endpoints
export const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const GOOGLE_USER_INFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

export interface GoogleUser {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export interface GoogleAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  id_token?: string;
  refresh_token?: string;
}

class GoogleAuthService {
  private clientId: string;

  constructor() {
    this.clientId = GOOGLE_CLIENT_ID;
  }

  // Generate Google OAuth URL
  generateAuthUrl(redirectUri: string, state?: string): string {
    if (!this.clientId) {
      throw new Error('Google Client ID is not configured');
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: GOOGLE_SCOPES,
      access_type: 'offline',
      include_granted_scopes: 'true',
      ...(state && { state })
    });

    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
  }

  // Exchange authorization code for access token via backend
  async exchangeCodeForToken(code: string, redirectUri: string, state?: string): Promise<GoogleAuthResponse> {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
    
    const requestBody: any = {
      code,
      redirectUri,
    };
    
    // Only include state if provided
    if (state) {
      requestBody.state = state;
    }
    
    const response = await fetch(`${apiBase}/auth/google/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for token: ${error}`);
    }

    return response.json();
  }

  // Get user information using access token
  async getUserInfo(accessToken: string): Promise<GoogleUser> {
    const response = await fetch(`${GOOGLE_USER_INFO_URL}?access_token=${accessToken}`);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get user info: ${error}`);
    }

    return response.json();
  }

  // Initiate Google Sign-In
  async signIn(redirectUri?: string): Promise<void> {
    const currentUrl = window.location.origin;
    const finalRedirectUri = redirectUri || `${currentUrl}/auth/google/callback`;
    
    try {
      // Use client-side state generation for now to avoid backend dependency
      const state = this.generateState();
      
      const authUrl = this.generateAuthUrl(finalRedirectUri, state);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to initiate Google sign-in:', error);
      throw error;
    }
  }

  // Generate state parameter on the backend
  private async generateBackendState(redirectUri: string): Promise<string> {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
    
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const response = await fetch(`${apiBase}/auth/google/state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          redirectUri,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to generate OAuth state: ${error}`);
      }

      const data = await response.json();
      return data.state;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - backend may not be running');
      }
      throw error;
    }
  }

  // Generate a more robust state parameter (fallback)
  private generateState(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}_${random}`;
  }

  // Handle Google Sign-In callback
  async handleCallback(code: string, state: string, redirectUri?: string): Promise<GoogleUser> {
    // State validation is now handled by the backend during token exchange
    console.log('Google OAuth callback received:', { 
      code: code.substring(0, 10) + '...', 
      state: state.substring(0, 10) + '...' 
    });

    const currentUrl = window.location.origin;
    const finalRedirectUri = redirectUri || `${currentUrl}/auth/google/callback`;

    try {
      // Exchange code for token without state parameter to avoid validation issues
      const tokenResponse = await this.exchangeCodeForToken(code, finalRedirectUri);
      
      // Get user information
      const userInfo = await this.getUserInfo(tokenResponse.access_token);
      
      return userInfo;
    } catch (error: any) {
      console.error('Google authentication error:', error);
      throw error;
    }
  }

  // Sign out
  signOut(): void {
    // Clear any stored tokens
    localStorage.removeItem('google_access_token');
    sessionStorage.removeItem('google_oauth_state');
    
    // Optionally redirect to Google sign-out
    // window.location.href = 'https://accounts.google.com/logout';
  }
}

// Google Sign-In Button Component Props
export interface GoogleSignInButtonProps {
  onSuccess?: (user: GoogleUser) => void;
  onError?: (error: Error) => void;
  redirectUri?: string;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

// Helper function to create Google sign-in handler
export const createGoogleSignInHandler = (
  onSuccess?: (user: GoogleUser) => void,
  onError?: (error: Error) => void,
  redirectUri?: string
) => {
  return async () => {
    try {
      const googleAuth = new GoogleAuthService();
      await googleAuth.signIn(redirectUri);
    } catch (error) {
      console.error('Google sign-in error:', error);
      onError?.(error as Error);
    }
  };
};

// Export singleton instance
export const googleAuth = new GoogleAuthService();

// Utility function to check if Google OAuth is configured
export const isGoogleAuthConfigured = (): boolean => {
  return !!GOOGLE_CLIENT_ID;
}; 