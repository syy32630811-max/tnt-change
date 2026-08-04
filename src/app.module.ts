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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    DatabaseModule,
    AuthModule,
  ],
})
export class AppModule {}
