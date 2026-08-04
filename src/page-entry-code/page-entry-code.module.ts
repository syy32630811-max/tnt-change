import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PageEntryCode } from '../entities';
import { PageEntryCodeController } from './page-entry-code.controller';
import { PageEntryCodeService } from './page-entry-code.service';

@Module({
  imports: [TypeOrmModule.forFeature([PageEntryCode])],
  controllers: [PageEntryCodeController],
  providers: [PageEntryCodeService],
  exports: [PageEntryCodeService],
})
export class PageEntryCodeModule {}
