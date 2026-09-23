import { obterRefreshToken, salvarSessao, limparSessao } from './auth'

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''

export class ApiError extends Error {
  status?: number
  suspensa?: boolean

  constructor(message: string, options?: { status?: number; suspensa?: boolean }) {
    super(message)
    this.status = options?.status
    this.suspensa = options?.suspensa
  }
}

function redirecionarParaLoginAposFalhaDeRenovacao() {
  if (typeof window === 'undefined') return
  const rotasPublicas = ['/login', '/signup', '/convite']
  if (rotasPublicas.some((rota) => window.location.pathname.startsWith(rota))) return
  window.location.href = '/login'
}

async function tentarRenovarSessao(): Promise<boolean> {
  const refreshToken = obterRefreshToken()
  if (!refreshToken) {
    limparSessao()
    redirecionarParaLoginAposFalhaDeRenovacao()
    return false
  }
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) {
      limparSessao()
      redirecionarParaLoginAposFalhaDeRenovacao()
      return false
    }
    const data = await res.json()
    salvarSessao(data)
    return true
  } catch {
    limparSessao()
    redirecionarParaLoginAposFalhaDeRenovacao()
    return false
  }
}

export async function request<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')

  const token = typeof window !== 'undefined' ? localStorage.getItem('plura_gov_token') : null
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  if (res.status === 204) return undefined as T

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401 && !isRetry) {
      const renovou = await tentarRenovarSessao()
      if (renovou) return request<T>(path, options, true)
    }
    throw new ApiError(data?.error ?? 'Erro inesperado ao falar com o servidor', {
      status: res.status,
      suspensa: data?.suspensa === true,
    })
  }
  return data as T
}

export interface Pagina {
  id: string
  tipo: string
  nome: string
  descricao: string | null
  created_at: string
}

export interface Vinculo {
  id: string
  usuario_id: string | null
  gov_conta_id: string | null
  papel: 'administrador' | 'colaborador'
  created_at: string
}

export interface Avaliacao {
  id: string
  usuario_id: string
  nota: number
  comentario: string | null
  resposta: string | null
  respondido_em: string | null
  sinalizada: boolean
  created_at: string
}

export interface Certificado {
  id: string
  status: 'pendente' | 'aprovado' | 'reprovado'
  solicitado_em: string
  avaliado_em: string | null
}

export interface AuthResponse {
  user?: { id: string; email: string }
  gov_conta?: { id: string; nome: string; orgao: string; cidade: string; nivel_acesso: number }
  access_token: string
  refresh_token: string
}

export interface Notificacao {
  id: string
  tipo: string
  titulo: string
  corpo: string
  entidade_tipo: string | null
  entidade_id: string | null
  lida: boolean
  lida_em: string | null
  criada_em: string
  metadata: Record<string, unknown>
}

export const api = {
  validarConvite: (token: string) => request<{ cidade: string }>(`/convites/${encodeURIComponent(token)}`),

  signup: (body: { token: string; nome: string; orgao: string; email: string; password: string }) =>
    request<AuthResponse | { message: string; pending_email_confirmation: true }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  criarPagina: (body: { nome: string; descricao?: string }) =>
    request<Pagina>('/paginas', { method: 'POST', body: JSON.stringify(body) }),

  minhasPaginas: () => request<{ paginas: { papel: string; paginas: Pagina }[] }>('/minhas-paginas'),

  obterPagina: (id: string) =>
    request<Pagina & { vinculos: Vinculo[]; avaliacoes: Avaliacao[]; certificados: Certificado[] }>(`/paginas/${id}`),

  convidarColaborador: (paginaId: string, email: string) =>
    request<Vinculo>(`/paginas/${paginaId}/colaboradores`, { method: 'POST', body: JSON.stringify({ email }) }),

  removerColaborador: (paginaId: string, vinculoId: string) =>
    request<void>(`/paginas/${paginaId}/colaboradores/${vinculoId}`, { method: 'DELETE' }),

  responderAvaliacao: (avaliacaoId: string, resposta: string) =>
    request<Avaliacao>(`/avaliacoes/${avaliacaoId}/resposta`, { method: 'PATCH', body: JSON.stringify({ resposta }) }),

  solicitarCertificado: (paginaId: string) =>
    request<Certificado>(`/paginas/${paginaId}/certificados`, { method: 'POST' }),

  listarNotificacoes: (apenasNaoLidas = false) =>
    request<{ notificacoes: Notificacao[] }>(
      `/notificacoes?limit=30${apenasNaoLidas ? '&status=nao_lidas' : ''}`
    ),

  contarNaoLidas: () => request<{ total: number }>('/notificacoes/contagem-nao-lidas'),

  marcarNotificacaoComoLida: (id: string) => request<void>(`/notificacoes/${id}/ler`, { method: 'PATCH' }),

  marcarTodasNotificacoesComoLidas: () => request<void>('/notificacoes/marcar-todas-lidas', { method: 'PATCH' }),
}
