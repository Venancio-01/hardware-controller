import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from './auth.middleware.js';
import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth.config.js';

describe('Auth Middleware', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset auth config before each test
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

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

  it('should allow access to public routes without authorization', () => {
    const publicPaths = ['/api/auth/login', '/api/status', '/health'];

    publicPaths.forEach(path => {
      const req = {
        headers: {},
        path
      } as unknown as Request;

      const res = {} as unknown as Response;
      const next = vi.fn();

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  it('should call next if authentication is disabled', () => {
    // Temporarily set enabled to false
    const originalEnabled = authConfig.enabled;
    (authConfig as any).enabled = false;

    const req = {
      headers: {},
      path: '/api/config'
    } as unknown as Request;

    const res = {} as unknown as Response;
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();

    // Restore original value
    (authConfig as any).enabled = originalEnabled;
  });

  it('should call next if valid Basic Auth credentials are provided', () => {
    const req = {
      headers: { authorization: 'Basic YWRtaW46YWRtaW4xMjM=' }, // admin:admin123
      path: '/api/config'
    } as unknown as Request;
    const res = {} as unknown as Response;
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 401 if invalid Basic Auth credentials are provided', () => {
    const req = {
      headers: { authorization: 'Basic d3Jvbmc6d3Jvbmc=' }, // wrong:wrong
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
      error: '认证失败'
    });
    expect(next).not.toHaveBeenCalled();
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
    expect(res.status).not.toHaveBeenCalled();
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
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: '无效的Token'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 for malformed authorization header', () => {
    const req = {
      headers: { authorization: 'InvalidFormat token' },
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
