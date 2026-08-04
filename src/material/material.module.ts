import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangeMaterial } from '../entities';
import { MaterialController } from './material.controller';
import { MaterialService } from './material.service';

@Module({
  imports: [TypeOrmModule.forFeature([ExchangeMaterial])],
  controllers: [MaterialController],
  providers: [MaterialService],
})
export class MaterialModule {}
