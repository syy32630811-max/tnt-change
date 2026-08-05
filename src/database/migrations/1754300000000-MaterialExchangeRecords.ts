/*
 * @Description: 物料互换记录表
 */
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class MaterialExchangeRecords1754300000000 implements MigrationInterface {
  name = 'MaterialExchangeRecords1754300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`material_exchange_records\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`material_id\` bigint unsigned NOT NULL COMMENT '物料ID',
        \`material_name\` varchar(128) NOT NULL COMMENT '物料名称',
        \`platform\` varchar(16) NOT NULL COMMENT '平台',
        \`platform_user_id\` varchar(128) NOT NULL COMMENT '平台用户ID',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`IDX_material_exchange_records_material_id\` (\`material_id\`),
        CONSTRAINT \`FK_material_exchange_records_material\`
          FOREIGN KEY (\`material_id\`) REFERENCES \`exchange_materials\` (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='物料互换记录'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`material_exchange_records\``);
  }
}
