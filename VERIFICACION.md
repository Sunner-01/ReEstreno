# Verificación local

Comprobado el 23 de noviembre de 2026.

| Comprobación | Resultado |
| --- | --- |
| TypeScript frontend y backend | Correcto |
| Compilación de ambas imágenes Docker | Correcto |
| Pruebas unitarias | 11 aprobadas |
| Integración NestJS con Supabase local | 11 aprobadas |
| E2E Chromium con Next y Nest locales y Supabase local | 9 aprobadas |
| API por la web `/api/health` | HTTP 200 |
| Supabase Security Advisors | Sin hallazgos |
| Captura escritorio 1440 px y móvil 390 px | Sin errores JS, imágenes rotas ni desbordamiento horizontal |

Las E2E cubren búsqueda, categorías, acceso protegido, registro, publicación con imagen y edición, foto de perfil, favoritos, coordinación de compra con confirmación y reseña, y catálogo móvil. La navegación a WhatsApp se intercepta: no se envían mensajes.

Las capturas están en `.impeccable/review`. El informe de Playwright está en `playwright-report/index.html` y se regenera al ejecutar las pruebas.

Las pruebas automatizadas usan Supabase local para aislar los datos. Tras ejecutarlas, se restauró la configuración de Supabase Cloud: los dos contenedores arrancaron, la web devolvió HTTP 200, el catálogo remoto devolvió ocho publicaciones y el inicio de sesión de demostración recuperó su perfil. Los workflows para `dev` y `main`, Terraform y Ansible se validaron estáticamente. Falta crear el remoto GitHub, cargar secretos y verificar una ejecución real de Actions, OCI y Cloudflare.
