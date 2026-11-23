'use client';
import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { Plus, ArrowUpRight, Trash2, Pencil, Check, Star, Camera } from 'lucide-react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuth } from './auth-provider';
import { Avatar } from './avatar';
import { Profile, Listing, Trade, cities, money, statusLabel } from '../lib/types';
export function Account() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<Listing[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tab, setTab] = useState('publicaciones');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState('');
  const [reviewId, setReviewId] = useState('');
  async function load() {
    try {
      const [l, t] = await Promise.all([
        api<Listing[]>('/me/listings'),
        api<Trade[]>('/me/trades'),
      ]);
      setItems(l);
      setTrades(t);
      try {
        setProfile(await api<Profile>('/me'));
      } catch {
        setTab('perfil');
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    if (user) load();
  }, [user]);
  async function action(path: string, body?: unknown, method = 'POST') {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await api(path, { method, ...(body ? { body: JSON.stringify(body) } : {}) });
      setNotice('Cambios guardados.');
      await load();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await action('/me', Object.fromEntries(new FormData(e.currentTarget)), 'PATCH');
  }
  async function uploadAvatar(file?: File) {
    if (!file || !user) return;
    setError('');
    setNotice('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError('La foto debe ser JPG, PNG o WEBP y pesar hasta 2 MB.');
      return;
    }
    setUploadingAvatar(true);
    try {
      const path = `${user.id}/avatar`;
      const bucket = supabase().storage.from('profile-avatars');
      const { error: uploadError } = await bucket.upload(path, file, {
        contentType: file.type,
        cacheControl: '60',
        upsert: true,
      });
      if (uploadError) throw uploadError;
      const avatarUrl = `${bucket.getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
      const updated = await api<Profile>('/me/avatar', {
        method: 'PATCH',
        body: JSON.stringify({ avatarUrl }),
      });
      setProfile(updated);
      setNotice('Foto de perfil actualizada.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploadingAvatar(false);
    }
  }
  async function removeAvatar() {
    if (!user) return;
    setUploadingAvatar(true);
    setError('');
    setNotice('');
    try {
      const { error: removeError } = await supabase()
        .storage.from('profile-avatars').remove([`${user.id}/avatar`]);
      if (removeError) throw removeError;
      setProfile(await api<Profile>('/me/avatar', {
        method: 'PATCH',
        body: JSON.stringify({ avatarUrl: null }),
      }));
      setNotice('Foto de perfil eliminada.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploadingAvatar(false);
    }
  }
  return (
    <>
      <div className="section-heading">
        <div>
          <h1>Tu espacio, {profile?.name.split(' ')[0] || 'tu próxima historia'}.</h1>
          <p className="lead">Lo que vendes, lo que encuentras y lo que vuelve a empezar.</p>
        </div>
        <Link href="/publicar" className="button">
          <Plus size={18} />
          Publicar objeto
        </Link>
      </div>
      <div className="tabs account-tabs">
        <button
          className={tab === 'publicaciones' ? 'active' : ''}
          onClick={() => setTab('publicaciones')}
        >
          Mis publicaciones ({items.length})
        </button>
        <button className={tab === 'compras' ? 'active' : ''} onClick={() => setTab('compras')}>
          Compras y ventas
        </button>
        <button className={tab === 'perfil' ? 'active' : ''} onClick={() => setTab('perfil')}>
          Mi perfil
        </button>
        {profile?.moderator && <Link href="/moderacion">Moderación</Link>}
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      {tab === 'publicaciones' &&
        (items.length ? (
          <div className="manage-list">
            {items.map((item) => (
              <article className="manage-row" key={item.id}>
                <Link href={`/objeto/${item.id}`}>
                  <img src={item.images[0]} alt={item.title} />
                </Link>
                <div>
                  <span className={`status ${item.status}`}>{statusLabel[item.status]}</span>
                  <Link href={`/objeto/${item.id}`}>
                    <h3>{item.title}</h3>
                  </Link>
                  <p>
                    {money(item.price)} · {item.city}
                  </p>
                </div>
                <div className="row-actions">
                  <Link className="button secondary small" href={`/editar/${item.id}`}>
                    <Pencil size={16} />
                    Editar
                  </Link>
                  {confirmDelete === item.id ? (
                    <>
                      <button
                        className="button danger small"
                        disabled={busy}
                        onClick={async () => {
                          if (await action(`/listings/${item.id}`, undefined, 'DELETE'))
                            setConfirmDelete('');
                        }}
                      >
                        Sí, eliminar
                      </button>
                      <button className="text-link" onClick={() => setConfirmDelete('')}>
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      className="icon-link"
                      aria-label={`Eliminar ${item.title}`}
                      onClick={() => setConfirmDelete(item.id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty">
            <h2>Tu primera publicación está por llegar</h2>
            <p>Busca ese objeto que ya no usas y dale una nueva oportunidad.</p>
            <Link href="/publicar" className="button">
              Publicar mi primer objeto <ArrowUpRight size={18} />
            </Link>
          </div>
        ))}
      {tab === 'perfil' && (
        <form onSubmit={save} className="form-stack profile-form" key={profile?.id || 'new'}>
          <h2>Así te verá la comunidad</h2>
          <div className="profile-photo-editor">
            <Avatar name={profile?.name || user?.email || 'Tu perfil'} url={profile?.avatar_url} large />
            <div>
              <strong>Foto de perfil</strong>
              <p>Una foto tuya ayuda a que te reconozcan al coordinar una compra.</p>
              <label className="avatar-upload">
                <Camera size={16} /> {uploadingAvatar ? 'Subiendo foto…' : 'Elegir foto'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploadingAvatar || !profile}
                  onChange={async (e) => {
                    const input = e.currentTarget;
                    await uploadAvatar(input.files?.[0]);
                    input.value = '';
                  }}
                />
              </label>
              {profile?.avatar_url && (
                <button type="button" className="text-link" disabled={uploadingAvatar} onClick={removeAvatar}>
                  Quitar foto
                </button>
              )}
              <small>JPG, PNG o WEBP · Máximo 2 MB</small>
            </div>
          </div>
          <label>
            Nombre
            <input name="name" required maxLength={60} defaultValue={profile?.name} />
          </label>
          <div className="form-row">
            <label>
              Ciudad
              <select name="city" defaultValue={profile?.city}>
                {cities.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              WhatsApp
              <input
                name="whatsapp"
                required
                pattern="[0-9]{8,15}"
                placeholder="59170000000"
                defaultValue={profile?.whatsapp}
              />
              <small>Con código de país y sin +. Se comparte al coordinar una compra.</small>
            </label>
          </div>
          <label>
            Sobre ti
            <textarea
              name="bio"
              rows={3}
              maxLength={300}
              defaultValue={profile?.bio}
              placeholder="Unas palabras para que te conozcan."
            />
          </label>
          <button disabled={busy} className="button">
            {busy ? 'Guardando…' : 'Guardar perfil'}
          </button>
          <button type="button" className="text-link" onClick={signOut}>
            Cerrar sesión
          </button>
        </form>
      )}
      {tab === 'compras' && (
        <section>
          <p className="notice">
            Después de acordar por WhatsApp, el vendedor confirma a quién entregó el objeto. El
            comprador confirma que lo recibió y puede dejar una reseña.
          </p>
          {!trades.length ? (
            <div className="empty">
              <h2>Las buenas historias empiezan conversando</h2>
              <p>Tus contactos y entregas aparecerán aquí.</p>
            </div>
          ) : (
            trades.map((trade) => {
              const seller = trade.seller_id === user?.id;
              return (
                <article className="trade-row" key={trade.id}>
                  <img src={trade.listing.images[0]} alt={trade.listing.title} />
                  <div className="trade-content">
                    <span className="status">{statusLabel[trade.status]}</span>
                    <h3>{trade.listing.title}</h3>
                    <p>
                      {seller ? `Comprador: ${trade.buyer.name}` : `Vendedor: ${trade.seller.name}`}{' '}
                      · {money(trade.listing.price)}
                    </p>
                    {seller && trade.status === 'interested' && (
                      <button
                        disabled={busy}
                        className="button small"
                        onClick={() => action(`/trades/${trade.id}/accept`)}
                      >
                        <Check size={16} />
                        Confirmar entrega a esta persona
                      </button>
                    )}
                    {!seller && trade.status === 'pending' && (
                      <button
                        disabled={busy}
                        className="button small"
                        onClick={() => action(`/trades/${trade.id}/confirm`)}
                      >
                        Confirmar que recibí el objeto
                      </button>
                    )}
                    {!seller && trade.status === 'completed' && !trade.reviews && (
                      <button className="text-link" onClick={() => setReviewId(trade.id)}>
                        <Star size={17} />
                        Calificar vendedor
                      </button>
                    )}
                    {trade.reviews && <span className="muted">Reseña publicada</span>}
                    {reviewId === trade.id && (
                      <form
                        className="form-stack review-form"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const form = new FormData(e.currentTarget);
                          if (
                            await action(`/trades/${trade.id}/review`, {
                              rating: Number(form.get('rating')),
                              comment: form.get('comment'),
                            })
                          )
                            setReviewId('');
                        }}
                      >
                        <label>
                          Calificación
                          <select name="rating">
                            {[5, 4, 3, 2, 1].map((n) => (
                              <option key={n} value={n}>
                                {n} de 5
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Tu experiencia
                          <textarea name="comment" minLength={10} maxLength={500} required />
                        </label>
                        <button disabled={busy} className="button small">
                          Publicar reseña
                        </button>
                      </form>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </section>
      )}
    </>
  );
}
