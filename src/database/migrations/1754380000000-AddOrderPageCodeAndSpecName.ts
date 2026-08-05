/*
 * @Description: 订单绑定页面码，明细增加规格名称
 */
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderPageCodeAndSpecName1754380000000
  implements MigrationInterface
{
  name = 'AddOrderPageCodeAndSpecName1754380000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`orders\`
      ADD COLUMN \`page_code\` varchar(128) NOT NULL DEFAULT '' COMMENT '页面码' AFTER \`order_no\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`orders\`
      ADD KEY \`IDX_orders_page_code\` (\`page_code\`)
    `);

    await queryRunner.query(`
      ALTER TABLE \`order_items\`
      ADD COLUMN \`spec_name\` varchar(128) NOT NULL DEFAULT '' COMMENT '规格名称' AFTER \`product_name\`
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`order_items\` DROP COLUMN \`spec_name\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`orders\` DROP INDEX \`IDX_orders_page_code\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`orders\` DROP COLUMN \`page_code\`
    `);
  }
}
