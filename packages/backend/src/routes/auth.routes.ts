import { Router } from 'express';
import { createSimpleLogger } from 'shared';

const logger = createSimpleLogger();
import { loginRequestSchema } from 'shared';
import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth.config.js';

const router: Router = Router();

/**
 * POST /api/auth/login
 * 用户登录接口
 */
router.post('/login', (req, res) => {
  try {
    const parseResult = loginRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
      });
      return;
    }

    const { username, password } = parseResult.data;

    // Log for debugging (remove in production or use debug level)
    logger.debug(`Login attempt for user: ${username}`);

    if (username === authConfig.username && password === authConfig.password) {
      const token = jwt.sign(
        { username, role: 'admin' },
        authConfig.jwtSecret,
        { expiresIn: authConfig.tokenExpiry } as jwt.SignOptions
      );

      res.json({
        success: true,
        token,
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: 'Invalid credentials',
    });
  } catch (error) {
    logger.error(error, 'Login error');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
    });
  }
});

export default router;
