import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

interface GoogleLoginDto {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}

@Controller('auth/google')
export class GoogleAuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService
  ) {}

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
        // Create new user
        user = await this.prisma.user.create({
          data: {
            googleId: googleId,
            email: email,
            fullName: name,
            profilePicture: picture,
            emailVerified: true, // Google emails are pre-verified
            role: 'STUDENT' // Default role for Google sign-ups
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
  async googleRegister(@Body() googleData: GoogleLoginDto & { streamId?: string }) {
    try {
      const { googleId, email, name, picture, streamId } = googleData;

      if (!googleId || !email || !name) {
        throw new HttpException('Missing required Google user data', HttpStatus.BAD_REQUEST);
      }

      // Check if user already exists
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { googleId: googleId },
            { email: email }
          ]
        }
      });

      if (existingUser) {
        throw new HttpException('User already exists with this email or Google account', HttpStatus.CONFLICT);
      }

      // Create new user
      const userData: any = {
        googleId: googleId,
        email: email,
        fullName: name,
        profilePicture: picture,
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
} 