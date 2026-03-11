/**
 * ================================================
 * Fastify Routes Reference — Mídias Mafort
 * ================================================
 * 
 * Copy these into your Fastify backend project.
 * Adjust imports based on your project structure.
 * 
 * Dependencies needed:
 *   npm install @fastify/jwt @fastify/multipart @fastify/cors bcryptjs pg
 *   npm install -D @types/bcryptjs @types/pg
 */

import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyMultipart from '@fastify/multipart';
import fastifyCors from '@fastify/cors';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

// ================================================
// Setup
// ================================================

const app = Fastify({ logger: true });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.register(fastifyCors, { origin: true });
app.register(fastifyJwt, { secret: process.env.JWT_SECRET || 'change-me' });
app.register(fastifyMultipart, { limits: { fileSize: 500 * 1024 * 1024 } }); // 500MB

// Auth decorator
app.decorate('authenticate', async (request: any, reply: any) => {
  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send({ message: 'Unauthorized' });
  }
});

// ================================================
// 1. Health (you already have this)
// ================================================
app.get('/health', async () => ({ status: 'ok' }));

// ================================================
// 2. Auth
// ================================================
app.post('/auth/signup', async (request, reply) => {
  const { email, password, full_name } = request.body as any;
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, avatar_url`,
    [email, hash, full_name]
  );
  const user = rows[0];
  const token = app.jwt.sign({ id: user.id, email: user.email });
  reply.status(201).send({ token, user });
});

app.post('/auth/login', async (request, reply) => {
  const { email, password } = request.body as any;
  const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
  if (!rows[0]) return reply.status(401).send({ message: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, rows[0].password_hash);
  if (!valid) return reply.status(401).send({ message: 'Invalid credentials' });
  const user = { id: rows[0].id, email: rows[0].email, full_name: rows[0].full_name, avatar_url: rows[0].avatar_url };
  const token = app.jwt.sign({ id: user.id, email: user.email });
  reply.send({ token, user });
});

app.get('/auth/me', { preHandler: [app.authenticate] }, async (request) => {
  const { rows } = await pool.query(
    `SELECT id, email, full_name, avatar_url FROM users WHERE id = $1`,
    [(request.user as any).id]
  );
  return { user: rows[0] };
});

// ================================================
// 3. Workspaces
// ================================================
app.get('/workspaces', { preHandler: [app.authenticate] }, async (request) => {
  const userId = (request.user as any).id;
  const { rows } = await pool.query(
    `SELECT w.* FROM workspaces w
     JOIN workspace_members wm ON wm.workspace_id = w.id
     WHERE wm.user_id = $1
     ORDER BY w.created_at DESC`,
    [userId]
  );
  return rows;
});

app.post('/workspaces', { preHandler: [app.authenticate] }, async (request, reply) => {
  const userId = (request.user as any).id;
  const { name, slug } = request.body as any;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO workspaces (name, slug) VALUES ($1, $2) RETURNING *`,
      [name, slug]
    );
    await client.query(
      `INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [rows[0].id, userId]
    );
    await client.query('COMMIT');
    reply.status(201).send(rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});

// ================================================
// 4. Social Accounts
// ================================================
app.get('/accounts', { preHandler: [app.authenticate] }, async (request) => {
  const { workspace_id } = request.query as any;
  const { rows } = await pool.query(
    `SELECT id, workspace_id, platform, platform_username, platform_avatar, status, connected_at
     FROM social_accounts WHERE workspace_id = $1 ORDER BY connected_at DESC`,
    [workspace_id]
  );
  return rows;
});

app.post('/accounts/connect', { preHandler: [app.authenticate] }, async (request, reply) => {
  const { workspace_id, platform } = request.body as any;
  // TODO: Implement real OAuth flow per platform
  // For now, return a placeholder URL
  const oauth_url = `https://midias.grupomafort.com/oauth/${platform}?workspace_id=${workspace_id}`;
  reply.send({ oauth_url });
});

app.delete('/accounts/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
  const { id } = request.params as any;
  await pool.query(`DELETE FROM social_accounts WHERE id = $1`, [id]);
  reply.status(204).send();
});

// ================================================
// 5. Media
// ================================================
app.get('/media', { preHandler: [app.authenticate] }, async (request) => {
  const { workspace_id } = request.query as any;
  const { rows } = await pool.query(
    `SELECT * FROM media WHERE workspace_id = $1 ORDER BY created_at DESC`,
    [workspace_id]
  );
  return rows;
});

app.post('/media/upload', { preHandler: [app.authenticate] }, async (request, reply) => {
  const data = await request.file();
  if (!data) return reply.status(400).send({ message: 'No file provided' });

  const workspace_id = (data.fields as any).workspace_id?.value;
  const filename = data.filename;
  const buffer = await data.toBuffer();

  // TODO: Upload buffer to your storage (S3, local disk, etc.)
  const url = `/uploads/${Date.now()}-${filename}`;
  const type = data.mimetype.startsWith('video/') ? 'video' : 'image';

  const { rows } = await pool.query(
    `INSERT INTO media (workspace_id, filename, url, type, size, status)
     VALUES ($1, $2, $3, $4, $5, 'ready') RETURNING *`,
    [workspace_id, filename, url, type, buffer.length]
  );
  reply.status(201).send(rows[0]);
});

