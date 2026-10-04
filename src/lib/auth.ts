'use client'

const TOKEN_KEY = 'plura_gov_token'
const REFRESH_KEY = 'plura_gov_refresh_token'
const USER_KEY = 'plura_gov_user'
// 'gov' (conta institucional) ou 'usuario' (conta Plura colaboradora)
const CONTA_KEY = 'plura_gov_conta'

type Conta = 'gov' | 'usuario'

export function salvarSessao(auth: { access_token: string; refresh_token: string; user?: { id: string; email?: string | null }; conta?: Conta }) {
  localStorage.setItem(TOKEN_KEY, auth.access_token)
  localStorage.setItem(REFRESH_KEY, auth.refresh_token)
  if (auth.user) localStorage.setItem(USER_KEY, JSON.stringify(auth.user))
  if (auth.conta) localStorage.setItem(CONTA_KEY, auth.conta)
}

export function limparSessao() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(CONTA_KEY)
}

export function estaLogado(): boolean {
  return typeof window !== 'undefined' && !!localStorage.getItem(TOKEN_KEY)
}

export function obterToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
}

export function obterRefreshToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem(REFRESH_KEY) : null
}

export function obterUsuarioSalvo(): { id: string; email?: string | null } | null {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null')
  } catch {
    return null
  }
}

// Sem informação (sessões antigas) conta como Gov: não leva a sessão para a busca
export function tipoConta(): Conta {
  return typeof window !== 'undefined' && localStorage.getItem(CONTA_KEY) === 'usuario' ? 'usuario' : 'gov'
}
