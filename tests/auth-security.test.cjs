require('ts-node/register/transpile-only');

const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const { createHash } = require('node:crypto');
const { NotFoundException } = require('@nestjs/common');
const { AuthService } = require('../apps/api/src/auth/auth.service');
const { RolesGuard } = require('../apps/api/src/common/guards/roles.guard');
const {
  WeddingsService,
} = require('../apps/api/src/weddings/weddings.service');
const { VendorsService } = require('../apps/api/src/vendors/vendors.service');

const hashToken = (token) => createHash('sha256').update(token).digest('hex');

class FakePrisma {
  constructor() {
    this.users = [];
    this.roles = [];
    this.userRoles = [];
    this.refreshTokens = [];
    this.emailVerificationTokens = [];
    this.passwordResetTokens = [];
    this.auditLogs = [];
    this.vendors = [];

    this.user = {
      findUnique: async ({ where }) =>
        where.email
          ? this.users.find((user) => user.email === where.email) || null
          : this.users.find((user) => user.id === where.id) || null,
      create: async ({ data }) => {
        const user = {
          id: `user-${this.users.length + 1}`,
          isActive: true,
          isSuspended: false,
          isEmailVerified: false,
          deletedAt: null,
          ...data,
        };
        this.users.push(user);
        return user;
      },
      update: async ({ where, data }) => {
        const user = this.users.find((entry) => entry.id === where.id);
        Object.assign(user, data);
        return user;
      },
    };

    this.role = {
      upsert: async ({ where, create }) => {
        let role = this.roles.find((entry) => entry.name === where.name);
        if (!role) {
          role = { id: `role-${this.roles.length + 1}`, ...create };
          this.roles.push(role);
        }
        return role;
      },
    };

    this.userRole = {
      upsert: async ({ where, create }) => {
        const existing = this.userRoles.find(
          (entry) =>
            entry.userId === where.userId_roleId.userId &&
            entry.roleId === where.userId_roleId.roleId,
        );
        if (existing) return existing;
        const userRole = {
          id: `user-role-${this.userRoles.length + 1}`,
          ...create,
        };
        this.userRoles.push(userRole);
        return userRole;
      },
      findMany: async ({ where }) =>
        this.userRoles
          .filter((entry) => entry.userId === where.userId)
          .map((entry) => ({
            ...entry,
            role: this.roles.find((role) => role.id === entry.roleId),
          })),
    };

    this.refreshToken = {
      create: async ({ data }) => {
        const token = {
          id: `refresh-${this.refreshTokens.length + 1}`,
          revokedAt: null,
          ...data,
        };
        this.refreshTokens.push(token);
        return token;
      },
      findUnique: async ({ where }) =>
        this.refreshTokens.find(
          (token) => token.tokenHash === where.tokenHash,
        ) || null,
      update: async ({ where, data }) => {
        const token = this.refreshTokens.find((entry) => entry.id === where.id);
        Object.assign(token, data);
        return token;
      },
      updateMany: async ({ where, data }) => {
        let count = 0;
        for (const token of this.refreshTokens) {
          const matchesHash =
            !where.tokenHash || token.tokenHash === where.tokenHash;
          const matchesUser = !where.userId || token.userId === where.userId;
          const matchesRevoked =
            where.revokedAt === undefined ||
            token.revokedAt === where.revokedAt;
          if (matchesHash && matchesUser && matchesRevoked) {
            Object.assign(token, data);
            count += 1;
          }
        }
        return { count };
      },
    };

    this.emailVerificationToken = {
      create: async ({ data }) => {
        const token = {
          id: `email-token-${this.emailVerificationTokens.length + 1}`,
          usedAt: null,
          ...data,
        };
        this.emailVerificationTokens.push(token);
        return token;
      },
      findUnique: async ({ where }) =>
        this.emailVerificationTokens.find(
          (token) => token.tokenHash === where.tokenHash,
        ) || null,
      update: async ({ where, data }) => {
        const token = this.emailVerificationTokens.find(
          (entry) => entry.id === where.id,
        );
        Object.assign(token, data);
        return token;
      },
    };

    this.passwordResetToken = {
      create: async ({ data }) => {
        const token = {
          id: `reset-token-${this.passwordResetTokens.length + 1}`,
          usedAt: null,
          ...data,
        };
        this.passwordResetTokens.push(token);
        return token;
      },
      findUnique: async ({ where }) =>
        this.passwordResetTokens.find(
          (token) => token.tokenHash === where.tokenHash,
        ) || null,
      update: async ({ where, data }) => {
        const token = this.passwordResetTokens.find(
          (entry) => entry.id === where.id,
        );
        Object.assign(token, data);
        return token;
      },
    };

    this.vendor = {
      create: async ({ data }) => {
        const vendor = { id: `vendor-${this.vendors.length + 1}`, ...data };
        this.vendors.push(vendor);
        return vendor;
      },
      findFirst: async ({ where }) =>
        this.vendors.find(
          (vendor) => vendor.id === where.id && vendor.userId === where.userId,
        ) || null,
    };

    this.auditLog = {
      create: async ({ data }) => {
        this.auditLogs.push(data);
        return data;
      },
    };
  }

