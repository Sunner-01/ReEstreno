import { describe, it, expect } from 'vitest';
import {
  validateListing,
  assertOwner,
  validateReview,
  whatsappLink,
} from '../../backend/src/domain/listing';
const valid = {
  title: 'Cámara Canon',
  description: 'Una cámara muy cuidada con lente y correa originales.',
  price: 1200.125,
  category: 'Tecnología',
  condition: 'Buen estado',
  city: 'La Paz',
  images: ['/images/camera.jpg'],
};
describe('Reglas de publicación y confianza', () => {
  it('normaliza el título y redondea el precio', () => {
    expect(validateListing({ ...valid, title: '  Cámara Canon  ' })).toMatchObject({
      title: 'Cámara Canon',
      price: 1200.13,
    });
  });
  it('rechaza precios negativos', () => {
    expect(() => validateListing({ ...valid, price: -1 })).toThrow('precio');
  });
  it('rechaza publicaciones sin fotos', () => {
    expect(() => validateListing({ ...valid, images: [] })).toThrow('fotos');
  });
  it('rechaza más de cinco fotos', () => {
    expect(() => validateListing({ ...valid, images: Array(6).fill('x') })).toThrow('fotos');
  });
  it('rechaza categorías no admitidas', () => {
    expect(() => validateListing({ ...valid, category: 'Inventada' })).toThrow('categoría');
  });
  it('impide editar publicaciones ajenas', () => {
    expect(() => assertOwner('seller', 'intruder')).toThrow('vendedor');
  });
  it('rechaza calificaciones fuera de escala', () => {
    expect(() => validateReview(6, 'Una entrega muy buena')).toThrow('calificación');
  });
  it('normaliza una reseña válida', () => {
    expect(validateReview(5, '  Todo fue muy bien  ')).toEqual({
      rating: 5,
      comment: 'Todo fue muy bien',
    });
  });
  it('codifica el objeto y enlace en el contacto de WhatsApp', () => {
    const url = new URL(
      whatsappLink('59170000000', 'Cámara & lente', 'https://example.com/objeto/1'),
    );
    expect(url.hostname).toBe('wa.me');
    expect(url.searchParams.get('text')).toContain('Cámara & lente');
    expect(url.searchParams.get('text')).toContain('https://example.com/objeto/1');
  });
  it('omite la dirección local del mensaje de WhatsApp', () => {
    const url = new URL(
      whatsappLink('59170000000', 'Libros para una tarde sin prisa', 'http://localhost:4310/objeto/1'),
    );
    expect(url.searchParams.get('text')).toBe(
      'Hola, vi "Libros para una tarde sin prisa" en ReEstreno. ¿Sigue disponible?',
    );
  });
  it('no incorpora campos privilegiados enviados por el cliente', () => {
    expect(
      validateListing({ ...valid, seller_id: 'intruder', hidden: false } as typeof valid),
    ).not.toHaveProperty('seller_id');
  });
});
