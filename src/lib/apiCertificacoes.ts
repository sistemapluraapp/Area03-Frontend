import { request, requestArquivo } from './api'

// Etapa 8b: certificações publicadas pelo ADM e inscrições da página
// (idêntico nas Áreas 02 e 03).

export type TipoRequisito = 'arquivo' | 'texto' | 'formulario' | 'link' | 'video' | 'vistoria'
export type TipoCampo = 'texto_curto' | 'texto_longo' | 'numero' | 'data' | 'sim_nao' | 'opcoes'

export interface CampoFormulario {
  rotulo: string
  tipo: TipoCampo
  obrigatorio: boolean
  opcoes?: string[]
}

export interface Requisito {
  id: string
  titulo: string
  descricao: string | null
  tipo: TipoRequisito
  obrigatorio: boolean
  config: { campos?: CampoFormulario[]; max_arquivos?: number }
}

export interface Etapa {
  id: string
  titulo: string
  descricao: string | null
  modo: 'sequencial' | 'paralela'
  requisitos: Requisito[]
}

export interface Certificacao {
  id: string
  titulo: string
  resumo: string | null
  descricao: string | null
  imagem_url: string | null
  icone: string | null
  escopo: 'b2b' | 'b2g' | 'ambos'
  pais: string
  uf: string | null
  cidade: string | null
  validade_meses: number | null
  gratuita: boolean
  total_etapas?: number
  total_requisitos?: number
  etapas?: Etapa[]
}

export interface BlocoPagina {
  tipo: 'titulo' | 'texto' | 'imagem' | 'link'
  texto?: string
  html?: string
  url?: string
  alt?: string
}

export type StatusInscricao = 'em_andamento' | 'enviada' | 'aprovada' | 'reprovada' | 'cancelada'
export type StatusResposta = 'rascunho' | 'enviada' | 'aprovada' | 'ajustes'

export interface Inscricao {
  id: string
  status: StatusInscricao
  created_at: string
  enviada_em: string | null
  decidida_em: string | null
  concedida_em: string | null
  expira_em: string | null
  observacao_adm: string | null
  codigo?: string | null
  certificacao: Pick<Certificacao, 'id' | 'titulo' | 'resumo' | 'icone' | 'imagem_url' | 'validade_meses'> | null
}

export interface Resposta {
  requisito_id: string
  valor: {
    texto?: string
    url?: string
    respostas?: (string | null)[]
    // arquivo: ArquivoEnviado[]; vistoria: DataVistoria[]
    itens?: (ArquivoEnviado | DataVistoria)[]
    contato?: string
    observacoes?: string
    confirmada?: { data: string; periodo: string } | null
  }
  status: StatusResposta
  comentario_adm: string | null
  updated_at: string
}

export interface ArquivoEnviado {
  chave: string
  nome: string
  tamanho: number
  tipo: string
  enviado_em: string
}

export interface DataVistoria {
  data: string
  periodo: 'manha' | 'tarde'
}

export const EXTENSOES_ACEITAS = '.pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx,.xls,.xlsx,.odt,.ods,.txt,.csv,.mp4,.mov'
export const MAX_ARQUIVO_BYTES = 25 * 1024 * 1024

export function tamanhoLegivel(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
}

export interface InscricaoDetalhe extends Omit<Inscricao, 'certificacao'> {
  certificacao_id: string
  pagina_id: string
  certificacao: Certificacao & { etapas: Etapa[] }
  respostas: Resposta[]
  etapas_liberadas: { etapa_id: string; aprovada: boolean }[]
}

export const ROTULO_STATUS_INSCRICAO: Record<StatusInscricao, { texto: string; cor: string; fundo: string }> = {
  em_andamento: { texto: 'Em preenchimento', cor: 'var(--c-accent-text)', fundo: 'var(--c-accent-soft)' },
  enviada: { texto: 'Em análise pela Plura', cor: 'var(--c-warning-text, #8a5a00)', fundo: 'var(--c-warning-soft, #fff4d6)' },
  aprovada: { texto: 'Certificada', cor: 'var(--c-success-text)', fundo: 'var(--c-success-soft)' },
  reprovada: { texto: 'Não aprovada', cor: 'var(--c-danger-text)', fundo: 'var(--c-danger-soft)' },
  cancelada: { texto: 'Cancelada', cor: 'var(--c-text-3)', fundo: 'var(--c-glass-bg-sm)' },
}

export function regiao(c: Pick<Certificacao, 'pais' | 'uf' | 'cidade'>) {
  if (c.cidade) return `${c.cidade}/${c.uf}`
  if (c.uf) return `Estado: ${c.uf}`
  return c.pais === 'BR' ? 'Todo o Brasil' : `País: ${c.pais}`
}

export const apiCertificacoes = {
  listar: () => request<{ pagina: { titulo: string; subtitulo: string | null; blocos: BlocoPagina[] }; certificacoes: Certificacao[] }>('/certificacoes'),
  obter: (id: string) => request<Certificacao & { etapas: Etapa[] }>(`/certificacoes/${id}`),
  inscricoes: (paginaId: string) => request<{ inscricoes: Inscricao[] }>(`/paginas/${paginaId}/inscricoes`),
  inscrever: (paginaId: string, certificacaoId: string) =>
    request<{ id: string; status: StatusInscricao }>(`/paginas/${paginaId}/inscricoes`, { method: 'POST', body: JSON.stringify({ certificacao_id: certificacaoId }) }),
  inscricao: (paginaId: string, inscricaoId: string) => request<InscricaoDetalhe>(`/paginas/${paginaId}/inscricoes/${inscricaoId}`),
  salvarResposta: (paginaId: string, inscricaoId: string, requisitoId: string, valor: Resposta['valor']) =>
    request<Resposta>(`/paginas/${paginaId}/inscricoes/${inscricaoId}/respostas/${requisitoId}`, { method: 'PUT', body: JSON.stringify({ valor }) }),
  enviar: (paginaId: string, inscricaoId: string) => request<{ status: StatusInscricao }>(`/paginas/${paginaId}/inscricoes/${inscricaoId}/enviar`, { method: 'POST' }),
  enviarArquivo: async (paginaId: string, inscricaoId: string, requisitoId: string, arquivo: File) => {
    const corpo = new FormData()
    corpo.append('arquivo', arquivo)
    const res = await requestArquivo(`/paginas/${paginaId}/inscricoes/${inscricaoId}/respostas/${requisitoId}/arquivos`, { method: 'POST', body: corpo })
    return (await res.json()) as Resposta
  },
  removerArquivo: (paginaId: string, inscricaoId: string, requisitoId: string, chave: string) =>
    request<{ ok: true }>(`/paginas/${paginaId}/inscricoes/${inscricaoId}/respostas/${requisitoId}/arquivos?chave=${encodeURIComponent(chave)}`, { method: 'DELETE' }),
  // Baixa pelo backend (com login) e entrega ao navegador como download
  baixarArquivo: async (paginaId: string, inscricaoId: string, requisitoId: string, item: ArquivoEnviado) => {
    const res = await requestArquivo(`/paginas/${paginaId}/inscricoes/${inscricaoId}/respostas/${requisitoId}/arquivos?chave=${encodeURIComponent(item.chave)}`)
    const url = URL.createObjectURL(await res.blob())
    const a = document.createElement('a')
    a.href = url
    a.download = item.nome
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 30000)
  },
  cancelar: (paginaId: string, inscricaoId: string) => request<{ status: StatusInscricao }>(`/paginas/${paginaId}/inscricoes/${inscricaoId}/cancelar`, { method: 'POST' }),
}
