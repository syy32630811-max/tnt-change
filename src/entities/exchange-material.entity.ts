/*
 * @Description: 互换物料
 */
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('exchange_materials')
export class ExchangeMaterial {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  /** 名称 */
  @Column({ type: 'varchar', length: 128 })
  name: string;

  /** 数量 */
  @Column({ type: 'int', unsigned: true, default: 0 })
  quantity: number;

  /** 图片 */
  @Column({ type: 'varchar', length: 512, default: '' })
  image: string;

  /** 是否有效 */
  @Column({ name: 'is_valid', type: 'boolean', default: true })
  isValid: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
