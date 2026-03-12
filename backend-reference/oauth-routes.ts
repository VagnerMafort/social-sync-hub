/**
 * OAuth Routes for Fastify (VPS Backend)
 * 
 * INSTALLATION:
 *   npm install node-fetch@2 (if not already using native fetch)
 * 
 * ENVIRONMENT VARIABLES (add to .env on your VPS):
 *   META_APP_ID=your_meta_app_id
 *   META_APP_SECRET=your_meta_app_secret
 *   GOOGLE_CLIENT_ID=your_google_client_id
 *   GOOGLE_CLIENT_SECRET=your_google_client_secret
 *   TIKTOK_CLIENT_KEY=your_tiktok_client_key
 *   TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
 *   FRONTEND_URL=https://midias.grupomafort.com  (or your frontend domain)
 *   API_BASE_URL=https://midias.grupomafort.com/api/v1
 * 
 * CALLBACK URLs to register in each platform:
 *   Meta:    https://midias.grupomafort.com/api/v1/oauth/callback
 *   Google:  https://midias.grupomafort.com/api/v1/oauth/callback
 *   TikTok:  https://midias.grupomafort.com/api/v1/oauth/callback
 * 
 * USAGE: Import and call registerOAuthRoutes(app, pool) in your main server file.
 */

import type { FastifyInstance } from 'fastify';
import type { Pool } from 'pg';

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://midias.grupomafort.com';
const API_BASE_URL = process.env.API_BASE_URL || 'https://midias.grupomafort.com/api/v1';
const CALLBACK_URL = `${API_BASE_URL}/oauth/callback`;

