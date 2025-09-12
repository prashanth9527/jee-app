import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FormulasService } from './formulas.service';
import { FormulasController } from './formulas.controller';

@Module({
  imports: [PrismaModule],
  controllers: [FormulasController],
  providers: [FormulasService],
  exports: [FormulasService],
})
export class FormulasModule {}
