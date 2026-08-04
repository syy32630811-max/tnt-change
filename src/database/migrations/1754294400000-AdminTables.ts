/*
 * @Description: 管理后台：物料到期时间、商品、订单表
 */
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AdminTables1754294400000 implements MigrationInterface {
  name = 'AdminTables1754294400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`exchange_materials\`
      ADD COLUMN \`expire_at\` datetime(6) NULL COMMENT '到期时间' AFTER \`is_valid\`
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`products\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`name\` varchar(128) NOT NULL COMMENT '名称',
        \`cover_image\` varchar(512) NOT NULL DEFAULT '' COMMENT '封面图片',
        \`is_valid\` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否有效',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品'
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`product_specs\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`product_id\` bigint unsigned NOT NULL COMMENT '商品ID',
        \`image\` varchar(512) NOT NULL DEFAULT '' COMMENT '规格图片',
        \`price\` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT '价格',
        \`sort_order\` int NOT NULL DEFAULT 0 COMMENT '排序',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`IDX_product_specs_product_id\` (\`product_id\`),
        CONSTRAINT \`FK_product_specs_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品规格'
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`orders\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`order_no\` varchar(64) NOT NULL COMMENT '订单号',
        \`status\` varchar(32) NOT NULL DEFAULT 'submitted' COMMENT '订单状态',
        \`tracking_no\` varchar(128) NOT NULL DEFAULT '' COMMENT '快递单号',
        \`contact_name\` varchar(64) NOT NULL DEFAULT '' COMMENT '联系人',
        \`contact_phone\` varchar(32) NOT NULL DEFAULT '' COMMENT '联系电话',
        \`address\` varchar(255) NOT NULL DEFAULT '' COMMENT '地址',
        \`remark\` varchar(512) NOT NULL DEFAULT '' COMMENT '备注',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_orders_order_no\` (\`order_no\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单'
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`order_items\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`order_id\` bigint unsigned NOT NULL COMMENT '订单ID',
        \`product_id\` bigint unsigned NULL COMMENT '商品ID',
        \`product_name\` varchar(128) NOT NULL COMMENT '商品名称',
        \`image\` varchar(512) NOT NULL DEFAULT '' COMMENT '规格图片',
        \`price\` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT '价格',
        \`quantity\` int unsigned NOT NULL DEFAULT 1 COMMENT '数量',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`IDX_order_items_order_id\` (\`order_id\`),
        CONSTRAINT \`FK_order_items_order\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单明细'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`order_items\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`orders\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`product_specs\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`products\``);
    await queryRunner.query(`
      ALTER TABLE \`exchange_materials\` DROP COLUMN \`expire_at\`
    `);
  }
}
