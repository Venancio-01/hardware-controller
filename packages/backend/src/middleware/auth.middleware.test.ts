import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from './auth.middleware.js';
import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth.config.js';

describe('Auth Middleware', () => {
  it('should return 401 if no authorization header is present', () => {
    const req = {
      headers: {},
      path: '/api/config'
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;

    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: '未授权访问'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next if valid credentials are provided', () => {
    // Mock valid credentials (assuming we implement logic later)
    // For now this test will likely fail because our middleware calls next() unconditionally
    // BUT we want to test "Red" state first where it FAILS to reject invalid requests.
    // Actually, existing implementation calls next().
    // So "return 401" test above SHOULD FAIL.

    const req = {
      headers: { authorization: 'Basic YWRtaW46YWRtaW4xMjM=' }, // admin:admin123
      path: '/api/config'
    } as unknown as Request;
    const res = {} as unknown as Response;
    const next = vi.fn();

    authMiddleware(req, res, next);

    // This expects success, but since our stub calls next(), this passes.
    // The previous test (no header) should fail (it calls next, but we expect 401).
    expect(next).toHaveBeenCalled();
  });

  it('should call next if valid Bearer token is provided', () => {
    const token = jwt.sign({ username: 'admin' }, authConfig.jwtSecret);
    const req = {
      headers: { authorization: `Bearer ${token}` },
      path: '/api/config'
    } as unknown as Request;
    const res = {} as unknown as Response;
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should return 401 if invalid Bearer token is provided', () => {
    const req = {
      headers: { authorization: 'Bearer invalid-token' },
      path: '/api/config'
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;

    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
