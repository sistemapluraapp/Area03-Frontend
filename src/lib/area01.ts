import { obterRefreshToken, obterToken, obterUsuarioSalvo, tipoConta } from './auth'

// Busca e agenda da Plura (Área 01). Os links do menu levam a sessão junto,
// pelo fragmento da URL (#...), que o navegador não envia ao servidor; a
// página /sessao da Área 01 grava a sessão e apaga o fragmento.
export const AREA01_URL = process.env.NEXT_PUBLIC_AREA01_URL ?? 'https://plura.app.br'

export function urlArea01(destino = '/'): string {
  const token = obterToken()
  const refresh = obterRefreshToken()
  const usuario = obterUsuarioSalvo()
  // Contas Gov não têm perfil de usuário na busca: vão como visitante
  if (tipoConta() !== 'usuario' || !token || !refresh || !usuario?.id) return `${AREA01_URL}${destino}`

  const dados = new URLSearchParams({ access_token: token, refresh_token: refresh, user_id: usuario.id, destino })
  if (usuario.email) dados.set('email', usuario.email)
  return `${AREA01_URL}/sessao#${dados.toString()}`
}
