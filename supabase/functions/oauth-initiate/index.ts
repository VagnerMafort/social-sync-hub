import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const REDIRECT_BASE = Deno.env.get('SUPABASE_URL')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { platform, workspace_id, redirect_uri } = await req.json();

    if (!platform || !workspace_id || !redirect_uri) {
      return new Response(JSON.stringify({ error: 'Missing platform, workspace_id, or redirect_uri' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Build state param (encode user info for callback)
    const state = btoa(JSON.stringify({ user_id: user.id, workspace_id, platform, redirect_uri }));

    let oauth_url = '';
    const callbackUrl = `${REDIRECT_BASE}/functions/v1/oauth-callback`;

    switch (platform) {
      case 'instagram':
      case 'facebook': {
        const META_APP_ID = Deno.env.get('META_APP_ID')!;
        const scopes = platform === 'instagram'
          ? 'instagram_basic,instagram_content_publish,instagram_manage_insights,pages_show_list,pages_read_engagement'
          : 'pages_show_list,pages_read_engagement,pages_manage_posts,pages_read_user_content';
        oauth_url = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${state}&scope=${scopes}&response_type=code`;
        break;
      }
      case 'youtube': {
        const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
        const scopes = 'https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly';
        oauth_url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${state}&scope=${encodeURIComponent(scopes)}&response_type=code&access_type=offline&prompt=consent`;
        break;
      }
      case 'tiktok': {
        const TIKTOK_CLIENT_KEY = Deno.env.get('TIKTOK_CLIENT_KEY')!;
        const scopes = 'user.info.basic,video.upload,video.publish';
        oauth_url = `https://www.tiktok.com/v2/auth/authorize/?client_key=${TIKTOK_CLIENT_KEY}&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${state}&scope=${scopes}&response_type=code`;
        break;
      }
      default:
        return new Response(JSON.stringify({ error: `Unsupported platform: ${platform}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ oauth_url }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('OAuth initiate error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
