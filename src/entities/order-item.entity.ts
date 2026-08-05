/*
 * @Description: 订单明细
 */
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'order_id', type: 'bigint', unsigned: true })
  orderId: string;

  @Column({ name: 'product_id', type: 'bigint', unsigned: true, nullable: true })
  productId: string | null;

  /** 商品名称 */
  @Column({ name: 'product_name', type: 'varchar', length: 128 })
  productName: string;

  /** 规格名称 */
  @Column({ name: 'spec_name', type: 'varchar', length: 128, default: '' })
  specName: string;

  /** 规格图片 */
  @Column({ type: 'varchar', length: 512, default: '' })
  image: string;

  /** 价格 */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: string;

  /** 数量 */
  @Column({ type: 'int', unsigned: true, default: 1 })
  quantity: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
