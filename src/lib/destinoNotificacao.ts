import type { Notificacao } from '@/lib/api'

// Para onde levar a pessoa ao clicar numa notificação (null = só marca como lida)
export function destinoNotificacao(n: Notificacao): string | null {
  const t = String(n.metadata?.pagina_tipo ?? '')
  const daArea = (tipo: string) => tipo === 'publica'
  if (n.tipo === 'convite_equipe') {
    if (daArea(t)) return '/#convites'
    return typeof n.metadata?.link === 'string' ? n.metadata.link : null
  }
  if ((n.tipo === 'convite_equipe_aceito' || n.tipo === 'convite_equipe_recusado') && n.entidade_id && daArea(t)) {
    return `/pagina?id=${n.entidade_id}`
  }
  // Análise de certificação (ADM): abre a inscrição na aba "Selos e certificações"
  if (n.entidade_tipo === 'certificacao_inscricao' && n.entidade_id) {
    const paginaId = String(n.metadata?.pagina_id ?? '')
    if (daArea(t) && paginaId) return `/pagina?id=${paginaId}&aba=selos&inscricao=${n.entidade_id}`
    return typeof n.metadata?.link === 'string' ? n.metadata.link : null
  }
  return null
}
