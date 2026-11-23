'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';
import { cities } from '../../lib/types';
export default function Access() {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);
  const router = useRouter();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    const data = new FormData(e.currentTarget);
    const email = String(data.get('email'));
    const password = String(data.get('password'));
    try {
      if (register) {
        const { data: result, error } = await supabase().auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + '/cuenta' },
        });
        if (error) throw error;
        if (!result.session) {
          setMessage(
            'Revisa tu correo para confirmar tu cuenta. Después ingresa y completa tu perfil.',
          );
          return;
        }
        await api('/me', {
          method: 'PATCH',
          body: JSON.stringify({
            name: data.get('name'),
            city: data.get('city'),
            whatsapp: data.get('whatsapp'),
            bio: '',
          }),
        });
      } else {
        const { error } = await supabase().auth.signInWithPassword({ email, password });
        if (error) throw new Error('El correo o la contraseña no coinciden.');
      }
      router.push('/cuenta');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout container">
      <div className="auth-story">
        <h1>
          Algo termina.
          <br />
          <span>Otra historia empieza.</span>
        </h1>
        <img src="/images/chair.jpg" alt="Un sillón listo para encontrar un nuevo hogar" />
        <p>Una misma cuenta para encontrar, vender y dar otra oportunidad.</p>
      </div>
      <section className="auth-form">
        <h2>{register ? 'Tu siguiente historia empieza aquí' : 'Qué bueno verte de nuevo'}</h2>
        <p>
          {register
            ? 'Crea tu cuenta y dale otra vuelta a lo que ya no usas.'
            : 'Ingresa para guardar hallazgos y gestionar tus publicaciones.'}
        </p>
        <div className="tabs">
          <button
            className={!register ? 'active' : ''}
            onClick={() => {
              setRegister(false);
              setError('');
            }}
          >
            Ingresar
          </button>
          <button
            className={register ? 'active' : ''}
            onClick={() => {
              setRegister(true);
              setError('');
            }}
          >
            Crear cuenta
          </button>
        </div>
        <form onSubmit={submit} className="form-stack">
          {register && (
            <>
              <label>
                Tu nombre
                <input name="name" required maxLength={60} autoComplete="name" />
              </label>
              <div className="form-row">
                <label>
                  Ciudad
                  <select name="city">
                    {cities.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  WhatsApp
                  <input
                    name="whatsapp"
                    aria-label="WhatsApp"
                    required
                    pattern="[0-9]{8,15}"
                    placeholder="59170000000"
                    autoComplete="tel"
                  />
                  <small>Incluye el código de país, sin +.</small>
                </label>
              </div>
            </>
          )}
          <label>
            Correo electrónico
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Contraseña
            <div className="password-field">
              <input
                name="password"
                aria-label="Contraseña"
                type={show ? 'text' : 'password'}
                minLength={8}
                required
                autoComplete={register ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {register && <small>Usa al menos 8 caracteres.</small>}
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="notice" role="status">
              {message}
            </p>
          )}
          <button disabled={busy} className="button full">
            {busy ? 'Un momento…' : register ? 'Crear mi cuenta' : 'Ingresar'}
            <ArrowRight size={18} />
          </button>
        </form>
        <p className="fineprint">
          Tu WhatsApp se comparte al coordinar una compra. No gestionamos pagos ni envíos.
        </p>
      </section>
    </div>
  );
}
