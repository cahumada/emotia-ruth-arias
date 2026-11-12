# sitio

## sitio-emotia

<!-- Archived by dw-told-ai close sitio-emotia, from dw-flow/sitio-emotia.md. -->

### Criterios de aceptación

- CA-01: La aplicación es Next.js con App Router, TypeScript estricto y Tailwind, en la raíz de este repositorio, con una prueba que corre en el andamiaje.
- CA-02: `/`, `/test` y `/aula` conservan los textos, la estructura y el aspecto del HTML de origen. Cada página mantiene sus propios tokens. No se unifica el look de las tres.
- CA-03: Las anclas de la home se conservan. `/index.html`, `/test.html` y `/aula.html` redirigen a `/`, `/test` y `/aula`. Los enlaces externos quedan iguales a los del HTML.
- CA-04: `#emotia-newsletter` valida correo y consentimiento, nace con el consentimiento desmarcado, y muestra éxito solo cuando Resend confirma los dos envíos. No guarda el correo. Si falta un secreto, la acción rechaza el envío.
- CA-05: `.gitignore` excluye secretos, dependencias y artefactos de build. `.env.example` lista las variables con valores ficticios. El lockfile se versiona.
- CA-06: Todas las páginas publican `noindex, nofollow` hasta una autorización expresa de quitarlo.
