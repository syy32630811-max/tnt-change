/*
 * @Description: 订单
 */
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  /** 订单号 */
  @Column({ name: 'order_no', type: 'varchar', length: 64, unique: true })
  orderNo: string;

  /** 页面码 */
  @Column({ name: 'page_code', type: 'varchar', length: 128, default: '' })
  pageCode: string;

  /** 订单状态 */
  @Column({ type: 'varchar', length: 32, default: 'submitted' })
  status: string;

  /** 快递单号 */
  @Column({ name: 'tracking_no', type: 'varchar', length: 128, default: '' })
  trackingNo: string;

  /** 联系人 */
  @Column({ name: 'contact_name', type: 'varchar', length: 64, default: '' })
  contactName: string;

  /** 联系电话 */
  @Column({ name: 'contact_phone', type: 'varchar', length: 32, default: '' })
  contactPhone: string;

  /** 地址 */
  @Column({ type: 'varchar', length: 255, default: '' })
  address: string;

  /** 备注 */
  @Column({ type: 'varchar', length: 512, default: '' })
  remark: string;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items: OrderItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
