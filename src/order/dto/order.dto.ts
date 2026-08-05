import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { OrderStatus } from '../../common/constants/order-status';

export class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsNotEmpty()
  specId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty({ message: '页面码不能为空' })
  pageCode: string;

  @IsString()
  @IsNotEmpty({ message: '联系人不能为空' })
  contactName: string;

  @IsString()
  @IsNotEmpty({ message: '联系电话不能为空' })
  contactPhone: string;

  @IsString()
  @IsNotEmpty({ message: '地址不能为空' })
  address: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus, { message: '订单状态不合法' })
  status: OrderStatus;
}

export class UpdateOrderTrackingDto {
  @IsString()
  @IsNotEmpty({ message: '快递单号不能为空' })
  trackingNo: string;
}

export class UpdateOrderShippingDto {
  @IsString()
  @IsNotEmpty({ message: '页面码不能为空' })
  pageCode: string;

  @IsString()
  @IsNotEmpty({ message: '联系人不能为空' })
  contactName: string;

  @IsString()
  @IsNotEmpty({ message: '联系电话不能为空' })
  contactPhone: string;

  @IsString()
  @IsNotEmpty({ message: '地址不能为空' })
  address: string;
}
