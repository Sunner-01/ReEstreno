import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createApp } from '../../backend/src/main';
import { makeUser, cleanUsers, testListing, adminClient } from '../helpers';
let app: INestApplication;
let seller: Awaited<ReturnType<typeof makeUser>>;
let buyer: Awaited<ReturnType<typeof makeUser>>;
let listingId: string;
let tradeId: string;
beforeAll(async () => {
  app = await createApp();
  await app.init();
  seller = await makeUser('integration-seller');
  buyer = await makeUser('integration-buyer');
  const result = await request(app.getHttpServer())
    .post('/listings')
    .auth(seller.token, { type: 'bearer' })
    .send(testListing);
  expect(result.status).toBe(201);
  listingId = result.body.id;
});
afterAll(async () => {
  await cleanUsers([seller?.id, buyer?.id].filter(Boolean));
  await app?.close();
});
describe.sequential('API Nest + Supabase real', () => {
  it('persiste una publicación y la devuelve en el catálogo filtrado', async () => {
    const result = await request(app.getHttpServer())
      .get('/listings')
      .query({ q: 'Cámara para prueba', category: 'Tecnología' });
    expect(result.status).toBe(200);
    expect(result.body.some((x: { id: string }) => x.id === listingId)).toBe(true);
  });
  it('rechaza crear sin sesión', async () => {
    expect((await request(app.getHttpServer()).post('/listings').send(testListing)).status).toBe(
      401,
    );
  });
  it('rechaza modificar un objeto ajeno desde la API', async () => {
    expect(
      (
        await request(app.getHttpServer())
          .patch(`/listings/${listingId}`)
          .auth(buyer.token, { type: 'bearer' })
          .send({ ...testListing, title: 'Objeto robado' })
      ).status,
    ).toBe(400);
  });
  it('RLS impide modificar un objeto ajeno directamente en Supabase', async () => {
    const result = await buyer.client
      .from('listings')
      .update({ title: 'Objeto robado' })
      .eq('id', listingId)
      .select();
    expect(result.data || []).toHaveLength(0);
    expect(
      (await adminClient().from('listings').select('title').eq('id', listingId).single()).data
        ?.title,
    ).toBe(testListing.title);
  });
  it('mantiene los teléfonos privados para otros usuarios', async () => {
    const result = await buyer.client.from('contacts').select('*').eq('id', seller.id);
    expect(result.data).toEqual([]);
  });
  it('guarda favoritos sin duplicados', async () => {
    for (let i = 0; i < 2; i++)
      expect(
        (
          await request(app.getHttpServer())
            .post(`/favorites/${listingId}`)
            .auth(buyer.token, { type: 'bearer' })
        ).status,
      ).toBe(201);
    const result = await request(app.getHttpServer())
      .get('/me/favorites')
      .auth(buyer.token, { type: 'bearer' });
    expect(result.body).toHaveLength(1);
  });
  it('crea interés y devuelve un enlace de WhatsApp', async () => {
    const result = await request(app.getHttpServer())
      .post(`/listings/${listingId}/contact`)
      .auth(buyer.token, { type: 'bearer' });
    expect(result.status).toBe(201);
    expect(result.body.url).toMatch(/^https:\/\/wa.me\/59170000000/);
    const trades = await request(app.getHttpServer())
      .get('/me/trades')
      .auth(buyer.token, { type: 'bearer' });
    tradeId = trades.body[0].id;
    expect(trades.body[0].status).toBe('interested');
  });
  it('impide calificar antes de confirmar la entrega', async () => {
    expect(
      (
        await request(app.getHttpServer())
          .post(`/trades/${tradeId}/review`)
          .auth(buyer.token, { type: 'bearer' })
          .send({ rating: 5, comment: 'Todo llegó en muy buen estado.' })
      ).status,
    ).toBe(400);
  });
  it('completa la entrega con confirmaciones separadas y marca vendido', async () => {
    expect(
      (
        await request(app.getHttpServer())
          .post(`/trades/${tradeId}/accept`)
          .auth(seller.token, { type: 'bearer' })
      ).status,
    ).toBe(201);
    expect(
      (
        await request(app.getHttpServer())
          .post(`/trades/${tradeId}/confirm`)
          .auth(buyer.token, { type: 'bearer' })
      ).status,
    ).toBe(201);
    const listing = await request(app.getHttpServer()).get(`/listings/${listingId}`);
    expect(listing.body.status).toBe('sold');
  });
  it('admite una reseña confirmada e impide duplicarla', async () => {
    const body = { rating: 5, comment: 'Todo llegó en muy buen estado.' };
    const send = () =>
      request(app.getHttpServer())
        .post(`/trades/${tradeId}/review`)
        .auth(buyer.token, { type: 'bearer' })
        .send(body);
    expect((await send()).status).toBe(201);
    expect((await send()).status).toBe(400);
  });
  it('impide cambiar el estado del anuncio por acceso directo a la tabla', async () => {
    const result = await buyer.client
      .from('listings')
      .update({ status: 'available' })
      .eq('id', listingId);
    expect(result.error).not.toBeNull();
  });
});
