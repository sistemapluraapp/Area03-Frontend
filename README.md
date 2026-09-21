# Area03-Frontend

Frontend da Área 03 (Gov) da Plura — Next.js (export estático) em Cloudflare Pages.

Mesmas funções da Área 02, adaptadas para Páginas institucionais (tipo
`publica`), com login institucional próprio (`gov_contas`) — tela de
login separada da usada pelo CPF pessoal nas demais áreas.

## Deploy
O workflow `.github/workflows/deploy.yml` publica em Cloudflare Pages a cada push.
Precisa dos secrets do repositório: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
