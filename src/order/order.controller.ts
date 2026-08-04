import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import {
  UpdateOrderStatusDto,
  UpdateOrderTrackingDto,
} from './dto/order.dto';
import { OrderService } from './order.service';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  findAll() {
    return this.orderService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orderService.updateStatus(id, dto);
  }

  @Patch(':id/tracking')
  updateTracking(
    @Param('id') id: string,
    @Body() dto: UpdateOrderTrackingDto,
  ) {
    return this.orderService.updateTracking(id, dto);
  }
}
