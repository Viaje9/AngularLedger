import { Hono } from 'hono';
import { accessSubject } from './auth';
import { ApiError, type AppEnv } from './common';
import { tags } from './tags';
import { entries } from './entries';
import { settings } from './settings';

export function createApp(resolveSubject: typeof accessSubject = accessSubject) {
  const app = new Hono<AppEnv>();

  app.use('/api/v1/*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    if (!['GET', 'HEAD'].includes(c.req.method)) {
      const origin = c.req.header('Origin');
      if (!origin || origin !== new URL(c.req.url).origin) {
        throw new ApiError(400, 'INVALID_INPUT', '來源網域不正確');
      }
    }
    const subject = await resolveSubject(c.req.raw, c.env);
    const account = await c.env.DB.prepare('SELECT id FROM accounts WHERE access_subject = ?')
      .bind(subject).first<{ id: string }>();
    if (!account) throw new ApiError(403, 'ACCOUNT_NOT_LINKED', '帳本尚未綁定');
    c.set('accountId', account.id);
    await next();
  });

  app.get('/api/v1/me', (c) => c.json({ account: { id: c.get('accountId') } }));
  app.route('/api/v1', tags);
  app.route('/api/v1', entries);
  app.route('/api/v1', settings);

  app.notFound((c) => {
    c.header('Cache-Control', 'no-store');
    return c.json({ error: { code: 'NOT_FOUND', message: '資料不存在' } }, 404);
  });
  app.onError((err, c) => {
    c.header('Cache-Control', 'no-store');
    if (err instanceof ApiError) {
      return c.json({ error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) } }, err.status);
    }
    console.error('Unexpected API error');
    return c.json({ error: { code: 'INTERNAL_ERROR', message: '伺服器發生錯誤' } }, 500);
  });

  return app;
}

export default createApp();
