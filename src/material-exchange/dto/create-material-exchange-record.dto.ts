import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ExchangePlatform } from '../../common/constants/exchange-platform';

export class CreateMaterialExchangeRecordDto {
  @IsString()
  @IsNotEmpty({ message: '页面码不能为空' })
  pageCode: string;

  @IsString()
  @IsNotEmpty()
  materialId: string;

  @IsEnum(ExchangePlatform, { message: '平台不合法' })
  platform: ExchangePlatform;

  @IsString()
  @IsNotEmpty({ message: 'ID不能为空' })
  platformUserId: string;
}

export class UpdateMaterialExchangeRecordDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  materialId?: string;

  @IsOptional()
  @IsEnum(ExchangePlatform, { message: '平台不合法' })
  platform?: ExchangePlatform;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'ID不能为空' })
  platformUserId?: string;
}
