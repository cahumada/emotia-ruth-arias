# no-somos-islas

Publicar la landing del recurso gratuito "No somos islas" (ebook y audio reflexivo) en `rutharias.emotia.ar/no-somos-islas/`, fiel al HTML corregido del diseñador, con el registro real de pedidos por correo y la medición con Google Analytics bajo consentimiento.

La página agrega textos visibles, recibe datos personales y envía correos. No hay historia de tablero: se sigue sin ella por decisión explícita del desarrollador (2026-11-23). DW Review corre antes del cierre.

## Specs

### Pedido original

- Implementar el HTML `No_somos_islas.html` (versión corregida) como página nueva del sitio.
- La página tiene un envío de mail y debe usar el mismo criterio que la página principal.
- Antes de publicar hay que:
  1. Conectar el formulario para guardar los emails y el consentimiento opcional para recibir novedades.
  2. Configurar Google Analytics para medir registros, descargas y reproducciones del audio.
  3. Publicar la página en `rutharias.emotia.ar/no-somos-islas/`.
  4. Verificar el QR del ebook y el enlace directo al audio.
  5. Optimizar los archivos para que el ebook y el audio carguen rápidamente.

### Alcance

- Dentro: la ruta `/no-somos-islas` con los textos, colores, tipografía y archivos del HTML corregido; el pedido de acceso por correo con el criterio del formulario de novedades de la home; el aviso de consentimiento y Google Analytics 4 en todo el sitio; los eventos de esta página; la verificación de los enlaces del ebook; la entrega eficiente del PDF, el audio y la portada.
- Fuera: el despliegue en Vercel y la configuración del dominio (los hace el desarrollador al mergear); los valores de las variables de entorno; un límite de tasa del formulario (tampoco lo tiene la home); la lectura del QR con un teléfono real (prueba manual del desarrollador antes de distribuir el ebook); una política de privacidad.

### Comportamiento de la página

- La página muestra los textos del HTML corregido sin cambios, salvo el aviso de demo, que se reemplaza (RN-D04).
- Título: "No somos islas · Ebook gratuito y audio | Ruth Arias". Descripción: "No somos islas. Ebook gratuito y audio reflexivo de Ruth Arias, psicóloga clínica.". Color de tema `#512681`. Indexable, como el resto del sitio.
- La marca del encabezado, "Página profesional ↗" y "Conocer mi página profesional ↗" abren `https://rutharias.emotia.ar/` en una pestaña nueva.
- Al cargar, el formulario de acceso está visible; la descarga del ebook, el enlace "Ya lo leí · Ir al audio" y la sección de audio están ocultos.
- Los recursos se habilitan solo cuando el servidor confirma el pedido (ver "Pedido de acceso").
- Si la URL trae `#audio` y además `utm_medium=qr`, `utm_medium=pdf_link` u `origen=ebook`, la página se abre con el acceso habilitado, sin formulario, y desplazada a la sección de audio.
- `https://rutharias.emotia.ar/no-somos-islas/?utm_source=ebook&utm_medium=qr&utm_campaign=no_somos_islas#audio` y la variante con `utm_medium=pdf_link` (los dos enlaces que trae el PDF) terminan en la sección de audio habilitada, aunque la URL tenga la barra final.
- El audio no se reproduce solo y se carga con `preload="metadata"`.
- La descarga entrega el PDF de 21 páginas del HTML corregido con el nombre `No_somos_islas_Ruth_Arias.pdf`.

### Pedido de acceso

Mismo criterio que el formulario de novedades de la home: acción de servidor pública, validación en el servidor, campo trampa, sin persistencia, dos correos por Resend y falla cerrada sin configuración.

- Al enviar, el servidor manda primero un aviso a la bandeja de Emotia (`RESEND_TO`) y, si se aceptó, una confirmación a la persona. Si cualquiera de los dos falla, la persona ve el error y los recursos no se habilitan.
- Aviso a la bandeja, asunto "Nuevo pedido de No somos islas":

  ```text
  Correo: <correo>
  Fecha UTC: <fecha ISO>
  Recurso: No somos islas
  Novedades: Sí | No
  ```

- Confirmación a la persona, asunto "Tu ebook y audio de No somos islas":

  ```text
  Gracias por pedir "No somos islas".

  Ebook: https://rutharias.emotia.ar/no-somos-islas/No_somos_islas_Ruth_Arias.pdf
  Audio: https://rutharias.emotia.ar/no-somos-islas/?origen=ebook#audio

  Novedades: Sí, quiero recibir novedades y recursos.
  (o, sin la casilla: No pediste recibir novedades.)

  Este sitio no guarda tu dirección. El aviso quedó en la bandeja de Emotia.
  Para no recibir más mensajes, respondé este correo.
  ```

