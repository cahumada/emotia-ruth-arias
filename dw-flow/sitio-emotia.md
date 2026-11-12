# sitio-emotia

Convertir el sitio estático de revisión en una aplicación Next.js de este repositorio, desplegable en Vercel, sin cambiar el aspecto ni los textos que definió el diseñador.

El pedido crea una aplicación nueva. Es un cambio sensible. No hay historia de tablero: se sigue sin ella por decisión explícita de esta sesión. DW Review corre antes del cierre.

## Specs

### Pedido original

Convertir la web de `C:\Users\Cristian\Downloads\Emotia_Ruth_Arias_REV5_proyecto_completo\Emotia_Ruth_Arias_revision_5_cierre_novedades` en una app Vercel en este repositorio, con estas reglas:

- Estructurar el diseño existente y mantener la integridad visual definida por el diseñador.
- Componentizar lo que se pueda, para reutilizar código.
- Integración con Resend para envíos de mail.
- Respetar las URL definidas.
- Crear el `.gitignore` según las reglas estándar.

### Decisiones confirmadas

- Stack de UI: `tailwind`. Los colores, la tipografía y los espacios de cada página pasan a tokens. No se usa shadcn ni Astryx, y no se deja `styles.css` como hoja global.
- Idioma: solo español rioplatense, el del HTML. Desvío explícito de frontend-standards (textos de interfaz en `es`, `en` y `pt-BR`). No se traduce el copy clínico.
- Tema: solo el del diseñador. Desvío explícito de frontend-standards (tema claro y oscuro). No se inventa paleta oscura.
- Datos: el formulario no persiste correos. No hay base de datos ni contactos de Resend.
- Historia de tablero: ninguna. El plan se acepta igual, antes del primer código.

### Criterios de aceptación

- CA-01: La aplicación es Next.js con App Router, TypeScript estricto y Tailwind, en la raíz de este repositorio, con una prueba que corre en el andamiaje.
- CA-02: `/`, `/test` y `/aula` conservan los textos, la estructura y el aspecto del HTML de origen. Cada página mantiene sus propios tokens. No se unifica el look de las tres.
- CA-03: Las anclas de la home se conservan. `/index.html`, `/test.html` y `/aula.html` redirigen a `/`, `/test` y `/aula`. Los enlaces externos quedan iguales a los del HTML.
- CA-04: `#emotia-newsletter` valida correo y consentimiento, nace con el consentimiento desmarcado, y muestra éxito solo cuando Resend confirma los dos envíos. No guarda el correo. Si falta un secreto, la acción rechaza el envío.
- CA-05: `.gitignore` excluye secretos, dependencias y artefactos de build. `.env.example` lista las variables con valores ficticios. El lockfile se versiona.
- CA-06: Tras la autorización expresa de publicación, las páginas son indexables (`index, follow`).

### URL que se conservan

Home, anclas: `#inicio`, `#enfoque`, `#terapia`, `#test`, `#recursos`, `#sobre-mi`, `#situaciones`, `#preguntas`, `#novedades`, `#main`.

Enlaces externos, sin cambios:

- `https://app.emotia.ar/org/emotia/bookings/TRqG-Obv-lmYP6PP`
- `https://ebook.emotia.ar/`
- `https://www.emotia.ar/clase-la-misma-pelea`
- `https://www.emotia.ar/` y `https://www.emotia.ar`
- `https://www.instagram.com/lic_rutharias/`
- `https://www.tiktok.com/@lic_rutharias`
- `https://www.youtube.com/@ruthariaspsicologa`
- `https://www.linkedin.com/in/ruth-arias/`

`/aula` existe aunque la home no lo enlace. El test y el aula no ganan un enlace nuevo.

### Textos nuevos del formulario

El resto del copy visible se copia tal cual. Estas frases cambian porque el aviso de demostración quedaría falso cuando el envío exista:

- Nota `#news-info`: «Al enviar, tu correo se usa para avisarnos y para confirmarte. Este sitio no lo guarda.»
- Éxito en `#news-response`: «Listo. Revisá tu correo: te enviamos la confirmación.»
- Error de envío: «No pudimos completar el envío. Tu correo no se guardó. Probá de nuevo en unos minutos.»
- Correo inválido, ya existente: «Revisá el correo electrónico ingresado.»
- Sin consentimiento, ya existente: «Para suscribirte, primero tenés que aceptar recibir novedades.»

La casilla sigue diciendo: «Quiero recibir novedades de Emotia por email. Puedo dejar de recibirlas cuando quiera.» No hay baja automática. El correo de confirmación indica que este sitio no guarda la dirección y que, para no recibir más mensajes, se responde ese correo. La bandeja de destino es el único registro.

## Plan

