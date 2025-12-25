import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRoutes from './auth.routes.js';
import { authConfig } from '../config/auth.config.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  it('POST /login should return 200 and token with valid credentials', async () => {
    // Valid credentials from config
    const credentials = {
      username: authConfig.username,
      password: authConfig.password
    };

    const response = await request(app)
      .post('/api/auth/login')
      .send(credentials);

    // This should fail as implementation returns 501
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
  });

  it('POST /login should return 401 with invalid credentials', async () => {
    const credentials = {
      username: 'wrong',
      password: 'wrong'
    };

    const response = await request(app)
      .post('/api/auth/login')
      .send(credentials);

    // This should fail as implementation returns 501
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
