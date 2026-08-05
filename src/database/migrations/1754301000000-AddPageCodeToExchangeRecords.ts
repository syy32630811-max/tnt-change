/*
 * @Description: 互换记录绑定页面码（一码一物料）
 */
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPageCodeToExchangeRecords1754301000000
  implements MigrationInterface
{
  name = 'AddPageCodeToExchangeRecords1754301000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`material_exchange_records\`
      ADD COLUMN \`page_code\` varchar(128) NULL COMMENT '页面码' AFTER \`id\`
    `);

    await queryRunner.query(`
      UPDATE \`material_exchange_records\`
      SET \`page_code\` = CONCAT('LEGACY_', \`id\`)
      WHERE \`page_code\` IS NULL OR \`page_code\` = ''
    `);

    await queryRunner.query(`
      ALTER TABLE \`material_exchange_records\`
      MODIFY COLUMN \`page_code\` varchar(128) NOT NULL COMMENT '页面码'
    `);

    await queryRunner.query(`
      ALTER TABLE \`material_exchange_records\`
      ADD UNIQUE KEY \`UQ_material_exchange_records_page_code\` (\`page_code\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`material_exchange_records\`
      DROP INDEX \`UQ_material_exchange_records_page_code\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`material_exchange_records\`
      DROP COLUMN \`page_code\`
    `);
  }
}