Status: accepted
Specs: sha256:15cac29e81aeb20ecda2d55a24a29b02140d42e3a2a6289f2ef8f655127544d5 sig:648f837bb0b6478c9eb6d282cddd5fbd7f0c420283b21ac82a31219f35d414cb

### Architecture

| Decision | Choice | Why | Standard |
|---|---|---|---|
| Shape | Front end + BFF en la misma app | Un sitio público y una sola acción de correo. No hace falta otra API. | next-standards |
| Front end | Next.js, App Router, TypeScript estricto, stack `tailwind` | Vercel y el estándar de front. Tailwind porque el diseño ya está definido y no aporta una librería de primitivos. | next-standards, frontend-standards |
| Rendering | Server Components por defecto; islas cliente para menú, test y aula | El contenido es estático. El menú, el cuestionario y las notas necesitan estado en el navegador. | next-standards |
| Devices | Escritorio y móvil | El CSS de origen ya es responsive. Se respeta. | frontend-standards |
| Languages | Solo español | Decisión explícita. Desvío del estándar de tres idiomas. | frontend-standards (desvío) |
| Theme | Un tema, el del diseñador, en tokens | Decisión explícita. Desvío del tema oscuro. | frontend-standards (desvío) |
| Backend | Sin servicio aparte | El BFF es la Server Action del formulario. | next-standards |
| Data | Sin motor y sin persistencia | No se guardan correos. Evita retención y borrado de datos personales. | security-standards |
| Integration | Resend, dos correos por envío | Aviso al destino de Emotia y confirmación a la persona. El SDK oficial, secreto solo en servidor. | security-standards |
| Security | Sin autenticación. Acción pública a propósito | El sitio no tiene sesión. La acción valida el cuerpo, falla cerrada sin secreto y no registra el correo. | security-standards |
| Delivery | Este repositorio, raíz, Vercel. pnpm | Un solo componente. pnpm porque base-standards nombra `pnpm-lock.yaml` para Node. | base-standards |

Componentes (los corre el desarrollador después de que el andamiaje esté commiteado; no se edita `.dw-told-ai/project.json`):

```text
dw-told-ai architecture set --component .:frontend,bff:next,tailwind
```

Si la detección sin flags difiere de esta línea, se lo dice y decide el desarrollador.

### Diseño

Código por feature: `src/features/home`, `src/features/test`, `src/features/aula`, `src/features/newsletter`. Lo común de dos features o más va a `src/components` y `src/lib`. Una feature no importa el interior de otra.

Tres sistemas visuales, no uno. La home usa los tokens de `styles.css` después de toda la cascada (la revisión 2 pisa al bloque anterior del mismo archivo). El test y el aula traen su propio CSS embebido y lo conservan en tokens de esa página. Se comparte la marca (`#512681`, `#E2CAFD`) y se componentizan header, botón, contenedor y pie donde el marcado se repite, sin igualar radios, tintas ni focos que hoy difieren.

Tipografía: la pila de sistema del diseñador. No se carga una webfont: cambiaría el aspecto. Las imágenes raster van por `next/image`.

Formularios con react-hook-form y un schema Zod por feature. Con el desvío de idioma, los mensajes viven en un módulo español de la feature, no en tres archivos de locale.

El test sigue calculando la devolución en el navegador y no envía respuestas. Las notas del aula siguen en la pestaña, se descargan o se copian, y no se envían. Video, PDF y audio siguen como placeholders deshabilitados.

Newsletter:

- Server Action pública. Un comentario en la acción dice por qué no hay sesión: la página es pública.
- Schema: correo y consentimiento obligatorio. Campo honeypot oculto; si viene con valor, no se envía y la respuesta visible es la de éxito.
- El botón se deshabilita mientras dura el envío.
- Resend manda los dos correos. El de confirmación cita la frase de consentimiento, dice que el sitio no guarda la dirección y pide responder ese correo para no recibir más. El aviso interno lleva dirección, timestamp UTC y la misma frase. Ese mail es el único registro.
- Variables: `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_TO`. Valores ficticios en `.env.example`. La acción las valida al usarse y rechaza el envío si falta alguna. Las páginas públicas arrancan igual, porque no dependen de Resend.
- Log con pino, una línea JSON, sin dirección, sin cuerpo y sin el texto del consentimiento. Nivel `info` cuando el envío sale; `warn` cuando se rechaza por validación.
- No hay límite de tasa en esta entrega. El honeypot es la protección antispam, sin un proveedor extra.

`.gitignore`: `node_modules`, `.next`, `out`, `dist`, `coverage`, `playwright-report`, `test-results`, `.vercel`, `.env`, `.env.local`, `.env*.local`, logs, `.DS_Store`, `Thumbs.db`, `.worktrees/`. No ignora el lockfile ni `.env.example`.

README en inglés: cómo correr, variables con valores ficticios, que los logs salen por stdout, que las páginas son indexables, y los desvíos de idioma y de tema.

