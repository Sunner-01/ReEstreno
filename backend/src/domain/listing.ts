export const CATEGORIES = [
  'Tecnología',
  'Hogar',
  'Moda',
  'Deportes',
  'Música',
  'Libros',
  'Otros',
] as const;
export const CONDITIONS = ['Como nuevo', 'Buen estado', 'Con detalles'] as const;
export type ListingStatus = 'available' | 'reserved' | 'sold';
export interface ListingInput {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  city: string;
  images: string[];
}
export class DomainError extends Error {}
export function validateListing(input: ListingInput): ListingInput {
  const title = input.title?.trim();
  if (!title || title.length < 5 || title.length > 90)
    throw new DomainError('El título debe tener entre 5 y 90 caracteres.');
  if (!input.description || input.description.trim().length < 20 || input.description.length > 2000)
    throw new DomainError('Describe el objeto con entre 20 y 2000 caracteres.');
  if (!Number.isFinite(input.price) || input.price < 1 || input.price > 1000000)
    throw new DomainError('El precio debe estar entre Bs 1 y Bs 1.000.000.');
  if (!CATEGORIES.includes(input.category as (typeof CATEGORIES)[number]))
    throw new DomainError('Selecciona una categoría válida.');
  if (!CONDITIONS.includes(input.condition as (typeof CONDITIONS)[number]))
    throw new DomainError('Selecciona el estado del objeto.');
  if (!input.city?.trim() || input.city.length > 60)
    throw new DomainError('Selecciona una ciudad.');
  if (
    !Array.isArray(input.images) ||
    input.images.length < 1 ||
    input.images.length > 5 ||
    input.images.some((x) => typeof x !== 'string' || x.length > 1000)
  )
    throw new DomainError('Agrega entre una y cinco fotos.');
  return {
    title,
    description: input.description.trim(),
    price: Math.round(input.price * 100) / 100,
    category: input.category,
    condition: input.condition,
    city: input.city,
    images: input.images,
  };
}
export function assertOwner(owner: string, actor: string) {
  if (owner !== actor) throw new DomainError('Solo el vendedor puede modificar esta publicación.');
}
export function validateReview(rating: number, comment: string) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    throw new DomainError('La calificación debe estar entre 1 y 5.');
  if (!comment?.trim() || comment.trim().length < 10 || comment.length > 500)
    throw new DomainError('Escribe entre 10 y 500 caracteres.');
  return { rating, comment: comment.trim() };
}
export function whatsappLink(phone: string, title: string, url: string) {
  if (!/^\d{8,15}$/.test(phone)) throw new DomainError('El número de WhatsApp no es válido.');
  const listingUrl = new URL(url);
  const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(listingUrl.hostname);
  const message = `Hola, vi "${title}" en ReEstreno. ¿Sigue disponible?${isLocal ? '' : ` ${url}`}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
