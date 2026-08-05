import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ExchangeMaterial,
  MaterialExchangeRecord,
  PageEntryCode,
} from '../entities';
import { MaterialExchangeController } from './material-exchange.controller';
import { MaterialExchangeService } from './material-exchange.service';
import { QrCodeService } from './qr-code.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MaterialExchangeRecord,
      ExchangeMaterial,
      PageEntryCode,
    ]),
  ],
  controllers: [MaterialExchangeController],
  providers: [MaterialExchangeService, QrCodeService],
})
export class MaterialExchangeModule {}
