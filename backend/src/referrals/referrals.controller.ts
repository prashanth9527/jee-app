import { Controller, Get, Post, Body, Param, Req, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ReferralsService } from './referrals.service';

@Controller('referrals')
@UseGuards(JwtAuthGuard)
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  // Generate referral code for current user
  @Post('generate-code')
  async generateReferralCode(@Req() req: any) {
    return this.referralsService.generateReferralCode(req.user.id);
  }

  // Get user's referral information
  @Get('my-referrals')
  async getMyReferrals(@Req() req: any) {
    return this.referralsService.getUserReferralInfo(req.user.id);
  }

  // Validate referral code
  @Get('validate/:code')
  async validateReferralCode(@Param('code') code: string) {
    return this.referralsService.validateReferralCode(code);
  }

  // Apply referral code (for new users during registration)
  @Post('apply-code')
  async applyReferralCode(@Req() req: any, @Body() body: { code: string }) {
    return this.referralsService.applyReferralCode(req.user.id, body.code);
  }

  // Claim reward
  @Post('claim-reward/:rewardId')
  async claimReward(@Req() req: any, @Param('rewardId') rewardId: string) {
    return this.referralsService.claimReward(req.user.id, rewardId);
  }

  // Get referral leaderboard (public)
  @Get('leaderboard')
  async getLeaderboard(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit) : 10;
    return this.referralsService.getReferralLeaderboard(limitNum);
  }

  // Send referral code via email
  @Post('send-email')
  async sendReferralCodeByEmail(@Req() req: any, @Body() body: { emails: string }) {
    const emails = body.emails.split(',').map((e: string) => e.trim()).filter((e: string) => e);
    return this.referralsService.sendReferralCodeByEmail(req.user.id, emails);
  }

  // Get referral email history
  @Get('email-history')
  async getEmailHistory(@Req() req: any) {
    return this.referralsService.getReferralEmailHistory(req.user.id);
  }
}

// Admin controller for managing referrals
@Controller('admin/referrals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  // Get all referrals for admin
  @Get()
  async getAllReferrals() {
    // This would be implemented to get all referrals with pagination
    return { message: 'Admin referrals endpoint' };
  }

  // Get referral statistics
  @Get('stats')
  async getReferralStats() {
    // This would be implemented to get overall referral statistics
    return { message: 'Referral statistics endpoint' };
  }
} 