import Fastify from 'fastify';
import config from './config.js';

const tenants = new Map();
const videos = new Map();
const provisioningTokens = new Map();

function ensureTenant(tenantId, name = 'Default tenant') {
  if (!tenants.has(tenantId)) {
    tenants.set(tenantId, { id: tenantId, name, createdAt: new Date().toISOString() });
  }
  return tenants.get(tenantId);
}

function addVideo({ id, tenantId, title }) {
  const tenant = ensureTenant(tenantId);
  const record = {
    id,
    tenantId: tenant.id,
    title,
    createdAt: new Date().toISOString()
  };
  videos.set(id, record);
  return record;
}

function createProvisioningToken(token, tenantId) {
  const tenant = ensureTenant(tenantId);
  const record = {
    token,
    tenantId: tenant.id,
    createdAt: new Date().toISOString()
  };
  provisioningTokens.set(token, record);
  return record;
}

ensureTenant(config.defaultTenantId, 'Default tenant');
addVideo({ id: 'video_1', tenantId: config.defaultTenantId, title: 'Welcome to Affirmer' });
createProvisioningToken('token_default', config.defaultTenantId);

const app = Fastify({ logger: true });

app.get('/health', async () => ({ status: 'ok' }));

app.get('/tenants', async () => Array.from(tenants.values()));

app.post('/tenants', async (request, reply) => {
  const { id, name } = request.body ?? {};
  if (!id || !name) {
    return reply.code(400).send({ error: 'Tenant id and name are required.' });
  }
  if (tenants.has(id)) {
    return reply.code(409).send({ error: 'Tenant already exists.' });
  }
  const tenant = ensureTenant(id, name);
  return reply.code(201).send(tenant);
});

app.get('/tenants/:tenantId/videos', async (request, reply) => {
  const { tenantId } = request.params;
  if (!tenants.has(tenantId)) {
    return reply.code(404).send({ error: 'Tenant not found.' });
  }
  const tenantVideos = Array.from(videos.values()).filter((video) => video.tenantId === tenantId);
  return tenantVideos;
});

app.post('/tenants/:tenantId/videos', async (request, reply) => {
  const { tenantId } = request.params;
  const { id, title } = request.body ?? {};
  if (!tenants.has(tenantId)) {
    return reply.code(404).send({ error: 'Tenant not found.' });
  }
  if (!id || !title) {
    return reply.code(400).send({ error: 'Video id and title are required.' });
  }
  if (videos.has(id)) {
    return reply.code(409).send({ error: 'Video already exists.' });
  }
  const video = addVideo({ id, tenantId, title });
  return reply.code(201).send(video);
});

app.get('/provisioning-tokens', async () => Array.from(provisioningTokens.values()));

app.post('/provisioning-tokens', async (request, reply) => {
  const { token, tenantId } = request.body ?? {};
  if (!token || !tenantId) {
    return reply.code(400).send({ error: 'Token and tenantId are required.' });
  }
  if (provisioningTokens.has(token)) {
    return reply.code(409).send({ error: 'Token already exists.' });
  }
  const record = createProvisioningToken(token, tenantId);
  return reply.code(201).send(record);
});

export async function start() {
  try {
    await app.listen({ port: config.port, host: config.host });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}

export default app;
