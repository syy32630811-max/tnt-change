/*
 * @Author: aliyun9402055519
 * @Date: 2026-07-16 16:37:08
 * @LastEditors: aliyun9402055519
 * @LastEditTime: 2026-08-04 14:17:25
 * @FilePath: /change/src/app.module.ts
 * @Description: 默认
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import databaseConfig from './config/database.config';
import { DatabaseModule } from './database/database.module';
import { MaterialModule } from './material/material.module';
import { OrderModule } from './order/order.module';
import { PageEntryCodeModule } from './page-entry-code/page-entry-code.module';
import { ProductModule } from './product/product.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    DatabaseModule,
    AuthModule,
    UploadModule,
    PageEntryCodeModule,
    MaterialModule,
    ProductModule,
    OrderModule,
  ],
})
export class AppModule {}
