/*
 * @Description: 页面码增加个人中心截图字段
 */
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPageEntryCodeScreenshot1754400000000
  implements MigrationInterface
{
  name = 'AddPageEntryCodeScreenshot1754400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`page_entry_codes\`
      ADD COLUMN \`screenshot_url\` varchar(512) NOT NULL DEFAULT '' COMMENT '个人中心ID截图' AFTER \`code\`
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`page_entry_codes\`
      DROP COLUMN \`screenshot_url\`
    `);
  }
}
