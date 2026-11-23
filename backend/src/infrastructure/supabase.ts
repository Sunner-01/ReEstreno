import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
@Injectable()
export class Supabase {
  client(token?: string) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Configura Supabase antes de iniciar el backend.');
    return createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    });
  }
}
