/*
 * @Description: 初始化网页进入码、互换物料表
 */
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitTables1754290800000 implements MigrationInterface {
  name = 'InitTables1754290800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`page_entry_codes\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`page_type\` varchar(64) NOT NULL COMMENT '网页类型',
        \`code\` varchar(128) NOT NULL COMMENT '唯一标识码',
        \`is_valid\` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否有效',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_page_entry_codes_code\` (\`code\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='网页进入码'
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`exchange_materials\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`name\` varchar(128) NOT NULL COMMENT '名称',
        \`quantity\` int unsigned NOT NULL DEFAULT 0 COMMENT '数量',
        \`image\` varchar(512) NOT NULL DEFAULT '' COMMENT '图片',
        \`is_valid\` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否有效',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='互换物料'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`exchange_materials\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`page_entry_codes\``);
  }
}
