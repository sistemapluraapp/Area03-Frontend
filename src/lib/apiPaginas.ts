import { request } from './api'
import type { TemaPagina } from './temasPagina'

// Cliente da API de gestão da página do empreendimento (idêntico nas
// Áreas 02 e 03; cada uma aponta para o próprio backend).

export type DiaSemana = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom'
export type Turno = { abre: string; fecha: string }
export type Horarios = Partial<Record<DiaSemana, Turno[]>>

export const CAMPOS_SEGURANCA = ['informacoes', 'requisitos', 'equipamentos', 'profissionais', 'procedimentos', 'contatos_emergencia'] as const
export type CampoSeguranca = (typeof CAMPOS_SEGURANCA)[number]

export interface PaginaCompleta {
  id: string
  tipo: 'privada' | 'publica'
  nome: string
  subtitulo: string | null
  descricao_curta: string | null
  descricao: string | null
  slogan: string | null
  diferencial: string | null
  categoria: string | null
  faixa_preco: number | null
  tags: string[]
  tema: TemaPagina
  cnpj: string | null
  legado: boolean
  whatsapp: string | null
  instagram: string | null
  website: string | null
  video_apresentacao: string | null
  cep: string | null
  endereco: string | null
  cidade: string | null
  uf: string | null
  complemento: string | null
  latitude: number | null
  longitude: number | null
  ponto_referencia: string | null
  como_chegar_carro: string | null
  como_chegar_transporte: string | null
  rota_acessivel: string | null
  horarios: Horarios
  feriados: string | null
  requer_agendamento: boolean
  tempo_medio: string | null
  antecedencia: string | null
  logo_url: string | null
  capa_url: string | null
  recursos_acessibilidade: string[]
  destaques_acessibilidade: string[]
  observacoes_recursos: Record<string, string>
  antes_de_ir: string[]
  antes_de_ir_observacoes: string | null
  seguranca: Partial<Record<CampoSeguranca, string>>
  suspensa: boolean
  created_at: string
  updated_at: string
}

export type FormatoLink = 'video' | 'reel' | 'foto_360' | 'tour_virtual'

export interface Midia {
  id: string
  tipo: 'foto' | 'link'
  url: string
  plataforma: string | null
  formato: FormatoLink | null
  categoria: string | null
  legenda: string | null
  texto_alt: string | null
  ordem: number
  created_at: string
}

export interface Experiencia {
  id: string
  pagina_id: string
  nome: string
  descricao: string | null
  imagem_url: string | null
  duracao: string | null
  preco_a_partir: number | null
  local: string | null
  faixa_etaria: string | null
  nivel_dificuldade: 'todos' | 'facil' | 'moderado' | 'dificil' | null
  requer_acompanhamento: boolean
  equipamentos: string | null
  o_que_levar: string | null
  acessibilidades: string[]
  ordem: number
  ativo: boolean
}

export interface AvaliacaoRecebida {
  id: string
  usuario_id: string
  nota: number
  comentario: string | null
  status: 'pendente' | 'aprovado' | 'reprovado'
  created_at: string
}

export interface VinculoPagina {
  id: string
  usuario_id: string | null
  gov_conta_id?: string | null
  papel: 'administrador' | 'colaborador'
  created_at: string
  usuarios?: { nome: string } | null
}

export interface CertificadoPagina {
  id: string
  status: 'pendente' | 'aprovado' | 'reprovado'
  solicitado_em: string
  avaliado_em: string | null
}

export interface PaginaDetalhe extends PaginaCompleta {
  vinculos: VinculoPagina[]
  avaliacoes: AvaliacaoRecebida[]
  certificados: CertificadoPagina[]
  midias: Midia[]
  experiencias: Experiencia[]
}

export interface OpcaoCatalogo {
  codigo: string
  rotulo: string
  icone: string | null
}

export interface GrupoOpcoes extends OpcaoCatalogo {
  descricao: string | null
  recursos: (OpcaoCatalogo & { descricao: string | null })[]
}

export interface Opcoes {
  categorias: OpcaoCatalogo[]
  tags: OpcaoCatalogo[]
  antes_de_ir: OpcaoCatalogo[]
  grupos_acessibilidade: GrupoOpcoes[]
}

