import '../src/polyfill-crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api/products (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/products')
      .expect(200)
      .expect((response) => {
        const body = response.body as unknown[];
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeGreaterThan(0);
      });
  });

  it('/api/auth/wechat/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/auth/wechat/login')
      .send({ code: 'test_code' })
      .expect(201)
      .expect((response) => {
        const body = response.body as {
          token: string;
          user: { openid: string };
        };
        expect(body.token).toBeDefined();
        expect(body.user.openid).toBe('dev_test_code');
      });
  });
});
