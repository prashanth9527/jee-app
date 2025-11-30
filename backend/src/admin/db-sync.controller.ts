import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { DbSyncService } from './db-sync.service';

@Controller('admin/db-sync')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class DbSyncController {
  constructor(private readonly dbSyncService: DbSyncService) {}

  @Post()
  async syncDatabase() {
    return this.dbSyncService.syncDatabase();
  }
}

