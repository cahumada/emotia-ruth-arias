# no-somos-islas

## no-somos-islas

<!-- Archived by dw-told-ai close no-somos-islas, from dw-flow/no-somos-islas.md. -->

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
- Si la persona llega por el QR o el enlace del PDF y acepta el aviso más tarde en la misma visita, la llegada se mide una vez en ese momento.
- Ningún evento lleva el correo ni texto libre: los parámetros son solo `resource` y `newsletter`.
- El aviso se anuncia a los lectores de pantalla como "Aviso de cookies". La elección se guarda en `localStorage` con la clave `emotia-analytics-consent`; al rechazar con GA4 ya cargado se envía `analytics_storage: denied` y se desactiva la propiedad.

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

### Estado al cierre

- Estado: `cerrado`
- CA-01 ✔
- CA-02 ✔
- CA-03 ✔
- CA-04 ✔
- CA-05 ✔
- CA-06 ✔
- CA-07 ✔
- CA-08 ✔
- CA-09 ✔
- CA-10 ✔
- Diseño técnico, tareas y evidencia: `dw-ai/changes/archive/2026-11-23-no-somos-islas.md`
