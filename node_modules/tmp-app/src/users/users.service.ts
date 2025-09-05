import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
	constructor(private readonly prisma: PrismaService) {}

	createUser(params: { email: string; fullName: string; hashedPassword: string; phone?: string | null; streamId?: string; emailVerified?: boolean }) {
		const { email, fullName, hashedPassword, phone, streamId, emailVerified } = params;
		return this.prisma.user.create({ 
			data: { 
				email, 
				fullName, 
				hashedPassword, 
				phone: phone || null,
				streamId: streamId || null,
				emailVerified: emailVerified !== undefined ? emailVerified : true
			} 
		});
	}

	findByEmail(email: string) {
		return this.prisma.user.findUnique({ where: { email } });
	}

	findByPhone(phone: string) {
		return this.prisma.user.findUnique({ where: { phone } });
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