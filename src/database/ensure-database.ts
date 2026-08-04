import { createConnection } from 'mysql2/promise';

export interface DatabaseConnectionConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export async function ensureDatabaseExists(
  config: DatabaseConnectionConfig,
): Promise<void> {
  const connection = await createConnection({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${config.database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );

  await connection.end();
}
