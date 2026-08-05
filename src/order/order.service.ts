import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import {
  ORDER_STATUS_LABELS,
  OrderStatus,
} from '../common/constants/order-status';
import { PageType } from '../common/constants/page-type';
import {
  Order,
  OrderItem,
  PageEntryCode,
  Product,
  ProductSpec,
} from '../entities';
import {
  CreateOrderDto,
  UpdateOrderShippingDto,
  UpdateOrderStatusDto,
  UpdateOrderTrackingDto,
} from './dto/order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(PageEntryCode)
    private readonly pageEntryCodeRepository: Repository<PageEntryCode>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductSpec)
    private readonly productSpecRepository: Repository<ProductSpec>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll() {
    const orders = await this.orderRepository.find({
      order: { id: 'DESC' },
    });

    return orders.map((order) => this.toResponse(order));
  }

  async findByPageCode(pageCode: string) {
    const orders = await this.orderRepository.find({
      where: { pageCode: pageCode.trim() },
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

  async create(dto: CreateOrderDto) {
    const pageCode = dto.pageCode.trim();
    await this.assertCustomPageCode(pageCode);

    const resolvedItems: Array<{
      productId: string;
      productName: string;
      specName: string;
      image: string;
      price: string;
      quantity: number;
    }> = [];

    for (const item of dto.items) {
      const product = await this.productRepository.findOne({
        where: { id: item.productId, isValid: true },
      });
      if (!product) {
        throw new BadRequestException(`商品不存在或已失效: ${item.productId}`);
      }

      const spec = await this.productSpecRepository.findOne({
        where: { id: item.specId, productId: product.id },
      });
      if (!spec) {
        throw new BadRequestException(`规格不存在: ${item.specId}`);
      }

      resolvedItems.push({
        productId: product.id,
        productName: product.name,
        specName: spec.name,
        image: spec.image || product.coverImage,
        price: Number(spec.price).toFixed(2),
        quantity: item.quantity,
      });
    }

    const order = await this.dataSource.transaction(async (manager) => {
      const created = manager.create(Order, {
        orderNo: this.generateOrderNo(),
        pageCode,
        status: OrderStatus.Submitted,
        trackingNo: '',
        contactName: dto.contactName.trim(),
        contactPhone: dto.contactPhone.trim(),
        address: dto.address.trim(),
        remark: dto.remark?.trim() || '',
        items: resolvedItems.map((item) =>
          manager.create(OrderItem, {
            productId: item.productId,
            productName: item.productName,
            specName: item.specName,
            image: item.image,
            price: item.price,
            quantity: item.quantity,
          }),
        ),
      });

      return manager.save(created);
    });

    return this.findOne(order.id);
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

  async updateShipping(id: string, dto: UpdateOrderShippingDto) {
    const order = await this.getOrderOrFail(id);

    if (order.pageCode !== dto.pageCode.trim()) {
      throw new BadRequestException('页面码与订单不匹配');
    }

    if (
      order.status === OrderStatus.Shipped ||
      order.status === OrderStatus.Cancelled
    ) {
      throw new BadRequestException('当前订单状态不可修改收货信息');
    }

    order.contactName = dto.contactName.trim();
    order.contactPhone = dto.contactPhone.trim();
    order.address = dto.address.trim();
    return this.toResponse(await this.orderRepository.save(order));
  }

  private async assertCustomPageCode(pageCode: string) {
    const entry = await this.pageEntryCodeRepository.findOne({
      where: { code: pageCode, isValid: true },
    });

    if (!entry) {
      throw new BadRequestException('页面码无效或不存在');
    }

    if (entry.pageType !== PageType.Custom) {
      throw new BadRequestException('该页面码不是物料定制类型');
    }
  }

  private generateOrderNo(): string {
    const stamp = new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, '')
      .slice(0, 14);
    const suffix = randomBytes(3).toString('hex').toUpperCase();
    return `ORD${stamp}${suffix}`;
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
