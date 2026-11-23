'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  ArrowUpRight,
  ArrowRight,
  SlidersHorizontal,
  Laptop,
  Armchair,
  Shirt,
  Bike,
  Music2,
  BookOpen,
  Shapes,
  X,
} from 'lucide-react';
import { Listing, categories, cities, conditions } from '../lib/types';
import { api } from '../lib/api';
import { ListingCard } from '../components/listing-card';
const icons = [Laptop, Armchair, Shirt, Bike, Music2, BookOpen, Shapes];
export default function Home() {
  const [items, setItems] = useState<Listing[]>([]);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [condition, setCondition] = useState('');
  const [max, setMax] = useState('');
  const [sort, setSort] = useState('recent');
  const [filters, setFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams({ q: search, category, city, condition, max, sort });
    api<Listing[]>(`/listings?${params}`)
      .then((data) => {
        if (active) {
          setItems(data);
          setError('');
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [search, category, city, condition, max, sort]);
  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <h1>
            Lo bueno merece
            <br />
            <span>otra vuelta.</span>
          </h1>
          <p>
            Eso que buscas ya tiene una historia.
            <br />
            Encuéntralo, hazlo tuyo y empieza la siguiente.
          </p>
          <form
            className="search-box"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(q);
              document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <Search size={21} />
            <input
              aria-label="Buscar objetos"
              placeholder="¿Qué quieres reestrenar?"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button type="submit" aria-label="Buscar">
              <ArrowRight size={23} />
            </button>
          </form>
          <div className="search-hints">
            Prueba con{' '}
            <button
              onClick={() => {
                setQ('cámara');
                setSearch('cámara');
              }}
            >
              una cámara
            </button>
            ,{' '}
            <button
              onClick={() => {
                setCategory('Hogar');
              }}
            >
              algo para tu casa
            </button>{' '}
            o una nueva afición.
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-photo">
            <img src="/images/chair.jpg" alt="Sillón de madera y cuero en un interior luminoso" />
            <span className="photo-note">
              Con historia.
              <br />
              <strong>Con mucho por vivir.</strong>
            </span>
          </div>
          <div className="hero-small-photo">
            <img src="/images/camera.jpg" alt="Cámara fotográfica de segunda mano" />
            <span>
              Tu próximo hallazgo <ArrowUpRight size={19} />
            </span>
          </div>
          <span className="round-seal">
            Otra vida.
            <br />
            Mismo encanto.
          </span>
        </div>
      </section>
      <section className="catalog-section container" id="catalogo">
        <div className="section-heading">
          <div>
            <h2>Encuentra tu próximo estreno</h2>
            <p>Objetos que todavía tienen mucho que dar.</p>
          </div>
          <Link href="/publicar" className="text-link">
            Dale otra vuelta a lo tuyo <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="categories" role="group" aria-label="Categorías">
          <button className={!category ? 'active' : ''} onClick={() => setCategory('')}>
            <Shapes size={18} />
            Todo
          </button>
          {categories.map((name, i) => {
            const Icon = icons[i];
            return (
              <button
                key={name}
                className={category === name ? 'active' : ''}
                onClick={() => setCategory(name)}
              >
                <Icon size={18} />
                {name}
              </button>
            );
          })}
        </div>
        <div className="catalog-tools">
          <span aria-live="polite">
            {loading
              ? 'Buscando hallazgos…'
              : `${items.length} objetos${category ? ` en ${category}` : ' para descubrir'}`}
          </span>
          <div>
            <button
              className="filter-button"
              onClick={() => setFilters(!filters)}
              aria-expanded={filters}
            >
              <SlidersHorizontal size={17} />
              Filtros
            </button>
            <select
              aria-label="Ordenar objetos"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="recent">Más recientes</option>
              <option value="price">Menor precio</option>
            </select>
          </div>
        </div>
        {filters && (
          <div className="filter-panel">
            <label>
              Ciudad
              <select value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">Todas las ciudades</option>
                {cities.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Estado
              <select value={condition} onChange={(e) => setCondition(e.target.value)}>
                <option value="">Cualquier estado</option>
                {conditions.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Precio máximo (Bs)
              <input
                type="number"
                min="1"
                value={max}
                onChange={(e) => setMax(e.target.value)}
                placeholder="Sin límite"
              />
            </label>
            <button
              className="text-link"
              onClick={() => {
                setCity('');
                setCondition('');
                setMax('');
                setSearch('');
                setQ('');
                setCategory('');
              }}
            >
              <X size={16} />
              Limpiar filtros
            </button>
          </div>
        )}
        {search && (
          <p className="search-result">
            Resultados para “{search}”{' '}
            <button
              aria-label="Quitar búsqueda"
              onClick={() => {
                setSearch('');
                setQ('');
              }}
            >
              <X size={16} />
            </button>
          </p>
        )}
        {error ? (
          <div role="alert" className="empty">
            <h3>No pudimos cargar el catálogo</h3>
            <p>{error}</p>
            <button className="button" onClick={() => window.location.reload()}>
              Volver a intentar
            </button>
          </div>
        ) : loading ? (
          <div className="product-grid" aria-label="Cargando catálogo">
            {[1, 2, 3, 4].map((n) => (
              <div className="skeleton" key={n} />
            ))}
          </div>
        ) : items.length ? (
          <div className="product-grid">
            {items.map((item) => (
              <ListingCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <Search size={32} />
            <h3>Tu próximo hallazgo aún no aparece</h3>
            <p>Prueba otra palabra o amplía los filtros.</p>
            <button
              className="button secondary"
              onClick={() => {
                setQ('');
                setSearch('');
                setCategory('');
                setCity('');
                setCondition('');
                setMax('');
              }}
            >
              Ver todos los objetos
            </button>
          </div>
        )}
      </section>
      <section className="sell-strip container">
        <div>
          <h2>¿Lo guardas o le das otra vida?</h2>
          <p>Haz espacio en casa. Alguien está buscando eso que ya no usas.</p>
        </div>
        <Link className="button cream" href="/publicar">
          Publicar mi primer objeto <ArrowUpRight size={20} />
        </Link>
      </section>
    </>
  );
}
