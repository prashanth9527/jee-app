'use client';

// Google OAuth configuration
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

// Google OAuth scopes
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
].join(' ');

// Google OAuth endpoints
export const GOOGLE_AUTH_URL = 'https://accounts.google.com/oauth/authorize';
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

  // Exchange authorization code for access token
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<GoogleAuthResponse> {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET || '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
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
  signIn(redirectUri?: string): void {
    const currentUrl = window.location.origin;
    const finalRedirectUri = redirectUri || `${currentUrl}/auth/google/callback`;
    const state = Math.random().toString(36).substring(2, 15);
    
    // Store state in sessionStorage for verification
    sessionStorage.setItem('google_oauth_state', state);
    
    const authUrl = this.generateAuthUrl(finalRedirectUri, state);
    window.location.href = authUrl;
  }

  // Handle Google Sign-In callback
  async handleCallback(code: string, state: string, redirectUri?: string): Promise<GoogleUser> {
    // Verify state parameter
    const storedState = sessionStorage.getItem('google_oauth_state');
    if (state !== storedState) {
      throw new Error('Invalid state parameter');
    }

    // Clear stored state
    sessionStorage.removeItem('google_oauth_state');

    const currentUrl = window.location.origin;
    const finalRedirectUri = redirectUri || `${currentUrl}/auth/google/callback`;

    try {
      // Exchange code for token
      const tokenResponse = await this.exchangeCodeForToken(code, finalRedirectUri);
      
      // Get user information
      const userInfo = await this.getUserInfo(tokenResponse.access_token);
      
      return userInfo;
    } catch (error) {
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
  return () => {
    try {
      const googleAuth = new GoogleAuthService();
      googleAuth.signIn(redirectUri);
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
  return !!(GOOGLE_CLIENT_ID && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET);
}; 