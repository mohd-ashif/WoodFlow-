import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/auth.js';
import { prisma } from '../config/prisma.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { SystemRole, UserStatus } from '@prisma/client';

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    // 1. Check Authorization Bearer header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Fallback to cookie
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new UnauthorizedError('Authentication token missing', 'TOKEN_MISSING');
    }

    const payload = verifyAccessToken(token);

    // Fetch user with active memberships
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        memberships: {
          include: {
            company: {
              select: { id: true, name: true, slug: true, status: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('User account not found', 'USER_NOT_FOUND');
    }

    // Account status check (Section 16 requirement)
    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenError(
        'Your account has been suspended. Please contact administrator.',
        'ACCOUNT_SUSPENDED'
      );
    }

    const isPlatformAdmin = user.systemRole === SystemRole.PLATFORM_ADMIN;

    req.user = {
      ...user,
      isPlatformAdmin,
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      return next(error);
    }
    return next(new UnauthorizedError('Invalid or expired token', 'INVALID_TOKEN'));
  }
}
