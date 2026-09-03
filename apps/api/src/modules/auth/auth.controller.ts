import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema } from '@furniture-os/shared';
import * as authService from './auth.service.js';

const isProd = process.env.NODE_ENV === 'production';

const getCookieOptions = (maxAgeMs: number) => ({
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? ('none' as const) : ('lax' as const),
  maxAge: maxAgeMs,
});

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const input = registerSchema.parse(req.body);
    const result = await authService.registerUser(input, req.ip, req.get('user-agent'));

    // Set HTTP-Only cookies (SameSite=None required for cross-domain Vercel <-> Render)
    res.cookie('accessToken', result.tokens.accessToken, getCookieOptions(24 * 60 * 60 * 1000));
    res.cookie('refreshToken', result.tokens.refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: result.user,
        tokens: result.tokens,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const input = loginSchema.parse(req.body);
    const result = await authService.loginUser(input, req.ip, req.get('user-agent'));

    res.cookie('accessToken', result.tokens.accessToken, getCookieOptions(24 * 60 * 60 * 1000));
    res.cookie('refreshToken', result.tokens.refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        tokens: result.tokens,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function logout(req: Request, res: Response) {
  const options = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? ('none' as const) : ('lax' as const),
  };
  res.clearCookie('accessToken', options);
  res.clearCookie('refreshToken', options);
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
}

export async function me(req: Request, res: Response) {
  const user = req.user!;
  const activeMembership = user.memberships[0] || null;

  return res.status(200).json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        isPlatformAdmin: user.isPlatformAdmin,
        activeMembership: activeMembership
          ? {
              id: activeMembership.id,
              userId: activeMembership.userId,
              companyId: activeMembership.companyId,
              role: activeMembership.role,
              status: activeMembership.status,
              company: activeMembership.company,
            }
          : null,
        memberships: user.memberships.map((m) => ({
          id: m.id,
          userId: m.userId,
          companyId: m.companyId,
          role: m.role,
          status: m.status,
          company: m.company,
        })),
      },
    },
  });
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
        code: 'MISSING_REFRESH_TOKEN',
      });
    }

    const tokens = await authService.refreshAccessToken(refreshToken);

    res.cookie('accessToken', tokens.accessToken, getCookieOptions(24 * 60 * 60 * 1000));
    res.cookie('refreshToken', tokens.refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    return res.status(200).json({
      success: true,
      message: 'Tokens refreshed',
      data: { tokens },
    });
  } catch (error) {
    return next(error);
  }
}