export function registerOAuthRoutes(app: FastifyInstance, pool: Pool) {

  // =============================================
  // POST /accounts/connect — Initiate OAuth flow
  // =============================================
  app.post('/accounts/connect', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { workspace_id, platform } = request.body as { workspace_id: string; platform: string };

    if (!workspace_id || !platform) {
      return reply.status(400).send({ error: 'Missing workspace_id or platform' });
    }

    const userId = (request as any).user.id;
    const state = Buffer.from(JSON.stringify({ 
      user_id: userId, 
      workspace_id, 
      platform 
    })).toString('base64url');

    let oauth_url = '';

    switch (platform) {
      case 'instagram':
      case 'facebook': {
        const META_APP_ID = process.env.META_APP_ID;
        if (!META_APP_ID) return reply.status(500).send({ error: 'META_APP_ID not configured' });

        const scopes = platform === 'instagram'
          ? 'instagram_basic,instagram_content_publish,instagram_manage_insights,pages_show_list,pages_read_engagement'
          : 'pages_show_list,pages_read_engagement,pages_manage_posts,pages_read_user_content';
        
        oauth_url = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(CALLBACK_URL)}&state=${state}&scope=${scopes}&response_type=code`;
        break;
      }

      case 'youtube': {
        const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
        if (!GOOGLE_CLIENT_ID) return reply.status(500).send({ error: 'GOOGLE_CLIENT_ID not configured' });

        const scopes = 'https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly';
        oauth_url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(CALLBACK_URL)}&state=${state}&scope=${encodeURIComponent(scopes)}&response_type=code&access_type=offline&prompt=consent`;
        break;
      }

      case 'tiktok': {
        const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
        if (!TIKTOK_CLIENT_KEY) return reply.status(500).send({ error: 'TIKTOK_CLIENT_KEY not configured' });

        const scopes = 'user.info.basic,video.upload,video.publish';
        oauth_url = `https://www.tiktok.com/v2/auth/authorize/?client_key=${TIKTOK_CLIENT_KEY}&redirect_uri=${encodeURIComponent(CALLBACK_URL)}&state=${state}&scope=${scopes}&response_type=code`;
        break;
      }

      default:
        return reply.status(400).send({ error: `Unsupported platform: ${platform}` });
    }

    return reply.send({ oauth_url });
  });

  // =============================================
  // GET /oauth/callback — Handle OAuth callback
  // =============================================
  app.get('/oauth/callback', async (request, reply) => {
    try {
      const { code, state, error } = request.query as { code?: string; state?: string; error?: string };

      if (error) {
        console.error('OAuth error from provider:', error);
        return reply.redirect(`${FRONTEND_URL}/accounts?oauth=error&message=${encodeURIComponent(error)}`);
      }

      if (!code || !state) {
        return reply.redirect(`${FRONTEND_URL}/accounts?oauth=error&message=Missing+code+or+state`);
      }

      const stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
      const { user_id, workspace_id, platform } = stateData;

      let tokenData: any;
      let accountInfo: any = {};

      // =========================
      // META (Instagram/Facebook)
      // =========================
      if (platform === 'instagram' || platform === 'facebook') {
        // Exchange code for short-lived token
        const tokenRes = await fetch('https://graph.facebook.com/v21.0/oauth/access_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: process.env.META_APP_ID!,
            client_secret: process.env.META_APP_SECRET!,
            redirect_uri: CALLBACK_URL,
            code,
          }),
        });
        tokenData = await tokenRes.json();
        if (tokenData.error) throw new Error(tokenData.error.message);

        // Exchange for long-lived token (~60 days)
        const longLivedRes = await fetch(
          `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`
        );
        const longLivedData = await longLivedRes.json();
        if (longLivedData.access_token) {
          tokenData.access_token = longLivedData.access_token;
          tokenData.expires_in = longLivedData.expires_in || 5184000;
        }

        // Get user info
        const meRes = await fetch(`https://graph.facebook.com/v21.0/me?fields=id,name,picture&access_token=${tokenData.access_token}`);
        const meData = await meRes.json();
        accountInfo = {
          platform_account_id: meData.id,
          account_name: meData.name,
          account_avatar_url: meData.picture?.data?.url,
        };

        // For Instagram, get the IG business account linked to a Page
        if (platform === 'instagram') {
          const pagesRes = await fetch(
            `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,instagram_business_account{id,username,profile_picture_url}&access_token=${tokenData.access_token}`
          );
          const pagesData = await pagesRes.json();
          const igAccount = pagesData.data?.find((p: any) => p.instagram_business_account);
          if (igAccount?.instagram_business_account) {
            accountInfo = {
              platform_account_id: igAccount.instagram_business_account.id,
              account_name: igAccount.instagram_business_account.username || igAccount.name,
              account_avatar_url: igAccount.instagram_business_account.profile_picture_url,
            };
          }
        }
      }

      // ==============
      // GOOGLE/YOUTUBE
      // ==============
      else if (platform === 'youtube') {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            redirect_uri: CALLBACK_URL,
            code,
            grant_type: 'authorization_code',
          }),
        });
        tokenData = await tokenRes.json();
        if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

        // Get YouTube channel info
        const channelRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const channelData = await channelRes.json();
        const channel = channelData.items?.[0];
        accountInfo = {
          platform_account_id: channel?.id || '',
          account_name: channel?.snippet?.title || 'YouTube Channel',
          account_avatar_url: channel?.snippet?.thumbnails?.default?.url,
        };
      }

      // ======
      // TIKTOK
      // ======
      else if (platform === 'tiktok') {
        const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_key: process.env.TIKTOK_CLIENT_KEY!,
            client_secret: process.env.TIKTOK_CLIENT_SECRET!,
            code,
            grant_type: 'authorization_code',
            redirect_uri: CALLBACK_URL,
          }),
        });
        tokenData = await tokenRes.json();
        if (tokenData.data?.error_code) throw new Error(tokenData.data.description);
        if (tokenData.data) tokenData = { ...tokenData, ...tokenData.data };

        // Get TikTok user info
        const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const userData = await userRes.json();
        const tiktokUser = userData.data?.user;
        accountInfo = {
          platform_account_id: tokenData.open_id || tiktokUser?.open_id || '',
          account_name: tiktokUser?.display_name || 'TikTok User',
          account_avatar_url: tiktokUser?.avatar_url,
        };
      }

      else {
        return reply.redirect(`${FRONTEND_URL}/accounts?oauth=error&message=Unsupported+platform`);
      }

      // ============================
      // Save account + token to DB
      // ============================
      const expiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null;

      // Upsert social account
      const accountResult = await pool.query(
        `INSERT INTO social_accounts (user_id, workspace_id, platform, platform_account_id, account_name, account_avatar_url, status, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'connected', NOW())
         ON CONFLICT (user_id, workspace_id, platform, platform_account_id) 
         DO UPDATE SET account_name = $5, account_avatar_url = $6, status = 'connected', updated_at = NOW()
         RETURNING id`,
        [user_id, workspace_id, platform, accountInfo.platform_account_id, accountInfo.account_name, accountInfo.account_avatar_url]
      );
      const accountId = accountResult.rows[0].id;

      // Upsert OAuth token
      await pool.query(
        `INSERT INTO oauth_tokens (social_account_id, access_token, refresh_token, expires_at, scopes, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (social_account_id) 
         DO UPDATE SET access_token = $2, refresh_token = $3, expires_at = $4, scopes = $5, updated_at = NOW()`,
        [accountId, tokenData.access_token, tokenData.refresh_token || null, expiresAt, tokenData.scope || null]
      );

      // Redirect back to frontend
      return reply.redirect(`${FRONTEND_URL}/accounts?oauth=success&platform=${platform}`);

    } catch (error: any) {
      console.error('OAuth callback error:', error);
      return reply.redirect(`${FRONTEND_URL}/accounts?oauth=error&message=${encodeURIComponent(error.message)}`);
    }
  });

  // =============================================
  // GET /accounts — List connected accounts
  // =============================================
  // (Replace your existing /accounts GET route with this)
  app.get('/accounts', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { workspace_id } = request.query as { workspace_id: string };
    const userId = (request as any).user.id;

    const result = await pool.query(
      `SELECT id, platform, platform_account_id as provider_account_id, 
              account_name as platform_username, account_avatar_url as avatar_url, 
              status, created_at as connected_at, updated_at
       FROM social_accounts 
       WHERE user_id = $1 AND workspace_id = $2
       ORDER BY created_at DESC`,
      [userId, workspace_id]
    );

    return reply.send({ items: result.rows });
  });

  // =============================================
  // DELETE /accounts/:id — Disconnect account
  // =============================================
  app.delete('/accounts/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = (request as any).user.id;

    // Delete tokens first (cascade should handle this, but being explicit)
    await pool.query(
      `DELETE FROM oauth_tokens WHERE social_account_id = $1`,
      [id]
    );

    await pool.query(
      `DELETE FROM social_accounts WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    return reply.status(204).send();
  });
}
