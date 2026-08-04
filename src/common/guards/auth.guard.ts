/*
 * @Author: aliyun9402055519
 * @Date: 2026-07-16 16:40:04
 * @LastEditors: aliyun9402055519
 * @LastEditTime: 2026-08-04 14:24:21
 * @FilePath: /change/src/common/guards/auth.guard.ts
 * @Description: 默认
 */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { openid?: string }>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('请先登录');
    }

    const token = authorization.slice('Bearer '.length).trim();

    if (!token) {
      throw new UnauthorizedException('请先登录');
    }
    return true;
  }
}
