import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  CreateOrderDto,
  UpdateOrderShippingDto,
  UpdateOrderStatusDto,
  UpdateOrderTrackingDto,
} from './dto/order.dto';
import { OrderService } from './order.service';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  findAll(@Query('pageCode') pageCode?: string) {
    if (pageCode?.trim()) {
      return this.orderService.findByPageCode(pageCode.trim());
    }
    return this.orderService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.orderService.create(dto);
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

  @Patch(':id/shipping')
  updateShipping(
    @Param('id') id: string,
    @Body() dto: UpdateOrderShippingDto,
  ) {
    return this.orderService.updateShipping(id, dto);
  }
}
