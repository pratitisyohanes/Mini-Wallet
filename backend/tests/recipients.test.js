import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma.js';
import { maskPhone } from '../src/utils/serializers.js';
import { app, createLoggedInUser, resetDatabase } from './helpers.js';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

describe('authorization', () => {
  it.each([
    ['get', '/api/recipients'],
    ['post', '/api/recipients'],
    ['delete', '/api/recipients/00000000-0000-4000-8000-000000000000'],
  ])('%s %s returns 401 without a token', async (method, path) => {
    await request(app)[method](path).expect(401);
  });
});

describe('POST /api/recipients', () => {
  it('saves a registered user by email and lists it with a masked phone', async () => {
    const { agent } = await createLoggedInUser();
    const { user: budi } = await createLoggedInUser();

    const response = await agent
      .post('/api/recipients')
      .send({ identifier: budi.email.toUpperCase(), alias: '  Budi kantor  ' })
      .expect(201);

    expect(response.body.data.recipient).toMatchObject({
      alias: 'Budi kantor',
      username: budi.username,
      email: budi.email,
      phoneMasked: maskPhone(budi.phone),
    });
    expect(response.body.data.recipient).not.toHaveProperty('phone');

    const list = await agent.get('/api/recipients').expect(200);
    expect(list.body.data.recipients).toHaveLength(1);
  });

  it('finds the recipient by an international phone number and stores an empty alias as null', async () => {
    const { agent } = await createLoggedInUser();
    const { user: budi } = await createLoggedInUser();

    const response = await agent
      .post('/api/recipients')
      .send({ identifier: budi.phone.replace(/^0/, '+62'), alias: '' })
      .expect(201);

    expect(response.body.data.recipient).toMatchObject({ username: budi.username, alias: null });
  });

  it('returns 404 for an email that is not registered', async () => {
    const { agent } = await createLoggedInUser();

    const response = await agent
      .post('/api/recipients')
      .send({ identifier: 'nobody@example.com' })
      .expect(404);

    expect(response.body.message).toBe('Penerima tidak ditemukan.');
  });

  it('returns 400 when saving yourself', async () => {
    const { agent, user } = await createLoggedInUser();

    await agent.post('/api/recipients').send({ identifier: user.email }).expect(400);
  });

  it('returns 422 when the recipient is already saved', async () => {
    const { agent } = await createLoggedInUser();
    const { user: budi } = await createLoggedInUser();
    await agent.post('/api/recipients').send({ identifier: budi.email }).expect(201);

    const response = await agent.post('/api/recipients').send({ identifier: budi.phone }).expect(422);

    expect(response.body.errors).toEqual([
      { field: 'identifier', message: 'Penerima sudah ada di daftar.' },
    ]);
    expect(await prisma.savedRecipient.count()).toBe(1);
  });

  it.each([
    [{}, 'Email atau nomor HP penerima wajib diisi.'],
    [{ identifier: 'budi@' }, 'Masukkan email atau nomor HP yang valid.'],
    [{ identifier: '12345' }, 'Masukkan email atau nomor HP yang valid.'],
    [{ identifier: 'budi@example.com', alias: 'x'.repeat(51) }, 'Nama panggilan maksimal 50 karakter.'],
  ])('rejects %j with 422', async (body, expectedMessage) => {
    const { agent } = await createLoggedInUser();

    const response = await agent.post('/api/recipients').send(body).expect(422);

    expect(response.body.errors[0].message).toBe(expectedMessage);
  });

  it('is rejected by the database if someone is ever saved as their own recipient', async () => {
    const { user } = await createLoggedInUser();
    const { id } = await prisma.user.findUniqueOrThrow({ where: { email: user.email } });

    await expect(
      prisma.savedRecipient.create({ data: { ownerUserId: id, recipientUserId: id } }),
    ).rejects.toThrow();
  });
});

describe('ownership', () => {
  it('never shows or deletes the contacts of another user', async () => {
    const { agent: alice } = await createLoggedInUser();
    const { agent: mallory } = await createLoggedInUser();
    const { user: budi } = await createLoggedInUser();

    const saved = await alice.post('/api/recipients').send({ identifier: budi.email }).expect(201);
    const recipientId = saved.body.data.recipient.id;

    const malloryList = await mallory.get('/api/recipients').expect(200);
    expect(malloryList.body.data.recipients).toHaveLength(0);

    await mallory.delete(`/api/recipients/${recipientId}`).expect(404);
    expect(await prisma.savedRecipient.count()).toBe(1);
  });
});

describe('DELETE /api/recipients/:id', () => {
  it('removes the contact', async () => {
    const { agent } = await createLoggedInUser();
    const { user: budi } = await createLoggedInUser();
    const saved = await agent.post('/api/recipients').send({ identifier: budi.email }).expect(201);

    await agent.delete(`/api/recipients/${saved.body.data.recipient.id}`).expect(200);

    const list = await agent.get('/api/recipients').expect(200);
    expect(list.body.data.recipients).toHaveLength(0);
  });

  it('returns 422 for an id that is not a uuid', async () => {
    const { agent } = await createLoggedInUser();

    await agent.delete('/api/recipients/abc').expect(422);
  });

  it('disappears when the recipient account is deleted', async () => {
    const { agent } = await createLoggedInUser();
    const { user: budi } = await createLoggedInUser();
    await agent.post('/api/recipients').send({ identifier: budi.email }).expect(201);

    await prisma.user.delete({ where: { email: budi.email } });

    const list = await agent.get('/api/recipients').expect(200);
    expect(list.body.data.recipients).toHaveLength(0);
  });
});
