# no-somos-islas

## 2026-11-23 · no-somos-islas/dw-flow — Inicio: landing No somos islas sin historia, con plan y DW Review

Página /no-somos-islas desde el mockup No_somos_islas_demo.html; rama dw-flow/no-somos-islas desde origin/master; plan con 2 tareas, riesgo passive.
Hallazgo: :root dentro de @scope no aplica (las variables deben ir en :scope) y el preflight de Tailwind quita la negrita de h2/h3 en la que se apoyan los mockups.

## 2026-11-23 · no-somos-islas/dw-flow — Plan reescrito: envío real por Resend y GA4 con consentimiento en todo el sitio

HTML corregido trae un PDF nuevo (21 págs.) cuyos enlaces QR y pdf_link apuntan a rutharias.emotia.ar/no-somos-islas/?...#audio. Decisiones RN-D02..D07: criterio de la home (aviso + confirmación con enlaces, sin persistencia), GA4 sitio completo solo tras consentimiento, PDF como No_somos_islas_Ruth_Arias.pdf.
5 tareas, ~1.100 líneas; se propone dividir en 2 PR (página+acceso / consentimiento+GA).

## 2026-11-23 · no-somos-islas/dw-flow — Cierre: landing, acceso por Resend y GA4 con consentimiento

T1-T5 cerradas con evidencia; DW Review ready y reconocida (bloqueante READ-01 refutado: la revisión vio copias de mail que HEAD ya no tiene). Especificación viva en dw-ai/specs/no-somos-islas.md.
Lección: dw_commit no puede commitear una baja ya staged (git add falla); sacarla del índice con git restore --staged y pasar la ruta. Next 16 no levanta dos next dev en el mismo directorio: e2e con next start en otro puerto.
Pendiente fuera del repo: variables RESEND_* y NEXT_PUBLIC_GA_ID en Vercel, dominio, QR con teléfono, límite de tasa (historia aparte).
