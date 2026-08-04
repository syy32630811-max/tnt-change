import { config } from 'dotenv';
import { ensureDatabaseExists } from './ensure-database';
import { createDataSource, getDatabaseConfig } from './data-source';

config();

async function runMigrations(): Promise<void> {
  const databaseConfig = getDatabaseConfig();

  await ensureDatabaseExists(databaseConfig);

  const dataSource = createDataSource(databaseConfig);
  await dataSource.initialize();
  await dataSource.runMigrations();
  await dataSource.destroy();

  console.log('Database migrations completed');
}

void runMigrations().catch((error: unknown) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
