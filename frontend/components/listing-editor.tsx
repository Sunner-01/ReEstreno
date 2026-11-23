'use client';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, ArrowRight, ArrowUpRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import { Listing, categories, cities, conditions } from '../lib/types';
import { useAuth } from './auth-provider';
export function ListingEditor({ id }: { id?: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [item, setItem] = useState<Listing | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (id)
      api<Listing>(`/listings/${id}`)
        .then((x) => {
          setItem(x);
          setImages(x.images);
        })
        .catch((e) => setError(e.message));
  }, [id]);
  async function upload(files: FileList | null) {
    if (!files || !user) return;
    setError('');
    if (files.length + images.length > 5) {
      setError('Puedes agregar hasta cinco fotos.');
      return;
    }
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        if (
          !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
          file.size > 5 * 1024 * 1024
        )
          throw new Error('Usa imágenes JPG, PNG o WEBP de hasta 5 MB.');
        const path = `${user.id}/${crypto.randomUUID()}.${file.type.split('/')[1]}`;
        const { error } = await supabase()
          .storage.from('listing-images')
          .upload(path, file, { contentType: file.type });
        if (error) throw error;
        urls.push(supabase().storage.from('listing-images').getPublicUrl(path).data.publicUrl);
      }
      setImages((old) => [...old, ...urls]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      if (!images.length) throw new Error('Agrega al menos una foto de tu objeto.');
      const data = Object.fromEntries(form);
      const result = await api<Listing>(id ? `/listings/${id}` : '/listings', {
        method: id ? 'PATCH' : 'POST',
        body: JSON.stringify({ ...data, price: Number(data.price), images }),
      });
      router.push(`/objeto/${result.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (id && !item) return <div className="empty">{error || 'Cargando publicación…'}</div>;
  if (item && item.seller_id !== user?.id)
    return (
      <div className="empty">
        <h2>Esta publicación pertenece a otro vendedor.</h2>
      </div>
    );
  return (
    <div className="editor-layout">
      <form className="form-stack editor-form" onSubmit={save}>
        <section>
          <h2>Que entre por los ojos</h2>
          <p>Fotos reales, buena luz y todos los detalles. La primera será la portada.</p>
          <div className="upload-grid">
            {images.map((src, i) => (
              <div className="upload-preview" key={src}>
                <img src={src} alt={`Foto ${i + 1} del objeto`} />
                <button
                  type="button"
                  aria-label={`Quitar foto ${i + 1}`}
                  onClick={() => setImages(images.filter((x) => x !== src))}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="upload-control">
                <Upload size={24} />
                <strong>{uploading ? 'Subiendo…' : 'Agregar fotos'}</strong>
                <small>{images.length}/5 · Hasta 5 MB</small>
                <input
                  aria-label="Fotos del objeto"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={uploading}
                  onChange={(e) => upload(e.target.files)}
                />
              </label>
            )}
          </div>
        </section>
        <section className="form-stack">
          <h2>Cuéntanos sobre tu objeto</h2>
          <label>
            Título
            <input
              name="title"
              placeholder="Ej. Cámara Canon EOS 2000D con lente"
              minLength={5}
              maxLength={90}
              required
              defaultValue={item?.title}
            />
          </label>
          <label>
            Descripción
            <textarea
              name="description"
              rows={5}
              placeholder="Cuánto tiempo lo usaste, cómo está y qué incluye. Cuenta también los detalles que deba conocer su próximo dueño."
              minLength={20}
              maxLength={2000}
              required
              defaultValue={item?.description}
            />
          </label>
          <div className="form-row">
            <label>
              Categoría
              <select name="category" defaultValue={item?.category}>
                {categories.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Estado
              <select name="condition" defaultValue={item?.condition}>
                {conditions.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>
              Precio (Bs)
              <input
                name="price"
                type="number"
                min="1"
                max="1000000"
                step="0.01"
                required
                placeholder="0.00"
                defaultValue={item?.price}
              />
            </label>
            <label>
              Ciudad
              <select name="city" defaultValue={item?.city}>
                {cities.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          </div>
        </section>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button disabled={busy || uploading} className="button">
          {busy ? 'Guardando…' : id ? 'Guardar cambios' : 'Publicar objeto'}
          <ArrowRight size={18} />
        </button>
      </form>
      <aside className="editor-aside">
        <ArrowUpRight className="large-symbol" size={65} aria-hidden="true" />
        <h2>
          Lo que ya no usas,
          <br />
          alguien lo está buscando.
        </h2>
        <p>Un título claro y una descripción honesta ayudan a encontrar a la persona indicada.</p>
        <hr />
        <h3>El siguiente paso es conversar</h3>
        <p>
          Los interesados te contactarán por WhatsApp. Acuerden el lugar de entrega y revisen el
          objeto antes de pagar.
        </p>
        <p className="fineprint">
          Completa tu WhatsApp en Mi espacio antes de publicar. No incluyas direcciones personales
          ni datos bancarios en la descripción.
        </p>
      </aside>
    </div>
  );
}
