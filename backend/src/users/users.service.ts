import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
	constructor(private readonly prisma: PrismaService) {}

	createUser(params: { email: string; fullName: string; hashedPassword: string; phone?: string | null; streamId?: string }) {
		const { email, fullName, hashedPassword, phone, streamId } = params;
		return this.prisma.user.create({ 
			data: { 
				email, 
				fullName, 
				hashedPassword, 
				phone: phone || null,
				streamId: streamId || null
			} 
		});
	}

	findByEmail(email: string) {
		return this.prisma.user.findUnique({ where: { email } });
	}

	findById(id: string) {
		return this.prisma.user.findUnique({ where: { id } });
	}

	async setEmailVerified(userId: string) {
		return this.prisma.user.update({ where: { id: userId }, data: { emailVerified: true } });
	}

	async setPhoneVerified(userId: string) {
		return this.prisma.user.update({ where: { id: userId }, data: { phoneVerified: true } });
	}

	async updateTrial(userId: string, startedAt: Date, endsAt: Date) {
		return this.prisma.user.update({ where: { id: userId }, data: { trialStartedAt: startedAt, trialEndsAt: endsAt } });
	}
} 