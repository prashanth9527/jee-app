import { Controller, Post, Body, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { OAuthStateService } from './oauth-state.service';
import { UsersService } from '../users/users.service';
import { normalizeIndianPhone, isValidIndianMobile } from './utils/phone.utils';
import axios from 'axios';

interface GoogleLoginDto {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}

interface GoogleTokenExchangeDto {
  code: string;
  redirectUri: string;
  state?: string;
}

interface GoogleStateDto {
  redirectUri?: string;
}

@Controller('auth/google')
export class GoogleAuthController {
  private usedCodes = new Set<string>(); // Track used authorization codes
  
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
    private oauthStateService: OAuthStateService,
    private usersService: UsersService
  ) {}

  @Post('state')
  async generateState(@Body() stateData: GoogleStateDto) {
    try {
      const { redirectUri } = stateData;
      const state = await this.oauthStateService.generateState('google', redirectUri);
      
      return {
        state,
        message: 'OAuth state generated successfully'
      };
    } catch (error) {
      console.error('Error generating OAuth state:', error);
      throw new HttpException(
        'Failed to generate OAuth state',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('login')
  async googleLogin(@Body() googleData: GoogleLoginDto) {
    try {
      const { googleId, email, name, picture } = googleData;

      if (!googleId || !email || !name) {
        throw new HttpException('Missing required Google user data', HttpStatus.BAD_REQUEST);
      }

      // Check if user exists with this Google ID
      let user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { googleId: googleId },
            { email: email }
          ]
        },
        include: {
          stream: true,
          subscriptions: {
            include: {
              plan: true
            }
          }
        }
      });

      if (user) {
        // Update user's Google ID if not already set
        if (!user.googleId) {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: { 
              googleId: googleId,
              profilePicture: picture || user.profilePicture
            },
            include: {
              stream: true,
              subscriptions: {
                include: {
                  plan: true
                }
              }
            }
          });
        }
      } else {
        // Create new user without stream (needs profile completion)
        user = await this.prisma.user.create({
          data: {
            googleId: googleId,
            email: email,
            fullName: name,
            profilePicture: picture,
            emailVerified: true, // Google emails are pre-verified
            role: 'STUDENT', // Default role for Google sign-ups
            streamId: null // User needs to select stream
          },
          include: {
            stream: true,
            subscriptions: {
              include: {
                plan: true
              }
            }
          }
        });
      }

      // Generate JWT token
      const token = await this.authService.generateJwtToken(user);

      // Check if user needs profile completion (only for students)
      const needsProfileCompletion = user.role === 'STUDENT' && (!user.streamId || !user.phone);

      return {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          profilePicture: user.profilePicture,
          emailVerified: user.emailVerified,
          stream: user.stream,
          subscriptions: user.subscriptions,
          needsProfileCompletion
        }
      };
    } catch (error) {
      console.error('Google login error:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Google authentication failed', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('register')
  async googleRegister(@Body() googleData: GoogleLoginDto & { streamId?: string; phone?: string }) {
    try {
      const { googleId, email, name, picture, streamId, phone } = googleData;

      if (!googleId || !email || !name) {
        throw new HttpException('Missing required Google user data', HttpStatus.BAD_REQUEST);
      }

      if (!phone) {
        throw new HttpException('Phone number is required for registration', HttpStatus.BAD_REQUEST);
      }

      // Normalize phone number by adding +91
      const normalizedPhone = normalizeIndianPhone(phone);
      
      // Validate Indian mobile number format
      if (!isValidIndianMobile(normalizedPhone)) {
        throw new HttpException('Please enter a valid 10-digit Indian mobile number', HttpStatus.BAD_REQUEST);
      }

      // Check if user already exists
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { googleId: googleId },
            { email: email },
            { phone: normalizedPhone }
          ]
        }
      });

      if (existingUser) {
        throw new HttpException('User already exists with this email, phone number, or Google account', HttpStatus.CONFLICT);
      }

      // Create new user
      const userData: any = {
        googleId: googleId,
        email: email,
        fullName: name,
        profilePicture: picture,
        phone: normalizedPhone,
        emailVerified: true,
        role: 'STUDENT'
      };

      if (streamId) {
        // Verify stream exists
        const stream = await this.prisma.stream.findUnique({
          where: { id: streamId }
        });
        
        if (!stream) {
          throw new HttpException('Invalid stream selected', HttpStatus.BAD_REQUEST);
        }
        
        userData.streamId = streamId;
      }

      const user = await this.prisma.user.create({
        data: userData,
        include: {
          stream: true,
          subscriptions: {
            include: {
              plan: true
            }
          }
        }
      });

      // Set up trial period for new Google users
      const days = Number(process.env.FREE_TRIAL_DAYS || 2);
      const started = new Date();
      const ends = new Date(started.getTime() + days * 24 * 60 * 60 * 1000);
      await this.usersService.updateTrial(user.id, started, ends);

      // Generate JWT token
      const token = await this.authService.generateJwtToken(user);

      return {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          profilePicture: user.profilePicture,
          emailVerified: user.emailVerified,
          stream: user.stream,
          subscriptions: user.subscriptions
        }
      };
    } catch (error) {
      console.error('Google registration error:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Google registration failed', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('token')
  async exchangeToken(@Body() tokenData: GoogleTokenExchangeDto) {
    try {
      const { code, redirectUri, state } = tokenData;

      if (!code || !redirectUri) {
        throw new HttpException('Missing code or redirectUri', HttpStatus.BAD_REQUEST);
      }

      // Check if this authorization code has already been used
      if (this.usedCodes.has(code)) {
        console.log('Authorization code already used:', code.substring(0, 10) + '...');
        throw new HttpException('Authorization code has already been used. Please try logging in again.', HttpStatus.BAD_REQUEST);
      }

      // Mark this code as used
      this.usedCodes.add(code);
      
      // Clean up old codes periodically (keep only last 100 codes)
      if (this.usedCodes.size > 100) {
        const codesArray = Array.from(this.usedCodes);
        this.usedCodes.clear();
        codesArray.slice(-50).forEach(c => this.usedCodes.add(c));
      }

      // Validate state parameter if provided
      if (state) {
        try {
          const stateData = await this.oauthStateService.validateAndConsumeState(state, 'google');
          console.log('OAuth state validated successfully:', stateData);
        } catch (stateError) {
          console.error('OAuth state validation failed:', stateError);
          // Always allow proceeding without state validation for now
          console.log('Proceeding without state validation due to error:', stateError.message);
        }
      }

      // Exchange authorization code for access token
      console.log('Attempting to exchange authorization code with Google:', {
        code: code.substring(0, 10) + '...',
        redirectUri,
        clientId: process.env.GOOGLE_CLIENT_ID ? 'present' : 'missing'
      });

      let tokenResponse;
      try {
        tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
      } catch (tokenError: any) {
        console.error('Google token exchange error:', tokenError);
        console.error('Token exchange request details:', {
          code: code.substring(0, 10) + '...',
          redirectUri,
          clientId: process.env.GOOGLE_CLIENT_ID ? 'present' : 'missing',
          errorResponse: tokenError.response?.data
        });
        
        if (tokenError.response?.status === 400) {
          throw new BadRequestException('Invalid or expired authorization code. Please try logging in again.');
        }
        
        throw new BadRequestException('Failed to exchange Google authorization code');
      }

      const { access_token } = tokenResponse.data;

      // Get user information from Google
      const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const userInfo = userInfoResponse.data;

      return {
        access_token,
        user: {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
        },
      };
    } catch (error) {
      console.error('Google token exchange error:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Failed to exchange Google authorization code',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('cleanup-states')
  async cleanupExpiredStates() {
    try {
      const cleanedCount = await this.oauthStateService.cleanupExpiredStates();
      
      return {
        message: 'OAuth states cleaned up successfully',
        cleanedCount
      };
    } catch (error) {
      console.error('Error cleaning up OAuth states:', error);
      throw new HttpException(
        'Failed to cleanup OAuth states',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 