import dotenv from 'dotenv';

dotenv.config();

const config = {
  host: process.env.HOST ?? '127.0.0.1',
  port: Number.parseInt(process.env.PORT ?? '3000', 10),
  defaultTenantId: process.env.DEFAULT_TENANT_ID ?? 'tenant_123'
};

export default config;
