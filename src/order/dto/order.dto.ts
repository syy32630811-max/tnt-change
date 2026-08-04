import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { OrderStatus } from '../../common/constants/order-status';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus, { message: '订单状态不合法' })
  status: OrderStatus;
}

export class UpdateOrderTrackingDto {
  @IsString()
  @IsNotEmpty({ message: '快递单号不能为空' })
  trackingNo: string;
}
