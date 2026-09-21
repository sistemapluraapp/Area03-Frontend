'use client'

const TOKEN_KEY = 'plura_gov_token'

export function salvarSessao(auth: { access_token: string }) {
  localStorage.setItem(TOKEN_KEY, auth.access_token)
}

export function limparSessao() {
  localStorage.removeItem(TOKEN_KEY)
}

export function estaLogado(): boolean {
  return typeof window !== 'undefined' && !!localStorage.getItem(TOKEN_KEY)
}
