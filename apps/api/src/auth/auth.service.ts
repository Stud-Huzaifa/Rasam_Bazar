import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../prisma.service';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { RegisterVendorDto } from './dto/register-vendor.dto';
import { LoginDto } from './dto/login.dto';

const REFRESH_TOKEN_DAYS = Number(process.env.JWT_REFRESH_DAYS || 7);

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async registerCustomer(
    dto: RegisterCustomerDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new UnauthorizedException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
        city: dto.city,
      },
    });

    await this.assignRoles(user.id, ['CUSTOMER', 'WEDDING_OWNER']);
    await this.audit(
      user.id,
      'REGISTRATION',
      'User',
      user.id,
      ipAddress,
      userAgent,
    );
    const verificationToken = await this.createEmailVerificationToken(user.id);

    return {
      ...(await this.signInPayload(user)),
      devEmailVerificationToken: verificationToken,
    };
  }

  async registerVendor(
    dto: RegisterVendorDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new UnauthorizedException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.ownerName,
        phone: dto.phone,
        city: dto.city,
      },
    });

    await this.assignRoles(user.id, ['VENDOR_OWNER']);

    await this.prisma.vendor.create({
      data: {
        userId: user.id,
        businessName: dto.businessName,
        ownerName: dto.ownerName,
        email: dto.email,
        phone: dto.phone,
        city: dto.city,
        serviceAreas: dto.mainServiceCategory ? [dto.mainServiceCategory] : [],
      },
    });

    await this.audit(
      user.id,
      'REGISTRATION',
      'Vendor',
      user.id,
      ipAddress,
      userAgent,
    );
    const verificationToken = await this.createEmailVerificationToken(user.id);

    return {
      ...(await this.signInPayload(user)),
      devEmailVerificationToken: verificationToken,
    };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.isActive || user.isSuspended || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.audit(user.id, 'LOGIN', 'User', user.id, ipAddress, userAgent);
    return this.signInPayload(user);
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { success: true };
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: stored.userId },
    });
    if (!user || !user.isActive || user.isSuspended || user.deletedAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const nextRefreshToken = this.makeOpaqueToken();
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: {
        revokedAt: new Date(),
        replacedBy: this.hashToken(nextRefreshToken),
      },
    });

    return this.signInPayload(user, nextRefreshToken);
  }

  async verifyEmail(token: string) {
    const tokenHash = this.hashToken(token);
    const stored = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });
    if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid verification token');
    }

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: stored.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: stored.userId },
        data: { isEmailVerified: true },
      }),
    ]);

    return { success: true };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { success: true };
    }

    const token = this.makeOpaqueToken();
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(token),
        expiresAt: this.daysFromNow(1),
      },
    });

    return { success: true, devPasswordResetToken: token };
  }

  async resetPassword(token: string, password: string) {
    const tokenHash = this.hashToken(token);
    const stored = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });
    if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid password reset token');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { id: stored.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: stored.userId },
        data: { passwordHash },
      }),
    ]);

    return { success: true };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });
    if (!user || !user.isActive || user.isSuspended || user.deletedAt) {
      return null;
    }

    return user;
  }

  private async signInPayload(
    user: {
      id: string;
      email: string;
      fullName: string | null;
      phone: string | null;
      city: string | null;
    },
    providedRefreshToken?: string,
  ) {
    const roles = await this.prisma.userRole.findMany({
      where: { userId: user.id },
      include: { role: true },
    });

    const payload = {
      sub: user.id,
      email: user.email,
      roles: roles.map((entry) => entry.role.name),
    };
    const refreshToken = providedRefreshToken || this.makeOpaqueToken();

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: this.hashToken(refreshToken),
        userId: user.id,
        expiresAt: this.daysFromNow(REFRESH_TOKEN_DAYS),
      },
    });

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        city: user.city,
        roles: roles.map((entry) => entry.role.name),
      },
    };
  }

  private async assignRoles(
    userId: string,
    roleNames: Array<'CUSTOMER' | 'WEDDING_OWNER' | 'VENDOR_OWNER'>,
  ) {
    for (const name of roleNames) {
      const role = await this.prisma.role.upsert({
        where: { name },
        create: {
          name,
          description: `${name.replaceAll('_', ' ').toLowerCase()} role`,
        },
        update: {},
      });

      await this.prisma.userRole.upsert({
        where: { userId_roleId: { userId, roleId: role.id } },
        create: { userId, roleId: role.id },
        update: {},
      });
    }
  }

  private async createEmailVerificationToken(userId: string) {
    const token = this.makeOpaqueToken();
    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(token),
        expiresAt: this.daysFromNow(1),
      },
    });

    return token;
  }

  private async audit(
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.prisma.auditLog.create({
      data: {
        actorId,
        action,
        entityType,
        entityId,
        ipAddress,
        userAgent,
      },
    });
  }

  private makeOpaqueToken() {
    return randomBytes(32).toString('hex');
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private daysFromNow(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
}
