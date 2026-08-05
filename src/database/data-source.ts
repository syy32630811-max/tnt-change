/*
 * @Author: aliyun9402055519
 * @Date: 2026-07-16 17:13:08
 * @LastEditors: aliyun9402055519
 * @LastEditTime: 2026-08-04 14:14:41
 * @FilePath: /change/src/database/data-source.ts
 * @Description: 默认
 */
import { DataSource, type DataSourceOptions } from 'typeorm';
import {
  ExchangeMaterial,
  MaterialExchangeRecord,
  Order,
  OrderItem,
  PageEntryCode,
  Product,
  ProductSpec,
} from '../entities';
import { InitTables1754290800000 } from './migrations/1754290800000-InitTables';
import { AdminTables1754294400000 } from './migrations/1754294400000-AdminTables';
import { AddProductSpecName1754295000000 } from './migrations/1754295000000-AddProductSpecName';
import { MaterialExchangeRecords1754300000000 } from './migrations/1754300000000-MaterialExchangeRecords';
import { AddPageCodeToExchangeRecords1754301000000 } from './migrations/1754301000000-AddPageCodeToExchangeRecords';
import { AddExchangeRecordValidAndQr1754302000000 } from './migrations/1754302000000-AddExchangeRecordValidAndQr';

export function getDatabaseConfig(): DatabaseConnectionConfig {
  return {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '3306', 10),
    username: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD ?? '123456',
    database: process.env.DB_NAME ?? 'tnt_shop',
  };
}

export interface DatabaseConnectionConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export function getDataSourceOptions(
  config: DatabaseConnectionConfig = getDatabaseConfig(),
): DataSourceOptions {
  return {
    type: 'mysql',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    entities: [
      PageEntryCode,
      ExchangeMaterial,
      MaterialExchangeRecord,
      Product,
      ProductSpec,
      Order,
      OrderItem,
    ],
    migrations: [
      InitTables1754290800000,
      AdminTables1754294400000,
      AddProductSpecName1754295000000,
      MaterialExchangeRecords1754300000000,
      AddPageCodeToExchangeRecords1754301000000,
      AddExchangeRecordValidAndQr1754302000000,
    ],
    synchronize: false,
  };
}

export function createDataSource(
  config: DatabaseConnectionConfig = getDatabaseConfig(),
): DataSource {
  return new DataSource(getDataSourceOptions(config));
}
