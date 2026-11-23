# ReEstreno

Marketplace de objetos usados con Next.js, NestJS y Supabase. Las compras se coordinan por WhatsApp; no procesa pagos ni tiene carrito.

## Ejecutar en local

Requisitos: Node.js 22, npm y Docker Desktop con contenedores Linux.

```powershell
cd D:\PSIII-Pr\ReEstreno
npm ci
npm run db:start
npm run db:migrate
npm run local:setup
npm run seed
npm run dev
```

- Web: http://localhost:4310
- API en desarrollo: http://localhost:4311/health
- API a través de la web (también con Docker): http://localhost:4310/api/health
- Supabase Studio local: http://127.0.0.1:54323

Los puertos 4310 y 4311 evitan interferir con otros proyectos. Supabase usa 54321–54324.

`local:setup` escribe las claves locales en `.env` y `frontend/.env.local`, excluidos de Git. La clave privilegiada se usa exclusivamente para preparar datos y limpiar pruebas; no se incorpora al frontend ni a la API de la aplicación.

## Cuentas de demostración

| Uso | Correo | Contraseña local |
| --- | --- | --- |
| Vendedor | ana@reestreno.local | ReEstreno2026! |
| Comprador | leo@reestreno.local | ReEstreno2026! |
| Moderación | moderacion@reestreno.local | ReEstreno2026! |

Son cuentas exclusivas de desarrollo. El seed rechaza servidores externos. Las publicaciones y fotografías de ejemplo no representan ventas reales. No envíes mensajes al número de ejemplo; reemplázalo en Mi perfil si deseas probar el contacto real.

## Funcionalidad

Registro e ingreso, perfil con foto y WhatsApp privado, catálogo con búsqueda y filtros, publicaciones con hasta cinco fotos, edición y eliminación propias, favoritos, contacto por WhatsApp, entrega confirmada por ambas partes y una reseña por compra, reportes y moderación.

Para probar una compra: ingresa como comprador, abre una publicación y coordina el contacto. Como vendedor, confirma la entrega a ese comprador desde **Mi espacio → Compras y ventas**. Como comprador, confirma la recepción y publica la reseña. El objeto queda vendido. No se afirma que el pago esté verificado.

## Arquitectura

- `backend/src/domain`: reglas puras y contrato del repositorio.
- `backend/src/application`: casos de uso de publicaciones.
- `backend/src/infrastructure`: adaptador Supabase.
- `backend/src/presentation`: endpoints y autenticación.
- `frontend/app`: rutas Next.js.
- `frontend/components`: interfaz y formularios.
- `frontend/lib`: cliente API, sesión y tipos de presentación.
- `supabase/migrations`: esquema, permisos, políticas RLS, funciones transaccionales y almacenamiento.

La API valida sesiones con Supabase Auth. Las operaciones de datos usan el token del usuario y RLS; no una clave que eluda las políticas. Las confirmaciones de entrega son transacciones SQL con comprobación de identidad. El comprador no puede calificar hasta que ambas partes confirmen.

## Comprobaciones

```powershell
npm run typecheck
npm run build
npm run test:unit
npm run test:integration
npx playwright install chromium
npm run test:e2e
```

Las pruebas de integración y E2E necesitan Supabase local iniciado, migraciones aplicadas y datos de demostración. Crean usuarios aislados y limpian sus registros. Las E2E interceptan la navegación externa de WhatsApp y no envían mensajes.

## Docker local

Detén `npm run dev` antes de usar el mismo puerto desde Docker:

```powershell
docker compose up --build -d
docker compose ps
docker compose down
```

Docker utiliza la configuración actual de `.env` y `frontend/.env.local`. Si apuntan a Supabase Cloud, los contenedores usan el proyecto remoto; si apuntan a Supabase local, este debe estar iniciado. No ejecutes el seed de demostración en producción.

Con Docker la API no expone un puerto adicional al equipo: Next.js la alcanza por la red interna. Para volver a editar con recarga automática, ejecuta `docker compose down` y después `npm run dev`.

## Automatización

`dev` ejecuta las pruebas unitarias, de integración y E2E. `main` repite las pruebas, publica dos imágenes en Docker Hub, crea la infraestructura OCI con Terraform y configura la VM con Ansible. La guía para crear el repositorio, cargar secretos y activar Cloudflare está en [DESPLIEGUE.md](DESPLIEGUE.md). Una VM E5.Flex genera cargos hasta ejecutar el flujo manual de eliminación.

Las fuentes de fotografías están en `frontend/public/images/sources.json`.
