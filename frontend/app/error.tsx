'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty">
      <h1>Algo interrumpió la visita.</h1>
      <p>Vuelve a intentar. Si continúa, comprueba tu conexión.</p>
      <button onClick={reset} className="button">
        Volver a intentar
      </button>
    </div>
  );
}