- Si el campo trampa viene con texto, la respuesta es de éxito y no sale ningún correo.

### Contrato

Acción de servidor `requestIslasAccess`, pública (la página no tiene sesión; Next.js valida el origen).

| Campo | Tipo | Obligatorio | Límites | Mensaje si falla | Dónde se valida |
|---|---|---|---|---|---|
| `email` | texto, correo | sí | se recorta; 1 a 254 caracteres; formato de correo | "Revisá el correo electrónico ingresado." | navegador y servidor |
| `newsletter` | booleano | sí (verdadero o falso) | — | — | servidor |
| `company` | texto, trampa oculta | no | hasta 500 caracteres | — (respuesta de éxito sin envío) | servidor |

Respuestas:

- `{ status: "success" }`: se habilitan los recursos y se muestra "Listo. Ya podés descargar el ebook. Te enviamos la confirmación por correo." (RN-D05).
- `{ status: "invalid", field: "email", message }`: el mensaje queda junto al campo y el foco vuelve a él.
- `{ status: "error" }` (configuración faltante, rechazo de Resend, falla de red): "No pudimos completar el envío. Tu correo no se guardó. Probá de nuevo en unos minutos.". Los recursos siguen ocultos.

Variables: `RESEND_API_KEY`, `RESEND_FROM` y `RESEND_TO`, las mismas de la home. `NEXT_PUBLIC_GA_ID` para Analytics.

### Analytics y consentimiento

- Un aviso de consentimiento aparece en todas las páginas del sitio mientras la persona no eligió. Texto (RN-D06): "Usamos Google Analytics para saber cómo se usa el sitio, por ejemplo cuántas personas descargan el ebook o escuchan el audio. Solo se activa si lo aceptás." Botones "Aceptar" y "Rechazar".
- Google Analytics 4 se carga solo después de "Aceptar" y solo si `NEXT_PUBLIC_GA_ID` está definida. Con "Rechazar", sin elección o sin la variable, no se carga ningún script de Google ni se escribe ninguna cookie de Analytics.
- La elección se recuerda en el navegador. El pie de cada página tiene el enlace "Preferencias de cookies", que vuelve a mostrar el aviso; si la persona pasa a rechazar, Analytics deja de enviar eventos desde ese momento.
- Eventos de esta página, todos con `resource: "no_somos_islas"`:
  - `nsis_signup` cuando el servidor confirma el pedido, con `newsletter: "yes" | "no"`;
  - `nsis_ebook_download_click`;
  - `nsis_audio_start` (una vez por reproducción) y `nsis_audio_complete`;
  - `nsis_qr_arrival` y `nsis_pdf_link_arrival` según `utm_medium`.
- Las demás páginas solo envían la vista de página de GA4.

### Seguridad y datos sensibles

- Correo electrónico (dato personal): viaja una vez a la acción de servidor y sale solo en los dos correos de Resend. No se guarda en el sitio. No aparece en logs (solo resultado, `correlationId` y nombre del error), ni en la URL, ni en Analytics, ni en mensajes de error. Lo lee solo quien accede a la bandeja `RESEND_TO`. Se conserva lo que conserve esa bandeja; la baja se pide respondiendo el correo.
- Consentimiento de novedades (dato personal): mismo tratamiento; va en el aviso y en la confirmación como "Sí" o "No".
- `RESEND_API_KEY` (secreto): solo en el servidor, desde la configuración de Vercel. Sin ella, la acción rechaza todo envío.
- `NEXT_PUBLIC_GA_ID` (identificador público, no secreto): desde la configuración de Vercel, nunca en el repositorio.
- Elección de cookies: se guarda solo en el navegador de la persona.

### Requisitos no funcionales

- El PDF, el audio y la portada se sirven como archivos separados del mismo sitio, con caché del navegador y de la CDN de una semana (`Cache-Control: public, max-age=604800, stale-while-revalidate=86400`).
- La portada sale por `next/image` (formatos modernos y tamaño según pantalla). El audio no se descarga entero al cargar la página.

### Decisiones del desarrollador

