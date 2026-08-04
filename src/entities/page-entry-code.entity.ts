/*
 * @Description: 网页进入码
 */
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('page_entry_codes')
export class PageEntryCode {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  /** 网页类型 */
  @Column({ name: 'page_type', type: 'varchar', length: 64 })
  pageType: string;

  /** 唯一标识码 */
  @Column({ type: 'varchar', length: 128, unique: true })
  code: string;

  /** 是否有效 */
  @Column({ name: 'is_valid', type: 'boolean', default: true })
  isValid: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
