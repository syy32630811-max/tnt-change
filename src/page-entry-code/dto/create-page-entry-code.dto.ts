import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PageType } from '../../common/constants/page-type';

export class CreatePageEntryCodeDto {
  @IsEnum(PageType, { message: '页面类型不合法' })
  pageType: PageType;

  /** 自定义标识码；不传则随机生成 */
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: '标识码不能为空' })
  @MaxLength(128)
  code?: string;

  /** 互换：个人中心 ID 截图地址 */
  @IsOptional()
  @IsString()
  @MaxLength(512)
  screenshotUrl?: string;
}

export class UpdatePageEntryCodeDto {
  @IsOptional()
  @IsEnum(PageType, { message: '页面类型不合法' })
  pageType?: PageType;

  @IsOptional()
  @IsBoolean()
  isValid?: boolean;
}
