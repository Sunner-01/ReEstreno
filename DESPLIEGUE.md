# Despliegue de ReEstreno

## Repositorios y ramas

Crear **un repositorio GitHub vacío** llamado `ReEstreno` bajo `Sunner-01`, con ramas `main` y `dev`. No agregar README desde GitHub: el proyecto ya tiene uno. Crear **dos repositorios públicos de Docker Hub** bajo `sunner01`: `reestreno-backend` y `reestreno-frontend`.

Un push a `dev` ejecuta 11 pruebas unitarias, 11 de integración y 9 E2E. Un push a `main` repite las pruebas, publica ambas imágenes con etiquetas `latest` y SHA del commit, aplica Terraform y despliega por SSH con Ansible. El workflow también admite ejecución manual. La VM utiliza Ubuntu 24.04, 1 OCPU, 2 GB de RAM y la shape **VM.Standard.E5.Flex, de pago**. Seguirá encendida y cobrando hasta que se ejecute `ReEstreno - eliminar VM de pago` en Actions.

## Requisitos previos

- Una cuenta OCI con permiso para administrar Compute, Networking y objetos del bucket de estado. El bucket debe existir antes del primer push a `main`; puede reutilizarse `terraform-estado-practica` con la clave de estado exclusiva `reestreno/terraform.tfstate`. Activar versionado del bucket para recuperar estados anteriores.
- Una clave de API OCI PEM, con su usuario OCID y fingerprint registrados en OCI.
- Un par SSH separado para la VM: clave privada para Actions y clave pública para el metadata de la instancia. Nunca subir la clave privada al repositorio.
- Dos repositorios Docker Hub **públicos** y un access token con permiso de escritura sobre ellos.
- Proyecto Supabase Cloud activo. La URL y la clave `anon`/`publishable` son públicas; **no** cargar `service_role` en GitHub Actions ni en imágenes.
- Para el punto extra Cloudflare: un dominio propio añadido a Cloudflare, una zona activa y un API token con permisos **Zone DNS Edit** y **Zone Settings Edit**. La configuración DNS y Full (strict) se realiza durante el despliegue.

## GitHub Actions: Repository secrets

En `Settings > Secrets and variables > Actions > Secrets` crear estos nombres exactos:

| Nombre | Contenido |
| --- | --- |
| `DOCKERHUB_TOKEN` | Access token Docker Hub con escritura. |
| `OCI_API_KEY_PEM` | Contenido completo del archivo PEM de la API OCI. |
| `OCI_TENANCY_OCID` | OCID de la tenencia. |
| `OCI_COMPARTMENT_OCID` | OCID del compartimento donde se creará la VM y la red; puede ser el de la tenencia si se usa el compartimento raíz. |
| `OCI_USER_OCID` | OCID del usuario dueño de la clave API. |
| `OCI_FINGERPRINT` | Fingerprint de la clave API. |
| `OCI_SSH_PRIVATE_KEY` | Contenido completo de la clave SSH privada para `ubuntu`. |
| `OCI_SSH_PUBLIC_KEY` | Línea completa de la clave SSH pública correspondiente. |
| `CLOUDFLARE_API_TOKEN` | Solo si se configura `APP_DOMAIN`. |
| `CLOUDFLARE_ZONE_ID` | Solo si se configura `APP_DOMAIN`. |

## GitHub Actions: Repository variables

En la pestaña `Variables` crear:

| Nombre | Valor |
| --- | --- |
| `OCI_REGION` | `sa-saopaulo-1` si se usa la región del proyecto anterior. |
| `OCI_STATE_BUCKET` | `terraform-estado-practica` si se reutiliza ese bucket. |
| `OCI_NAMESPACE` | Namespace del bucket OCI; en la práctica anterior era `gr23tbuggx3b`. Confirmar que sigue siendo la misma tenencia. |
| `SUPABASE_URL` | URL HTTPS del proyecto Supabase Cloud, tomada de `.env` local. |
| `SUPABASE_ANON_KEY` | Clave pública `anon`/`publishable` del mismo proyecto Supabase. |
| `APP_DOMAIN` | Opcional hasta tener dominio, por ejemplo `reestreno.ejemplo.com`. Sin esta variable, la web estará en `http://IP_PUBLICA` y Cloudflare/HTTPS no se activará. |
| `OCI_AVAILABILITY_DOMAIN` | Opcional; AD concreto si OCI no ofrece capacidad en el primero. |

La clave `SUPABASE_SERVICE_ROLE_KEY` queda solo en el equipo local para seed y pruebas. No se copia al servidor ni se publica en Docker Hub. Los archivos `.env`, PEM y los SQL con contraseñas Cloud están excluidos de Git.

## Cómo copiar valores sin mostrarlos en pantalla

En PowerShell, desde `D:\PSIII-Pr\ReEstreno`, sustituir la ruta PEM por la real:

```powershell
Get-Content 'C:\ruta\a\oci_api_key.pem' -Raw | Set-Clipboard
Get-Content 'C:\ruta\a\reestreno_ssh' -Raw | Set-Clipboard
Get-Content 'C:\ruta\a\reestreno_ssh.pub' -Raw | Set-Clipboard
((Get-Content .env | Where-Object { $_ -match '^SUPABASE_URL=' }) -replace '^SUPABASE_URL=', '') | Set-Clipboard
((Get-Content .env | Where-Object { $_ -match '^SUPABASE_ANON_KEY=' }) -replace '^SUPABASE_ANON_KEY=', '') | Set-Clipboard
```

Ejecutar **un comando a la vez** y pegar inmediatamente en el secreto o variable correspondiente. No incluir comillas adicionales.

## Qué hace la infraestructura

Terraform crea VCN, Internet Gateway, tabla de rutas, subred pública, reglas de ingreso SSH/HTTP/HTTPS y VM Ubuntu 24.04 con IP pública. El estado se guarda y bloquea en OCI Object Storage para que los siguientes pushes actualicen la misma VM.

Ansible instala Git, Docker Engine y Compose, añade reglas persistentes de iptables para 22/80/443, descarga las imágenes desde Docker Hub y levanta backend, frontend y Caddy. Sin dominio, Caddy sirve HTTP en el puerto 80. Con dominio, el workflow crea primero un registro DNS sin proxy, espera un certificado HTTPS válido y activa el proxy de Cloudflare con Full (strict).

El primer despliegue puede tardar por el arranque de OCI, instalación de Docker y propagación DNS. Revisar en Actions los pasos `Obtener IP pública`, `Instalar Docker y desplegar con Ansible` y `Verificar sitio público`.

## Eliminar la VM de pago

En GitHub Actions abrir `ReEstreno - eliminar VM de pago`, pulsar `Run workflow` y escribir exactamente `ELIMINAR_REESTRENO`. El flujo destruye la VM y su red con el mismo estado remoto; si el DNS Cloudflare aún apunta a esa IP, también lo elimina. No ejecutar de nuevo el flujo de despliegue en `main` después de destruir, salvo que se quiera crear otra VM de pago.
