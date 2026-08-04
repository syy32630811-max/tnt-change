import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { PageType } from '../../common/constants/page-type';

export class CreatePageEntryCodeDto {
  @IsEnum(PageType, { message: '页面类型不合法' })
  pageType: PageType;
}

export class UpdatePageEntryCodeDto {
  @IsOptional()
  @IsEnum(PageType, { message: '页面类型不合法' })
  pageType?: PageType;

  @IsOptional()
  @IsBoolean()
  isValid?: boolean;
}