app.delete('/media/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
  const { id } = request.params as any;
  // TODO: Also delete the actual file from storage
  await pool.query(`DELETE FROM media WHERE id = $1`, [id]);
  reply.status(204).send();
});

// ================================================
// 6. Schedule (Posts)
// ================================================
app.get('/schedule', { preHandler: [app.authenticate] }, async (request) => {
  const { workspace_id } = request.query as any;
  const { rows } = await pool.query(
    `SELECT * FROM scheduled_posts WHERE workspace_id = $1 ORDER BY scheduled_at ASC`,
    [workspace_id]
  );
  return rows;
});

app.post('/schedule', { preHandler: [app.authenticate] }, async (request, reply) => {
  const { workspace_id, media_id, account_id, platform, caption, hashtags, scheduled_at, metadata } = request.body as any;
  const { rows } = await pool.query(
    `INSERT INTO scheduled_posts (workspace_id, media_id, account_id, platform, caption, hashtags, scheduled_at, metadata, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'scheduled') RETURNING *`,
    [workspace_id, media_id, account_id, platform, caption, hashtags || [], scheduled_at, metadata || {}]
  );
  // Also create a queue job
  await pool.query(
    `INSERT INTO queue_jobs (post_id, status) VALUES ($1, 'pending')`,
    [rows[0].id]
  );
  reply.status(201).send(rows[0]);
});

app.put('/schedule/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
  const { id } = request.params as any;
  const fields = request.body as any;
  const setClauses: string[] = [];
  const values: any[] = [];
  let i = 1;
  for (const [key, value] of Object.entries(fields)) {
    if (['caption', 'hashtags', 'scheduled_at', 'status', 'metadata', 'media_id', 'account_id'].includes(key)) {
      setClauses.push(`${key} = $${i}`);
      values.push(value);
      i++;
    }
  }
  if (setClauses.length === 0) return reply.status(400).send({ message: 'No valid fields' });
  values.push(id);
  const { rows } = await pool.query(
    `UPDATE scheduled_posts SET ${setClauses.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  reply.send(rows[0]);
});

app.delete('/schedule/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
  const { id } = request.params as any;
  await pool.query(`DELETE FROM scheduled_posts WHERE id = $1`, [id]);
  reply.status(204).send();
});

// ================================================
// 7. Queue
// ================================================
app.get('/queue', { preHandler: [app.authenticate] }, async (request) => {
  const { workspace_id } = request.query as any;
  const { rows } = await pool.query(
    `SELECT qj.* FROM queue_jobs qj
     JOIN scheduled_posts sp ON sp.id = qj.post_id
     WHERE sp.workspace_id = $1
     ORDER BY qj.created_at DESC`,
    [workspace_id]
  );
  return rows;
});

app.post('/queue/:id/retry', { preHandler: [app.authenticate] }, async (request, reply) => {
  const { id } = request.params as any;
  const { rows } = await pool.query(
    `UPDATE queue_jobs SET status = 'retrying', attempts = attempts + 1, error = NULL
     WHERE id = $1 RETURNING *`,
    [id]
  );
  reply.send(rows[0]);
});

// ================================================
// 8. Analytics
// ================================================
app.get('/analytics', { preHandler: [app.authenticate] }, async (request) => {
  const { workspace_id, period } = request.query as any;
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const totalPosts = await pool.query(
    `SELECT COUNT(*)::int as count FROM scheduled_posts WHERE workspace_id = $1`,
    [workspace_id]
  );
  const postsThisWeek = await pool.query(
    `SELECT COUNT(*)::int as count FROM scheduled_posts
     WHERE workspace_id = $1 AND created_at >= NOW() - INTERVAL '7 days'`,
    [workspace_id]
  );
  const platformBreakdown = await pool.query(
    `SELECT platform, COUNT(*)::int as posts, 0 as views, 0 as engagement
     FROM scheduled_posts WHERE workspace_id = $1 GROUP BY platform`,
    [workspace_id]
  );
  const dailyPosts = await pool.query(
    `SELECT DATE(scheduled_at) as date, COUNT(*)::int as count
     FROM scheduled_posts WHERE workspace_id = $1 AND scheduled_at >= $2
     GROUP BY DATE(scheduled_at) ORDER BY date`,
    [workspace_id, since]
  );

  return {
    total_posts: totalPosts.rows[0]?.count || 0,
    posts_this_week: postsThisWeek.rows[0]?.count || 0,
    total_views: 0,       // TODO: integrate with platform APIs
    total_engagement: 0,  // TODO: integrate with platform APIs
    engagement_rate: 0,
    platform_breakdown: platformBreakdown.rows,
    daily_posts: dailyPosts.rows,
    top_posts: [],
  };
});

// ================================================
// Start server
// ================================================
const start = async () => {
  try {
    await app.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' });
    console.log('Server running');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