### Desvíos

- Sin `en` ni `pt-BR`.
- Sin tema oscuro.
- Sin icono nuevo en botones que el diseño no tiene.
- Sin `next/font`, porque no hay webfont en el origen.
- La baja que promete la casilla no es automática: se resuelve respondiendo el correo de confirmación.
- TDD no está habilitado. Cada tarea trae su prueba y corre junto con el comportamiento.

### Rollback

No hay deploy ni migración en estas tareas. Rollback: no mergear la rama, o revertir el commit de la tarea si ya se integró. No hay datos que migrar.

### Pronóstico de tamaño

Líneas de autor, altas más bajas, sin generados. Heurística de unas 400 por tarea; donde el corte partiría una página a la mitad, la tarea se pasa y se dice por qué.

| Tarea | Estimación | Nota |
|---|---|---|
| T1 | 320 | Andamiaje y una prueba |
| T2 | 380 | Tokens y chrome de la home |
| T3 | 480 | Mitad superior de la home; el copy no se parte en medio de una sección |
| T4 | 450 | Resto de la home, formulario aún sin envío |
| T5 | 520 | Test: UI más la lógica de devolución, que se prueba aparte |
| T6 | 420 | Aula, con placeholders |
| T7 | 380 | Acción de Resend y sus pruebas |
| T8 | 280 | Redirects, metadata, README, humo e2e |
| Total | ~3230 | Al abrir el PR se pregunta cómo partir la rama si hace falta |

### Puntos abiertos

- Dominio verificado de Resend y las tres variables: las aporta el desarrollador fuera del repositorio.
- No hay página de política de privacidad en el origen. No se redacta una.
- Formación, matrícula y trayectoria no se publican. No se inventa el botón de la publicación pendiente.
- Indexación autorizada: las páginas publican `index, follow` y los pies ya no avisan que el sitio es una demo.
- Límite de tasa del formulario, fuera de esta entrega.
- El PR que toque la acción, el secreto o el correo lleva etiqueta `security` y revisión de una segunda persona. Si no hay revisor, se documenta el desvío de autorrevisión; no se presenta como revisión ajena.

## Tasks

- [x] T1 (CA-01, CA-05): Andamiaje Next.js en la raíz, pnpm, TypeScript estricto, Tailwind, Vitest, Playwright, pino, `.gitignore`, `.env.example` y una prueba que corre.
  - Evidence: `pnpm test`: 4 pruebas en verde (commit 2d09381)
  - Evidence: `pnpm lint`: sin hallazgos (commit 2d09381)
  - Evidence: `pnpm typecheck`: sin errores (commit 2d09381)
  - Evidence: `pnpm build`: ruta `/` estática (commit 2d09381)
  - Evidence: `GET /` respondió 200, `lang="es-AR"`, `robots` `noindex, nofollow` (commit 2d09381)
- [x] T2 (CA-02): Tokens de la home según la cascada final de `styles.css`, y componentes de encabezado, menú, pie y botón.
- [x] T3 (CA-02, CA-06): Home desde el inicio hasta terapia individual, con sus imágenes y `noindex`.
- [x] T4 (CA-02, CA-03): Home desde el bloque del test hasta el pie, anclas y enlaces externos. El formulario se ve y valida en el cliente; todavía no envía.
- [x] T5 (CA-02, CA-03): Página `/test` con el cuestionario, la devolución en el navegador y pruebas de esa lógica. Redirect desde `/test.html`.
- [x] T6 (CA-02, CA-03): Página `/aula` con pestañas, notas locales, descarga y copia. Placeholders sin video, PDF ni audio. Redirect desde `/aula.html`.
  - Evidence: `pnpm build`: `/`, `/test` y `/aula` estáticas (commit 63a4b55)
  - Evidence: `pnpm test:e2e`: 4 pruebas en verde (commit 63a4b55)
- [x] T7 (CA-04): Server Action, schema, honeypot y Resend. Pruebas con el cliente de correo simulado: consentimiento ausente, correo inválido, honeypot, secreto ausente y envío sin loguear la dirección.
  - Evidence: `pnpm test`: 23 pruebas en verde (commit b9d3551)
- [x] T8 (CA-03, CA-06): Redirect de `/index.html`, metadata `noindex` en las tres rutas, README y una prueba e2e de humo de `/`, `/test` y `/aula`.
  - Evidence: `pnpm test`: 21 pruebas en verde (commit 63a4b55)
  - Evidence: `pnpm lint`: sin hallazgos (commit 63a4b55)
  - Evidence: `pnpm typecheck`: sin errores (commit 63a4b55)
  - Evidence: `pnpm build`: `/`, `/test` y `/aula` estáticas (commit 63a4b55)
  - Evidence: `pnpm test:e2e`: 4 pruebas en verde (commit 63a4b55)
  - Evidence: `GET /` 200 con `noindex`; `/index.html`, `/test.html` y `/aula.html` responden 308 (commit 63a4b55)

