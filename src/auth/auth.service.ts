/*
 * @Author: aliyun9402055519
 * @Date: 2026-07-16 16:39:58
 * @LastEditors: aliyun9402055519
 * @LastEditTime: 2026-08-04 14:22:51
 * @FilePath: /change/src/auth/auth.service.ts
 * @Description: 默认
 */
import {
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(private readonly configService: ConfigService) {}
}
