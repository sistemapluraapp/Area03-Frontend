const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''

export class ApiError extends Error {}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')

  const token = typeof window !== 'undefined' ? localStorage.getItem('plura_gov_token') : null
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  if (res.status === 204) return undefined as T

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(data?.error ?? 'Erro inesperado ao falar com o servidor')
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
}
