import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const stateParam = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('OAuth error from provider:', error);
      return new Response(`<html><body><script>window.opener?.postMessage({type:'oauth-error',error:'${error}'},'*');window.close();</script><p>Authorization denied. You can close this window.</p></body></html>`, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    if (!code || !stateParam) {
      return new Response('Missing code or state', { status: 400 });
    }

    const state = JSON.parse(atob(stateParam));
    const { user_id, workspace_id, platform, redirect_uri } = state;

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const callbackUrl = `${Deno.env.get('SUPABASE_URL')!}/functions/v1/oauth-callback`;

    let tokenData: any;
    let accountInfo: any = {};

    switch (platform) {
      case 'instagram':
      case 'facebook': {
        // Exchange code for token
        const tokenRes = await fetch('https://graph.facebook.com/v21.0/oauth/access_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: Deno.env.get('META_APP_ID')!,
            client_secret: Deno.env.get('META_APP_SECRET')!,
            redirect_uri: callbackUrl,
            code,
          }),
        });
        tokenData = await tokenRes.json();
        if (tokenData.error) throw new Error(tokenData.error.message);

        // Get long-lived token
        const longLivedRes = await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${Deno.env.get('META_APP_ID')!}&client_secret=${Deno.env.get('META_APP_SECRET')!}&fb_exchange_token=${tokenData.access_token}`);
        const longLivedData = await longLivedRes.json();
        if (longLivedData.access_token) {
          tokenData.access_token = longLivedData.access_token;
          tokenData.expires_in = longLivedData.expires_in || 5184000; // ~60 days
        }

        // Get user info
        const meRes = await fetch(`https://graph.facebook.com/v21.0/me?fields=id,name,picture&access_token=${tokenData.access_token}`);
        const meData = await meRes.json();
        accountInfo = {
          platform_account_id: meData.id,
          account_name: meData.name,
          account_avatar_url: meData.picture?.data?.url,
        };

        // For Instagram, get IG business account
        if (platform === 'instagram') {
          const pagesRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=id,name,instagram_business_account{id,username,profile_picture_url}&access_token=${tokenData.access_token}`);
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
        break;
      }

      case 'youtube': {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
            client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
            redirect_uri: callbackUrl,
            code,
            grant_type: 'authorization_code',
          }),
        });
        tokenData = await tokenRes.json();
        if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

        // Get channel info
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
        break;
      }

      case 'tiktok': {
        const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_key: Deno.env.get('TIKTOK_CLIENT_KEY')!,
            client_secret: Deno.env.get('TIKTOK_CLIENT_SECRET')!,
            code,
            grant_type: 'authorization_code',
            redirect_uri: callbackUrl,
          }),
        });
        tokenData = await tokenRes.json();
        if (tokenData.data?.error_code) throw new Error(tokenData.data.description);
        // TikTok wraps in data
        if (tokenData.data) tokenData = { ...tokenData, ...tokenData.data };

        // Get user info
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
        break;
      }

      default:
        return new Response('Unsupported platform', { status: 400 });
    }

    // Save to database
    const { data: socialAccount, error: insertError } = await supabaseAdmin
      .from('social_accounts')
      .upsert({
        user_id,
        workspace_id,
        platform,
        ...accountInfo,
        status: 'active',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,workspace_id,platform,platform_account_id',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (insertError) {
      // Try insert without upsert
      const { data: sa2, error: e2 } = await supabaseAdmin
        .from('social_accounts')
        .insert({
          user_id,
          workspace_id,
          platform,
          ...accountInfo,
          status: 'active',
        })
        .select()
        .single();
      if (e2) throw e2;
      
      // Save token
      await supabaseAdmin.from('oauth_tokens').upsert({
        social_account_id: sa2.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        expires_at: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : null,
        scopes: tokenData.scope || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'social_account_id' });
    } else {
      // Save token
      await supabaseAdmin.from('oauth_tokens').upsert({
        social_account_id: socialAccount.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        expires_at: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : null,
        scopes: tokenData.scope || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'social_account_id' });
    }

    // Redirect back to app
    const successUrl = `${redirect_uri}?oauth=success&platform=${platform}`;
    return Response.redirect(successUrl, 302);

  } catch (error) {
    console.error('OAuth callback error:', error);
    return new Response(`<html><body><script>window.opener?.postMessage({type:'oauth-error',error:'${error.message}'},'*');window.close();</script><p>Error: ${error.message}. You can close this window.</p></body></html>`, {
      headers: { 'Content-Type': 'text/html' },
    });
  }
});
