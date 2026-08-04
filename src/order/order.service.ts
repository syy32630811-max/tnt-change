import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ORDER_STATUS_LABELS,
  OrderStatus,
} from '../common/constants/order-status';
import { Order } from '../entities';
import {
  UpdateOrderStatusDto,
  UpdateOrderTrackingDto,
} from './dto/order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async findAll() {
    const orders = await this.orderRepository.find({
      order: { id: 'DESC' },
    });

    return orders.map((order) => this.toResponse(order));
  }

  async findOne(id: string) {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }
    return this.toResponse(order);
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.getOrderOrFail(id);
    order.status = dto.status;
    return this.toResponse(await this.orderRepository.save(order));
  }

  async updateTracking(id: string, dto: UpdateOrderTrackingDto) {
    const order = await this.getOrderOrFail(id);
    order.trackingNo = dto.trackingNo.trim();
    return this.toResponse(await this.orderRepository.save(order));
  }

  private async getOrderOrFail(id: string) {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }
    return order;
  }

  private toResponse(order: Order) {
    return {
      ...order,
      statusLabel:
        ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status,
    };
  }
}
