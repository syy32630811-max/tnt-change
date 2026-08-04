/*
 * @Description: 商品规格
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
import { Product } from './product.entity';

@Entity('product_specs')
export class ProductSpec {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'product_id', type: 'bigint', unsigned: true })
  productId: string;

  /** 规格名称 */
  @Column({ type: 'varchar', length: 128, default: '' })
  name: string;

  /** 规格图片 */
  @Column({ type: 'varchar', length: 512, default: '' })
  image: string;

  /** 价格 */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: string;

  /** 排序 */
  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => Product, (product) => product.specs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