export type CamposEditaveis = Partial<Omit<PaginaCompleta, 'id' | 'tipo' | 'legado' | 'logo_url' | 'capa_url' | 'latitude' | 'longitude' | 'suspensa' | 'created_at' | 'updated_at'>>

const imagem = (imagemBase64: string, extensao: string) => JSON.stringify({ imagem_base64: imagemBase64, extensao })

export const apiPaginas = {
  opcoes: () => request<Opcoes>('/opcoes'),

  minhas: () => request<{ paginas: { papel: string; paginas: PaginaCompleta }[] }>('/minhas-paginas'),

  criar: (body: CamposEditaveis & { nome: string; cnpj: string }) =>
    request<PaginaCompleta>('/paginas', { method: 'POST', body: JSON.stringify(body) }),

  obter: (id: string) => request<PaginaDetalhe>(`/paginas/${id}`),

  atualizar: (id: string, patch: CamposEditaveis) =>
    request<PaginaCompleta>(`/paginas/${id}`, { method: 'PUT', body: JSON.stringify(patch) }),

  uploadLogo: (id: string, base64: string, extensao: string) =>
    request<{ logo_url: string }>(`/paginas/${id}/logo`, { method: 'POST', body: imagem(base64, extensao) }),

  uploadCapa: (id: string, base64: string, extensao: string) =>
    request<{ capa_url: string }>(`/paginas/${id}/capa`, { method: 'POST', body: imagem(base64, extensao) }),

  adicionarFoto: (id: string, base64: string, extensao: string, meta: { categoria?: string | null; legenda?: string; texto_alt?: string }) =>
    request<Midia>(`/paginas/${id}/midias/foto`, { method: 'POST', body: JSON.stringify({ imagem_base64: base64, extensao, ...meta }) }),

  adicionarLink: (id: string, body: { url: string; formato: FormatoLink; categoria?: string | null; legenda?: string }) =>
    request<Midia>(`/paginas/${id}/midias/link`, { method: 'POST', body: JSON.stringify(body) }),

  atualizarMidia: (id: string, midiaId: string, patch: Partial<Pick<Midia, 'categoria' | 'legenda' | 'texto_alt' | 'formato' | 'ordem'>>) =>
    request<Midia>(`/paginas/${id}/midias/${midiaId}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  removerMidia: (id: string, midiaId: string) => request<void>(`/paginas/${id}/midias/${midiaId}`, { method: 'DELETE' }),

  criarExperiencia: (id: string, body: Partial<Experiencia>) =>
    request<Experiencia>(`/paginas/${id}/experiencias`, { method: 'POST', body: JSON.stringify(body) }),

  atualizarExperiencia: (id: string, experienciaId: string, body: Partial<Experiencia>) =>
    request<Experiencia>(`/paginas/${id}/experiencias/${experienciaId}`, { method: 'PUT', body: JSON.stringify(body) }),

  removerExperiencia: (id: string, experienciaId: string) =>
    request<void>(`/paginas/${id}/experiencias/${experienciaId}`, { method: 'DELETE' }),

  uploadImagemExperiencia: (id: string, experienciaId: string, base64: string, extensao: string) =>
    request<{ imagem_url: string }>(`/paginas/${id}/experiencias/${experienciaId}/imagem`, { method: 'POST', body: imagem(base64, extensao) }),
}

// Máscaras e validação usadas nos formulários
export function formatarCnpj(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 14)
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export function cnpjValido(valor: string): boolean {
  const cnpj = valor.replace(/\D/g, '')
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false
  const calc = (base: string) => {
    const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const resto = base.split('').reduce((acc, d, i) => acc + Number(d) * pesos[i], 0) % 11
    return resto < 2 ? 0 : 11 - resto
  }
  const d1 = calc(cnpj.slice(0, 12))
  return cnpj.endsWith(`${d1}${calc(cnpj.slice(0, 12) + d1)}`)
}

export function formatarTelefone(valor: string): string {
  let d = valor.replace(/\D/g, '')
  if (d.length > 11 && d.startsWith('55')) d = d.slice(2)
  d = d.slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}
