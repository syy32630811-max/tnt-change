import './polyfill-crypto';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { createDataSource, getDatabaseConfig } from './database/data-source';
import { ensureDatabaseExists } from './database/ensure-database';

async function bootstrap() {
  const databaseConfig = getDatabaseConfig();
  await ensureDatabaseExists(databaseConfig);

  const dataSource = createDataSource(databaseConfig);
  await dataSource.initialize();
  await dataSource.runMigrations();
  await dataSource.destroy();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useBodyParser('json', { limit: '30mb' });
  app.useBodyParser('urlencoded', { limit: '30mb', extended: true });
  app.useStaticAssets(join(process.cwd(), 'page'), { prefix: '/page' });
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });
  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Server running at http://localhost:${port}/api`);
  console.log(`Admin pages at http://localhost:${port}/page/`);
}
void bootstrap();
