/*
 * @Author: aliyun9402055519
 * @Date: 2026-08-04 18:35:46
 * @LastEditors: aliyun9402055519
 * @LastEditTime: 2026-08-05 10:19:18
 * @FilePath: /change/src/material-exchange/qr-code.service.ts
 * @Description: 默认
 */
import { randomInt } from 'crypto';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface QrPayloadParts {
  materialName: string;
  platform: string;
  platformUserId: string;
  redeemCode: string;
}

@Injectable()
export class QrCodeService {
  private readonly logger = new Logger(QrCodeService.name);

  constructor(private readonly configService: ConfigService) {}

  generateRedeemCode(): string {
    return String(randomInt(0, 10000)).padStart(4, '0');
  }

  /** 二维码内容：物料名 + 领取信息 + 4 位随机数 */
  buildQrPayload(parts: QrPayloadParts): string {
    return [
      parts.materialName.trim(),
      parts.platform.trim(),
      parts.platformUserId.trim(),
      parts.redeemCode,
    ].join(' | ');
  }

  /**
   * 调用第三方接口生成二维码并保存到本地 uploads
   */
  async createQrCodeImage(payload: string, redeemCode: string): Promise<string> {
    const template =
      this.configService.get<string>('QR_CODE_API') ??
      'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data={code}';

    const apiUrl = template.replaceAll('{code}', encodeURIComponent(payload));

    let response: Response;
    try {
      response = await fetch(apiUrl);
    } catch (error) {
      this.logger.error('调用二维码第三方接口失败', error);
      throw new InternalServerErrorException('生成二维码失败，请稍后重试');
    }

    if (!response.ok) {
      throw new InternalServerErrorException('生成二维码失败，请稍后重试');
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const uploadDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `qr-${redeemCode}-${Date.now()}.png`;
    writeFileSync(join(uploadDir, filename), buffer);

    return `/uploads/${filename}`;
  }
}
