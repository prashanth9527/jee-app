import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OAuthStateService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate and store a new OAuth state
   */
  async generateState(provider: string, redirectUri?: string, ttlMinutes: number = 10): Promise<string> {
    const state = this.generateRandomState();
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await this.prisma.oAuthState.create({
      data: {
        state,
        provider,
        redirectUri,
        expiresAt,
      },
    });

    return state;
  }

  /**
   * Validate and consume an OAuth state
   */
  async validateAndConsumeState(state: string, provider: string): Promise<{ redirectUri?: string }> {
    const oauthState = await this.prisma.oAuthState.findUnique({
      where: { state },
    });

    if (!oauthState) {
      throw new Error('Invalid state parameter');
    }

    if (oauthState.provider !== provider) {
      throw new Error('State provider mismatch');
    }

    if (oauthState.expiresAt < new Date()) {
      // Clean up expired state
      await this.prisma.oAuthState.delete({
        where: { id: oauthState.id },
      });
      throw new Error('State has expired');
    }

    // Consume the state (delete it after validation)
    await this.prisma.oAuthState.delete({
      where: { id: oauthState.id },
    });

    return {
      redirectUri: oauthState.redirectUri || undefined,
    };
  }

  /**
   * Clean up expired states (can be called periodically)
   */
  async cleanupExpiredStates(): Promise<number> {
    const result = await this.prisma.oAuthState.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }

  /**
   * Generate a cryptographically secure random state
   */
  private generateRandomState(): string {
    const timestamp = Date.now().toString(36);
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    const randomString = Array.from(randomBytes, byte => byte.toString(36)).join('');
    return `${timestamp}_${randomString}`;
  }
}

