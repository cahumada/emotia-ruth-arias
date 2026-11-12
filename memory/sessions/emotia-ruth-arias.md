# emotia-ruth-arias

## 2026-11-11 · emotia-ruth-arias/dw-design — Sitio origen y decisiones ya dadas

Repo vacío (solo README y estándares). Dominio generic. Sin arquitectura declarada.
Origen: index.html, test.html, aula.html, styles.css, app.js, assets. Formulario #emotia-newsletter es demo y no envía.
Pedido: app Vercel, integridad visual, componentizar, Resend, URLs del diseño, .gitignore estándar. Plan antes de código.

## 2026-11-11 · emotia-ruth-arias/dw-design — UI: Tailwind con tokens del diseño

Decisión: stack tailwind (frontend-standards). Colores, tipografía y espacios de styles.css pasan a tokens; las secciones se componentizan. Se descarta shadcn, Astryx y el CSS crudo.

## 2026-11-11 · emotia-ruth-arias/dw-design — Idioma: solo español, desvío explícito

Decisión: solo español rioplatense, sin archivos en ni pt-BR. Desvío explícito de frontend-standards (User-facing text). El copy visible se mantiene como lo escribió el diseñador, no se traduce.

## 2026-11-11 · emotia-ruth-arias/dw-design — Newsletter: solo Resend, sin base

Decisión: el formulario de novedades no persiste correos. Server Action pública valida email y consentimiento; Resend envía aviso a Emotia y confirmación a la persona. Sin base, sin Audiences. La baja queda abierta. Desvío parcial del pedido del diseñador (registro y baja) a favor de no guardar datos personales.

## 2026-11-11 · emotia-ruth-arias/dw-design — Tema: solo el del diseñador

Decisión: un solo tema, la paleta de styles.css. Desvío explícito de frontend-standards (Styling, claro y oscuro). No se inventa tema oscuro.
Entrevista de arquitectura cerrada. Falta la historia de tablero antes del plan: el cambio es una app nueva (sensible).
