import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

const envFilePath = path.resolve(__dirname, '../../.env');

if (existsSync(envFilePath)) {
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
}

export default defineConfig({
  schema: 'prisma/schema.prisma'
});
