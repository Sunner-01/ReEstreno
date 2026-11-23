import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
const url = process.env.SUPABASE_URL;
if (!url || !['127.0.0.1', 'localhost'].includes(new URL(url).hostname))
  throw new Error('Los datos de demostración solo se cargan en Supabase local.');
const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
function check(result) {
  if (result.error) throw result.error;
  return result.data;
}
const password = 'ReEstreno2026!';
const existing = check(await db.auth.admin.listUsers({ perPage: 1000 })).users;
const users = [];
for (const [email, name, city, role] of [
  ['ana@reestreno.local', 'Ana Morales · Demo', 'La Paz', 'seller'],
  ['leo@reestreno.local', 'Leo Vargas · Demo', 'Cochabamba', 'buyer'],
  ['moderacion@reestreno.local', 'Equipo ReEstreno · Demo', 'La Paz', 'moderator'],
]) {
  let user = existing.find((u) => u.email === email);
  if (!user)
    user = check(
      await db.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { role },
      }),
    ).user;
  check(
    await db
      .from('profiles')
      .upsert({ id: user.id, name, city, bio: 'Perfil de demostración para explorar ReEstreno.' }),
  );
  check(await db.from('contacts').upsert({ id: user.id, whatsapp: '59170000000' }));
  users.push(user);
}
const entries = [
  ['Cámara Canon para nuevas historias', 'Tecnología', 1850, 'camera', 'Buen estado', 'La Paz'],
  ['Sillón de madera y cuero', 'Hogar', 780, 'chair', 'Buen estado', 'La Paz'],
  ['Audífonos para desconectarte', 'Tecnología', 320, 'headphones', 'Como nuevo', 'Cochabamba'],
  ['Bicicleta para salir a descubrir', 'Deportes', 1200, 'bike', 'Buen estado', 'Santa Cruz'],
  ['Guitarra acústica, nuevas canciones', 'Música', 460, 'guitar', 'Buen estado', 'La Paz'],
  ['Zapatillas rojas con mucho camino', 'Moda', 190, 'shoes', 'Como nuevo', 'Cochabamba'],
  ['Libros para una tarde sin prisa', 'Libros', 85, 'books', 'Buen estado', 'Sucre'],
  ['Lámpara para tu rincón favorito', 'Hogar', 210, 'lamp', 'Con detalles', 'La Paz'],
];
for (const [i, [title, category, price, image, condition, city]] of entries.entries()) {
  const id = `10000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`;
  const found = check(await db.from('listings').select('id').eq('id', id).maybeSingle());
  if (!found)
    check(
      await db
        .from('listings')
        .insert({
          id,
          title,
          category,
          price,
          condition,
          city,
          seller_id: users[0].id,
          images: [`/images/${image}.jpg`],
          description:
            'Publicación de demostración. Un objeto con historia, cuidado y listo para una nueva etapa. Las fotografías son ilustrativas; este anuncio no representa una venta real.',
        }),
    );
}
console.log(
  'Datos de demostración disponibles. Cuentas locales: ana@reestreno.local y leo@reestreno.local. Contraseña: ReEstreno2026!',
);
