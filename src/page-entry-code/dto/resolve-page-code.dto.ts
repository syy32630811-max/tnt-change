import { IsNotEmpty, IsString } from 'class-validator';

export class ResolvePageCodeDto {
  @IsString()
  @IsNotEmpty({ message: '页面码不能为空' })
  code: string;
}
