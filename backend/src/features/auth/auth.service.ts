import bcrypt from 'bcryptjs';
import createHttpError from 'http-errors';
import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';

import prisma from '../../libs/prisma';
import env from '../../env';
import {
  DEFAULT_CATEGORIES_TREE,
  DEFAULT_ONBOARDING_ACCOUNTS,
} from '../workspace/default-workspace';
import type { LoginBody, RegisterBody } from './auth.schema';

class AuthService {
  register = async (data: RegisterBody) => {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      select: { id: true },
    });

    if (existingUser) {
      throw createHttpError(409, 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          passwordHash,
          name: data.name,
          currency: data.currency ?? 'GHS',
        },
      });

      await tx.category.createMany({
        data: DEFAULT_CATEGORIES_TREE.map((category) => ({
          userId: createdUser.id,
          name: category.name,
          type: category.type,
          color: category.color,
          isSystem: true,
          isArchived: false,
          parentId: null,
        })),
        skipDuplicates: true,
      });

      await tx.account.createMany({
        data: DEFAULT_ONBOARDING_ACCOUNTS.map((account) => ({
          userId: createdUser.id,
          name: account.name,
          type: account.type,
          currency: createdUser.currency,
          color: account.color,
          icon: account.icon,
          openingBalance: account.openingBalance,
          currentBalance: account.openingBalance,
          isArchived: false,
        })),
      });

      return createdUser;
    });

    return this.buildAuthResponse(user);
  };

  login = async (data: LoginBody) => {
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!user) {
      throw createHttpError(401, 'Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(
      data.password,
      user.passwordHash
    );

    if (!passwordMatches) {
      throw createHttpError(401, 'Invalid email or password');
    }

    return this.buildAuthResponse(user);
  };

  private buildAuthResponse = (user: {
    id: string;
    email: string;
    name: string;
    currency: string;
  }) => {
    const jwtSecret: Secret = env.JWT_SECRET;
    const signOptions: SignOptions = {
      expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    };

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
      },
      jwtSecret,
      signOptions
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        currency: user.currency,
      },
    };
  };
}

const authService = new AuthService();

export default authService;
