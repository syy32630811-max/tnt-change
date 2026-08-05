/*
 * @Description: 互换记录增加有效标记、兑换码与二维码
 */
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExchangeRecordValidAndQr1754302000000
  implements MigrationInterface
{
  name = 'AddExchangeRecordValidAndQr1754302000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`material_exchange_records\`
      ADD COLUMN \`is_valid\` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否有效' AFTER \`platform_user_id\`,
      ADD COLUMN \`redeem_code\` varchar(4) NOT NULL DEFAULT '' COMMENT '4位随机兑换码' AFTER \`is_valid\`,
      ADD COLUMN \`qr_code_url\` varchar(512) NOT NULL DEFAULT '' COMMENT '二维码地址' AFTER \`redeem_code\`
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`material_exchange_records\`
      DROP COLUMN \`qr_code_url\`,
      DROP COLUMN \`redeem_code\`,
      DROP COLUMN \`is_valid\`
    `);
  }
}
