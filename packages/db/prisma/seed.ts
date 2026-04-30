import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { prisma } from '../src/client.ts';

const ROLE_NAMES = ['admin', 'shipper', 'consignee', 'agent'] as const;

interface BootstrapAdminConfig {
  email: string;
  name: string;
  passwordHash: string;
  phone: string | null;
}

const loadEnvFile = (): void => {
  const envFilePath = path.resolve(process.cwd(), '../../.env');

  if (!existsSync(envFilePath)) {
    return;
  }

  const envFile = readFileSync(envFilePath, 'utf8');

  for (const line of envFile.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
    const normalizedValue = rawValue.replace(/^(['"])(.*)\1$/, '$2');

    if (!(key in process.env)) {
      process.env[key] = normalizedValue;
    }
  }
};

const normalizeOptionalValue = (value: string | undefined): string | null => {
  const trimmedValue = value?.trim();

  return trimmedValue ? trimmedValue : null;
};

const getBootstrapAdminConfig = (): BootstrapAdminConfig | null => {
  const email = normalizeOptionalValue(process.env.AUTH_BOOTSTRAP_ADMIN_EMAIL);
  const name = normalizeOptionalValue(process.env.AUTH_BOOTSTRAP_ADMIN_NAME);
  const passwordHash = normalizeOptionalValue(
    process.env.AUTH_BOOTSTRAP_ADMIN_PASSWORD_HASH
  );
  const phone = normalizeOptionalValue(process.env.AUTH_BOOTSTRAP_ADMIN_PHONE);

  const configuredValues = [email, name, passwordHash];
  const configuredCount = configuredValues.filter(
    (value): value is string => value !== null
  ).length;

  if (configuredCount === 0) {
    return null;
  }

  if (configuredCount !== configuredValues.length) {
    throw new Error(
      'AUTH_BOOTSTRAP_ADMIN_EMAIL, AUTH_BOOTSTRAP_ADMIN_NAME, and AUTH_BOOTSTRAP_ADMIN_PASSWORD_HASH must be set together.'
    );
  }

  if (email === null || name === null || passwordHash === null) {
    throw new Error('Bootstrap admin configuration could not be resolved.');
  }

  if (!passwordHash.startsWith('$2')) {
    throw new Error(
      'AUTH_BOOTSTRAP_ADMIN_PASSWORD_HASH must be a bcrypt-compatible hash.'
    );
  }

  return {
    email,
    name,
    passwordHash,
    phone
  };
};

const seedRoles = async (): Promise<void> => {
  await Promise.all(
    ROLE_NAMES.map(async (roleName) =>
      prisma.role.upsert({
        where: { name: roleName },
        update: {},
        create: { name: roleName }
      })
    )
  );
};

const seedAdminUser = async (
  config: BootstrapAdminConfig | null
): Promise<void> => {
  if (config === null) {
    return;
  }

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: 'admin' }
  });

  const user = await prisma.user.upsert({
    where: { email: config.email },
    update: {
      name: config.name,
      passwordHash: config.passwordHash,
      phone: config.phone,
      isDisabled: false,
      organizationId: null
    },
    create: {
      email: config.email,
      name: config.name,
      passwordHash: config.passwordHash,
      phone: config.phone,
      isDisabled: false,
      organizationId: null
    }
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: adminRole.id
      }
    },
    update: {},
    create: {
      userId: user.id,
      roleId: adminRole.id
    }
  });
};

const main = async (): Promise<void> => {
  loadEnvFile();

  await seedRoles();
  await seedAdminUser(getBootstrapAdminConfig());
};

main()
  .catch(async (error: unknown) => {
    console.error('Prisma seed failed.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
