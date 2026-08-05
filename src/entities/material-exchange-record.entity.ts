/*
 * @Description: 物料互换记录
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
import { ExchangeMaterial } from './exchange-material.entity';

@Entity('material_exchange_records')
export class MaterialExchangeRecord {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  /** 页面码（一码仅可领取一个物料） */
  @Column({ name: 'page_code', type: 'varchar', length: 128, unique: true })
  pageCode: string;

  @Column({ name: 'material_id', type: 'bigint', unsigned: true })
  materialId: string;

  /** 物料名称快照 */
  @Column({ name: 'material_name', type: 'varchar', length: 128 })
  materialName: string;

  /** 平台 */
  @Column({ type: 'varchar', length: 16 })
  platform: string;

  /** 平台用户 ID */
  @Column({ name: 'platform_user_id', type: 'varchar', length: 128 })
  platformUserId: string;

  /** 是否有效 */
  @Column({ name: 'is_valid', type: 'boolean', default: true })
  isValid: boolean;

  /** 4 位随机兑换码 */
  @Column({ name: 'redeem_code', type: 'varchar', length: 4, default: '' })
  redeemCode: string;

  /** 二维码地址 */
  @Column({ name: 'qr_code_url', type: 'varchar', length: 512, default: '' })
  qrCodeUrl: string;

  @ManyToOne(() => ExchangeMaterial, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'material_id' })
  material: ExchangeMaterial;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