- RN-D01 (2026-11-23) Se sigue sin historia de tablero, con plan y DW Review antes del cierre.
- RN-D02 (2026-11-23) El pedido de acceso usa el criterio del formulario de novedades de la home: aviso a la bandeja de Emotia y confirmación a la persona, sin persistencia en el sitio.
- RN-D03 (2026-11-23) La confirmación a la persona incluye los enlaces al ebook y al audio.
- RN-D04 (2026-11-23) El aviso de demo se reemplaza por: "Al enviar, tu correo se usa para avisarnos de tu pedido y enviarte la confirmación. Las novedades solo llegan si marcaste la casilla. Este sitio no guarda tu dirección."
- RN-D05 (2026-11-23) Mensaje de éxito del pedido: "Listo. Ya podés descargar el ebook. Te enviamos la confirmación por correo."
- RN-D06 (2026-11-23) Google Analytics 4 en todo el sitio, cargado solo tras aceptar un aviso de consentimiento, con el texto y los botones de "Analytics y consentimiento" y el enlace "Preferencias de cookies" en los pies.
- RN-D07 (2026-11-23) El ebook se publica como `No_somos_islas_Ruth_Arias.pdf`.

### Criterios de aceptación

- CA-01 `GET /no-somos-islas` responde 200 con el título, la descripción, los textos y los enlaces del HTML corregido, y el aviso de RN-D04 en lugar del de demo.
- CA-02 Colores, tipografías, pesos y espaciados coinciden con el HTML corregido en escritorio (1280 px) y móvil (390 px), con el acceso bloqueado y habilitado.
- CA-03 Con un correo válido y Resend respondiendo bien, salen el aviso y la confirmación con los textos de "Pedido de acceso", y se habilitan la descarga y el audio con el mensaje de RN-D05.
- CA-04 Con correo vacío o inválido, sin configuración de Resend o con un rechazo de Resend, no se habilitan los recursos y se ve el mensaje correspondiente del contrato. Con el campo trampa completo no sale ningún correo.
- CA-05 El correo no aparece en ningún log, URL ni evento de Analytics.
- CA-06 Una URL con `#audio` y `utm_medium=qr`, `utm_medium=pdf_link` u `origen=ebook` abre con el audio habilitado; sin `#audio` o sin esos parámetros, no.
- CA-07 Los dos enlaces del PDF, con la barra final, llegan a `/no-somos-islas` con la sección de audio habilitada y visible.
- CA-08 Sin aceptar el aviso, sin `NEXT_PUBLIC_GA_ID` o después de rechazar, no se pide ningún script de Google ni se escribe ninguna cookie `_ga`.
- CA-09 Tras aceptar, GA4 recibe la vista de página y los eventos de "Analytics y consentimiento" en los momentos descritos.
- CA-10 El PDF, el audio y la portada responden 200 desde `/no-somos-islas/` con el `Cache-Control` de los requisitos no funcionales; la descarga se llama `No_somos_islas_Ruth_Arias.pdf`.

## Plan

Status: accepted
Specs: sha256:54940b89a578fd0175a3253deda13695e27d9e8aeb93ef5851270c2340610a5e sig:c30d8b89a40077d4c00f3a7ece915bf95a9b68666d7c30715d1f16f47e149f2a

### Diseño

Mismo patrón que `/aula` y `/test`.

- `src/app/no-somos-islas/page.tsx`: ruta, `metadata` y `viewport`.
- `src/features/no-somos-islas/`: `IslasPage.tsx` (Server Component, encabezado y pie), `IslasMain.tsx` (cliente: acceso, desbloqueo, audio y eventos), `islas.css` (la cascada del HTML corregido bajo `@scope (.islas-page)`, tokens en `:scope` y `h2,h3{font-weight:700}` por el preflight de Tailwind), `messages.ts`, `ebook-entry.ts` (`isEbookEntry(search, hash)`, puro y probado).
- Pedido de acceso: `src/features/no-somos-islas/request-islas-access.ts` (`"use server"`), `deliver-islas-access.ts` (lógica pura, mismo esquema que `deliver-newsletter.ts`) e `islas-access-schema.ts` (Zod). El formulario pasa a react-hook-form con el schema, como `NewsletterForm`.
- Correo compartido: `mail-config.ts` y `resend-mail-client.ts` pasan de `src/features/newsletter/` a `src/lib/mail/`, porque una feature no importa el interior de otra. Newsletter actualiza sus imports y sus pruebas siguen verdes; no cambia su comportamiento.
- Consentimiento y Analytics: `src/features/analytics/` con `ConsentBanner.tsx` (cliente), `GoogleAnalytics.tsx` (carga `gtag.js` con `next/script` solo con consentimiento y `NEXT_PUBLIC_GA_ID`), `consent-store.ts` (elección en `localStorage`, suscribible con `useSyncExternalStore`), `track-event.ts` (envía solo con consentimiento) y `messages.ts`. Se montan en `src/app/layout.tsx`. El enlace "Preferencias de cookies" se agrega al pie de la home, de `/test`, de `/aula` y de esta página.
- Archivos: `public/no-somos-islas/No_somos_islas_Ruth_Arias.pdf` (el PDF del HTML corregido, 1,04 MB, 21 páginas), `no-somos-islas-reflexion.mp3` (1,63 MB, 9 min 31 s, ya comprimido; no se recomprime) y `hero-cover.webp` (107 KB). Se borra el PDF del demo. `next.config.ts` agrega el `Cache-Control` para `/no-somos-islas/:file+` (`:file*` también coincidiría con la ruta de la página).
- La barra final: Next.js redirige `/no-somos-islas/` a `/no-somos-islas` con 308 y conserva la query; el navegador conserva el `#audio`. Se prueba con las dos URL exactas del PDF.
- `.env.example` suma `NEXT_PUBLIC_GA_ID` con un valor ficticio.

