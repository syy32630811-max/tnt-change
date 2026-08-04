/*
 * @Description: 商品规格增加名称字段
 */
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductSpecName1754295000000 implements MigrationInterface {
  name = 'AddProductSpecName1754295000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`product_specs\`
      ADD COLUMN \`name\` varchar(128) NOT NULL DEFAULT '' COMMENT '规格名称' AFTER \`product_id\`
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`product_specs\` DROP COLUMN \`name\`
    `);
  }
}
