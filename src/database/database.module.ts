/*
 * @Author: aliyun9402055519
 * @Date: 2026-07-16 17:13:13
 * @LastEditors: aliyun9402055519
 * @LastEditTime: 2026-08-04 14:24:05
 * @FilePath: /change/src/database/database.module.ts
 * @Description: 默认
 */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from '../config/database.config';
import {
  ExchangeMaterial,
  MaterialExchangeRecord,
  Order,
  OrderItem,
  PageEntryCode,
  Product,
  ProductSpec,
} from '../entities';

@Module({
  imports: [
    ConfigModule.forFeature(databaseConfig),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql' as const,
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        entities: [
          PageEntryCode,
          ExchangeMaterial,
          MaterialExchangeRecord,
          Product,
          ProductSpec,
          Order,
          OrderItem,
        ],
        synchronize: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