## Evidence

T2 a T8 cerradas en `63a4b55`. El detalle de comandos está en cada tarea.

## Progress

Plan aceptado. T1 en `2d09381`. T2 a T8 en `63a4b55`. El aviso secuencial del newsletter quedó en `b9d3551`.

El pull request del envío lleva etiqueta `security`. Las variables de Resend siguen fuera del repositorio. Las pruebas de envío no se ejecutan por ahora: `deliver-newsletter.test.ts` sigue en el repositorio y Vitest lo excluye.

Publicación autorizada: las páginas quedan indexables y se quitan los avisos de demo del pie.

## Closure

<!-- Written by dw-told-ai close: run it again instead of editing this section. -->

- Estado del cierre: `cerrado`
- DW Review: `ready`, reconocida por cahumada85@gmail.com el 2026-11-12T09:57:08Z
- Especificación viva: `dw-ai/openspec/specs/sitio.md`
- Copia archivada: `dw-ai/openspec/changes/archive/2026-11-12-sitio-emotia.md`

- CA-01 ✔ — T1: `pnpm test`: 4 pruebas en verde (commit 2d09381); T1: `pnpm lint`: sin hallazgos (commit 2d09381); T1: `pnpm typecheck`: sin errores (commit 2d09381); T1: `pnpm build`: ruta `/` estática (commit 2d09381); T1: `GET /` respondió 200, `lang="es-AR"`, `robots` `noindex, nofollow` (commit 2d09381)
- CA-02 ✔ — T6: `pnpm build`: `/`, `/test` y `/aula` estáticas (commit 63a4b55); T6: `pnpm test:e2e`: 4 pruebas en verde (commit 63a4b55)
- CA-03 ✔ — T6: `pnpm build`: `/`, `/test` y `/aula` estáticas (commit 63a4b55); T6: `pnpm test:e2e`: 4 pruebas en verde (commit 63a4b55); T8: `pnpm test`: 21 pruebas en verde (commit 63a4b55); T8: `pnpm lint`: sin hallazgos (commit 63a4b55); T8: `pnpm typecheck`: sin errores (commit 63a4b55); T8: `pnpm build`: `/`, `/test` y `/aula` estáticas (commit 63a4b55); T8: `pnpm test:e2e`: 4 pruebas en verde (commit 63a4b55); T8: `GET /` 200 con `noindex`; `/index.html`, `/test.html` y `/aula.html` responden 308 (commit 63a4b55)
- CA-04 ✔ — T7: `pnpm test`: 23 pruebas en verde (commit b9d3551)
- CA-05 ✔ — T1: `pnpm test`: 4 pruebas en verde (commit 2d09381); T1: `pnpm lint`: sin hallazgos (commit 2d09381); T1: `pnpm typecheck`: sin errores (commit 2d09381); T1: `pnpm build`: ruta `/` estática (commit 2d09381); T1: `GET /` respondió 200, `lang="es-AR"`, `robots` `noindex, nofollow` (commit 2d09381)
- CA-06 ✔ — T8: `pnpm test`: 21 pruebas en verde (commit 63a4b55); T8: `pnpm lint`: sin hallazgos (commit 63a4b55); T8: `pnpm typecheck`: sin errores (commit 63a4b55); T8: `pnpm build`: `/`, `/test` y `/aula` estáticas (commit 63a4b55); T8: `pnpm test:e2e`: 4 pruebas en verde (commit 63a4b55); T8: `GET /` 200 con `noindex`; `/index.html`, `/test.html` y `/aula.html` responden 308 (commit 63a4b55)

<!-- dw-told-ai:usage:start -->
## Consumption

| Phase | Provider / model | Runs | Input | Output | Cache read | Cache write | Cost (US$) |
|---|---|---:|---:|---:|---:|---:|---:|
| `dw-flow` | `cursor/grok-4.7@256k:fast` | 17 | 933357 | 147799 | 243840 | 0 | 0.0000 |
| `dw-review-resilience` | `cursor/composer-2-5:fast` | 3 | 39867 | 6304 | 0 | 0 | 0.0000 |
| `dw-review-readability` | `cursor/composer-2-5:fast` | 3 | 47417 | 8794 | 0 | 0 | 0.0000 |
| `dw-review-reliability` | `cursor/composer-2-5:fast` | 3 | 52794 | 12594 | 0 | 0 | 0.0000 |
| **Total** | | 26 | 1073435 | 175491 | 243840 | 0 | 0.0000 |

Measured by dw-told-ai from each phase's own usage report. A phase that ran more than once counts every run. Cost is what the provider reported; with a subscription login it is an estimate, not a charge.
<!-- dw-told-ai:usage:end -->
