import { createClient } from '@supabase/supabase-js';
export const password = 'TestsReEstreno2026!';
export function adminClient() {
  const url = process.env.SUPABASE_URL!;
  if (!url || !['localhost', '127.0.0.1'].includes(new URL(url).hostname))
    throw new Error('Las pruebas requieren Supabase local.');
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export async function makeUser(prefix: string) {
  const db = adminClient();
  const email = `${prefix}-${crypto.randomUUID()}@example.test`;
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw error;
  const id = data.user.id;
  const p = await db.from('profiles').insert({ id, name: `Prueba ${prefix}`, city: 'La Paz' });
  if (p.error) throw p.error;
  await db.from('contacts').insert({ id, whatsapp: '59170000000' });
  const client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signed = await client.auth.signInWithPassword({ email, password });
  if (signed.error) throw signed.error;
  return { id, email, token: signed.data.session!.access_token, client };
}
export const testListing = {
  title: 'Cámara para prueba',
  description: 'Cámara de prueba con todos sus accesorios en buen estado.',
  price: 250,
  category: 'Tecnología',
  condition: 'Buen estado',
  city: 'La Paz',
  images: ['/images/camera.jpg'],
};
export async function cleanUsers(ids: string[]) {
  const db = adminClient();
  for (const id of ids) {
    const trades = await db.from('trades').select('id').or(`seller_id.eq.${id},buyer_id.eq.${id}`);
    if (trades.data?.length)
      await db
        .from('reviews')
        .delete()
        .in(
          'trade_id',
          trades.data.map((t) => t.id),
        );
    await db.from('trades').delete().or(`seller_id.eq.${id},buyer_id.eq.${id}`);
    await db.from('reports').delete().eq('user_id', id);
    await db.from('reviews').delete().or(`seller_id.eq.${id},buyer_id.eq.${id}`);
    const images = await db.storage.from('listing-images').list(id);
    if (images.data?.length)
      await db.storage.from('listing-images').remove(images.data.map((x) => `${id}/${x.name}`));
    await db.auth.admin.deleteUser(id);
  }
}
