import { test, expect, Page } from '@playwright/test';
import { makeUser, cleanUsers, testListing, adminClient, password } from '../helpers';
let seller: Awaited<ReturnType<typeof makeUser>>;
let buyer: Awaited<ReturnType<typeof makeUser>>;
let listingId: string;
async function login(page: Page, email: string) {
  await page.goto('/acceso');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.locator('form').getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page).toHaveURL(/cuenta/);
}
test.beforeAll(async () => {
  seller = await makeUser('e2e-vendedor');
  buyer = await makeUser('e2e-comprador');
  const result = await adminClient()
    .from('listings')
    .insert({ ...testListing, title: 'Cámara E2E única', seller_id: seller.id })
    .select()
    .single();
  if (result.error) throw result.error;
  listingId = result.data.id;
});
test.afterAll(async () => {
  await cleanUsers([seller?.id, buyer?.id].filter(Boolean));
});
test('el visitante busca un objeto y abre su detalle', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Buscar objetos' }).fill('Cámara E2E única');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page.locator(`a[href="/objeto/${listingId}"]`).first().click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cámara E2E única');
  await expect(page.getByRole('button', { name: 'Coordinar por WhatsApp' })).toBeVisible();
});
test('filtrar una categoría cambia los resultados', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Libros', exact: true }).click();
  await expect(page.getByText('objetos en Libros')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Libros para una tarde sin prisa' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cámara E2E única' })).toHaveCount(0);
});
test('un visitante debe ingresar antes de publicar', async ({ page }) => {
  await page.goto('/publicar');
  await expect(page.getByRole('link', { name: 'Ingresar o crear cuenta' })).toBeVisible();
  await expect(page.getByLabel('Título', { exact: true })).toHaveCount(0);
});
test('registra una cuenta y guarda su perfil', async ({ page }) => {
  const email = `registro-${crypto.randomUUID()}@example.test`;
  await page.goto('/acceso');
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
  await page.getByLabel('Tu nombre').fill('Nueva Persona');
  await page.getByRole('textbox', { name: /WhatsApp/ }).fill('59170000001');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Crear mi cuenta' }).click();
  await expect(page).toHaveURL(/cuenta/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Nueva');
  const users = await adminClient().auth.admin.listUsers({ perPage: 1000 });
  const user = users.data.users.find((x) => x.email === email);
  if (user) await cleanUsers([user.id]);
});
test('el vendedor publica con una foto real y edita el precio', async ({ page }) => {
  await login(page, seller.email);
  await page.goto('/publicar');
  await page.getByLabel('Fotos del objeto').setInputFiles('frontend/public/images/camera.jpg');
  await expect(page.getByAltText('Foto 1 del objeto')).toBeVisible();
  await page.getByLabel('Título', { exact: true }).fill('Cámara publicada desde navegador');
  await page
    .getByLabel('Descripción', { exact: true })
    .fill('Cámara de prueba con lente y accesorios en perfecto estado.');
  await page.getByLabel('Precio (Bs)').fill('450');
  await page.getByRole('button', { name: 'Publicar objeto', exact: true }).click();
  await expect(page).toHaveURL(/objeto/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Cámara publicada desde navegador',
  );
  await page.getByRole('link', { name: 'Editar mi publicación' }).click();
  await page.getByLabel('Precio (Bs)').fill('400');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.locator('.detail-price')).toHaveText('Bs 400');
});
test('el vendedor sube, muestra y quita su foto de perfil', async ({ page }) => {
  await login(page, seller.email);
  await page.goto('/cuenta');
  await page.getByRole('button', { name: 'Mi perfil' }).click();
  await page.getByLabel('Elegir foto').setInputFiles('frontend/public/images/camera.jpg');
  await expect(page.getByText('Foto de perfil actualizada.')).toBeVisible();
  await expect(page.locator('.profile-photo-editor .avatar img')).toBeVisible();
  await page.goto(`/vendedor/${seller.id}`);
  await expect(page.locator('.profile-heading .avatar img')).toBeVisible();
  await page.goto('/cuenta');
  await page.getByRole('button', { name: 'Mi perfil' }).click();
  await page.getByRole('button', { name: 'Quitar foto' }).click();
  await expect(page.getByText('Foto de perfil eliminada.')).toBeVisible();
  await expect(page.locator('.profile-photo-editor .avatar img')).toHaveCount(0);
});
test('un comprador guarda y quita un favorito', async ({ page }) => {
  await login(page, buyer.email);
  await page.goto(`/objeto/${listingId}`);
  await page.getByRole('button', { name: 'Guardar en favoritos', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Guardado');
  await page.goto('/favoritos');
  await expect(page.getByRole('heading', { name: 'Cámara E2E única' })).toBeVisible();
  await page.getByRole('button', { name: 'Quitar de favoritos: Cámara E2E única' }).click();
  await expect(
    page.getByRole('heading', { name: 'Aquí van tus próximos hallazgos' }),
  ).toBeVisible();
});
test('coordina por WhatsApp sin enviar mensajes y confirma una entrega con reseña', async ({
  page,
  context,
}) => {
  await context.route('https://wa.me/**', (route) =>
    route.fulfill({ status: 200, body: 'WhatsApp externo simulado: no se envían mensajes.' }),
  );
  await login(page, buyer.email);
  await page.goto(`/objeto/${listingId}`);
  await page.getByRole('button', { name: 'Coordinar por WhatsApp' }).click();
  await expect(page.getByRole('link', { name: 'Abrir WhatsApp' })).toHaveAttribute(
    'href',
    /^https:\/\/wa.me\/59170000000\?text=/,
  );
  for (const popup of context.pages()) if (popup !== page) await popup.close();
  await page.bringToFront();
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL('http://127.0.0.1:4310/');
  await login(page, seller.email);
  await page.getByRole('button', { name: 'Compras y ventas' }).click();
  await page.getByRole('button', { name: 'Confirmar entrega a esta persona' }).click();
  await expect(page.getByText('Confirma la entrega', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL('http://127.0.0.1:4310/');
  await login(page, buyer.email);
  await page.getByRole('button', { name: 'Compras y ventas' }).click();
  await page.getByRole('button', { name: 'Confirmar que recibí el objeto' }).click();
  await page.getByRole('button', { name: 'Calificar vendedor' }).click();
  await page
    .getByLabel('Tu experiencia')
    .fill('La entrega fue puntual y el objeto estaba como se describía.');
  await page.getByRole('button', { name: 'Publicar reseña' }).click();
  await expect(page.getByText('Reseña publicada')).toBeVisible();
});
test('el catálogo funciona en móvil sin desplazamiento horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Lo bueno merece/ })).toBeVisible();
  await expect(page.locator('.product-card').first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
// Cambio para probar