  async $transaction(operations) {
    return Promise.all(operations);
  }
}

function createAuthService(prisma = new FakePrisma()) {
  const jwtService = {
    sign: (payload) => `access:${payload.sub}:${payload.roles.join(',')}`,
  };
  return { auth: new AuthService(prisma, jwtService), prisma };
}

function rolesContext(userRoles) {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({ user: { roles: userRoles } }),
    }),
  };
}

async function run() {
  const { auth, prisma } = createAuthService();

  const registered = await auth.registerCustomer({
    fullName: 'Test Customer',
    email: 'customer@test.local',
    phone: '03000000000',
    password: 'Password123!',
    city: 'Lahore',
  });
  assert.equal(registered.user.email, 'customer@test.local');
  assert.equal(registered.user.passwordHash, undefined);
  assert.ok(await bcrypt.compare('Password123!', prisma.users[0].passwordHash));
  assert.notEqual(prisma.users[0].passwordHash, 'Password123!');
  assert.equal(
    prisma.refreshTokens[0].tokenHash,
    hashToken(registered.refreshToken),
  );
  assert.notEqual(prisma.refreshTokens[0].tokenHash, registered.refreshToken);

  await auth.verifyEmail(registered.devEmailVerificationToken);
  assert.equal(prisma.users[0].isEmailVerified, true);
  await assert.rejects(() =>
    auth.verifyEmail(registered.devEmailVerificationToken),
  );

  const vendorRegistration = await auth.registerVendor({
    ownerName: 'Vendor Owner',
    businessName: 'Demo Decor Studio',
    email: 'vendor@test.local',
    phone: '03111111111',
    password: 'Password123!',
    city: 'Karachi',
    mainServiceCategory: 'decor',
  });
  assert.deepEqual(vendorRegistration.user.roles, ['VENDOR_OWNER']);
  assert.equal(vendorRegistration.user.passwordHash, undefined);

  const login = await auth.login({
    email: 'customer@test.local',
    password: 'Password123!',
  });
  assert.ok(login.accessToken);
  assert.ok(login.refreshToken);
  assert.equal(login.user.passwordHash, undefined);

  const refreshed = await auth.refresh(login.refreshToken);
  const oldRefresh = prisma.refreshTokens.find(
    (token) => token.tokenHash === hashToken(login.refreshToken),
  );
  assert.ok(oldRefresh.revokedAt instanceof Date);
  assert.equal(oldRefresh.replacedBy, hashToken(refreshed.refreshToken));
  await assert.rejects(() => auth.refresh(login.refreshToken));

  await auth.logout(refreshed.refreshToken);
  const loggedOutRefresh = prisma.refreshTokens.find(
    (token) => token.tokenHash === hashToken(refreshed.refreshToken),
  );
  assert.ok(loggedOutRefresh.revokedAt instanceof Date);

  const forgot = await auth.forgotPassword('customer@test.local');
  await auth.resetPassword(forgot.devPasswordResetToken, 'NewPassword123!');
  await assert.rejects(() =>
    auth.login({ email: 'customer@test.local', password: 'Password123!' }),
  );
  const newLogin = await auth.login({
    email: 'customer@test.local',
    password: 'NewPassword123!',
  });
  assert.ok(newLogin.accessToken);

  prisma.users[0].isSuspended = true;
  await assert.rejects(() =>
    auth.login({ email: 'customer@test.local', password: 'NewPassword123!' }),
  );

  const weddingService = new WeddingsService({
    wedding: { findFirst: async () => null },
  });
  await assert.rejects(
    () => weddingService.getWedding('intruder-user', 'wedding-1'),
    NotFoundException,
  );

  const vendorService = new VendorsService({
    vendor: { findFirst: async () => null },
  });
  await assert.rejects(
    () => vendorService.updateVendor('intruder-user', 'vendor-1', {}),
    NotFoundException,
  );

  const guard = new RolesGuard({
    getAllAndOverride: () => ['ADMIN'],
  });
  assert.equal(guard.canActivate(rolesContext(['CUSTOMER'])), false);
  assert.equal(guard.canActivate(rolesContext(['ADMIN'])), true);

  console.log('Authentication and authorization security tests passed.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