Pruebas por criterio:

- CA-01, CA-10: Playwright contra `pnpm build && pnpm start` (respuestas, metadatos, encabezados y nombre de la descarga).
- CA-02: capturas de Playwright de la página y del HTML corregido en los dos anchos y los dos estados, comparadas a la vista y con los colores calculados.
- CA-03, CA-04, CA-05: Vitest sobre `deliver-islas-access` con un cliente de correo falso y un logger que captura; Playwright para el desbloqueo con la acción.
- CA-06: Vitest sobre `isEbookEntry`.
- CA-07: Playwright con las dos URL del PDF.
- CA-08, CA-09: Vitest sobre `consent-store` y `track-event`; Playwright que registra pedidos a `googletagmanager.com` y cookies antes y después de aceptar y rechazar.

### Rollback

Revertir los commits de la rama. El único cambio fuera de la página nueva es el aviso de consentimiento (con Analytics apagado mientras no se acepte) y el traslado de los módulos de correo, que no cambia el comportamiento de la home.

### Pronóstico de tamaño

Unas 1.100 líneas de autoría, sin contar los binarios: página y estilos 400, pedido de acceso 250, consentimiento y Analytics 250, pruebas 200. Pasa de 400: se recomienda dividir en dos PR encadenados, (1) página y pedido de acceso (T1 a T3) y (2) consentimiento y Analytics (T4 y T5). La decisión es del desarrollador antes de abrir el primero.

## Tasks

- [x] T1 (CA-01, CA-02, CA-06, CA-10): Página `/no-somos-islas` desde el HTML corregido: textos, enlaces externos, metadatos, PDF nuevo con su nombre, `isEbookEntry` con pruebas, `Cache-Control` de los archivos y comparación visual en escritorio y móvil.
  - Evidence: RED `pnpm vitest run src/features/no-somos-islas`: falla, el módulo `ebook-entry` no existe; GREEN: 5 pruebas en verde
  - Evidence: `pnpm test`: 22 pruebas en verde; `pnpm lint`: sin hallazgos; `pnpm typecheck`: sin errores; `pnpm build`: `/no-somos-islas` estática
  - Evidence: `curl` contra `pnpm start`: página 200 con título, descripción, `theme-color` `#512681`, `index, follow` y tres enlaces externos con `target="_blank" rel="noopener noreferrer"`; PDF, webp y mp3 200 con `Cache-Control: public, max-age=604800, stale-while-revalidate=86400`; la página no recibe ese encabezado
  - Evidence: PDF publicado: 1.085.945 bytes, sha256 `19d8c6fa5d7a…`, igual al del HTML corregido; descarga `No_somos_islas_Ruth_Arias.pdf`
  - Evidence: Playwright, HTML corregido contra la página en 1280 y 390 px, bloqueada y habilitada: colores, fuentes, pesos, tamaños y anchos idénticos; única diferencia, `.hero` 19,7 px más bajo en 390 px bloqueado por el largo distinto del aviso RN-D04
- [ ] T2 (CA-03, CA-04, CA-05): Traslado de `mail-config` y `resend-mail-client` a `src/lib/mail/` y pedido de acceso `requestIslasAccess` con su schema, aviso, confirmación, campo trampa y pruebas; el formulario habilita los recursos solo con la respuesta de éxito.
- [ ] T3 (CA-07): Prueba de Playwright con los dos enlaces del PDF, barra final incluida.
- [ ] T4 (CA-08): Aviso de consentimiento en todo el sitio, elección recordada, enlace "Preferencias de cookies" en los pies, y GA4 cargado solo con consentimiento y `NEXT_PUBLIC_GA_ID`; `.env.example`.
- [ ] T5 (CA-09): Eventos de la página por `track-event`, incluido `nsis_signup` con `newsletter`, y prueba de que llegan solo con consentimiento.

## Evidence

## Progress

Plan aprobado. T1 terminada. Siguiente paso: T2, pedido de acceso por Resend.
