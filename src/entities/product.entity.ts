/*
 * @Description: 商品
 */
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductSpec } from './product-spec.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  /** 名称 */
  @Column({ type: 'varchar', length: 128 })
  name: string;

  /** 封面图片 */
  @Column({ name: 'cover_image', type: 'varchar', length: 512, default: '' })
  coverImage: string;

  /** 是否有效 */
  @Column({ name: 'is_valid', type: 'boolean', default: true })
  isValid: boolean;

  @OneToMany(() => ProductSpec, (spec) => spec.product, {
    cascade: true,
    eager: true,
  })
  specs: ProductSpec[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
