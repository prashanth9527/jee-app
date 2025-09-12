import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AwsModule } from '../aws/aws.module';
import { OtpModule } from '../auth/otp.module';

@Module({
	imports: [PrismaModule, AwsModule, OtpModule],
	providers: [UsersService],
	controllers: [UsersController],
	exports: [UsersService],
})
export class UsersModule {} 