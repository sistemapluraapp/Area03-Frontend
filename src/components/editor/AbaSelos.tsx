'use client'

import { useEffect, useState } from 'react'
import { IconChevronRight, IconSearch } from '@tabler/icons-react'
import Carregando from '@/components/Carregando'
import { Aviso, Secao } from './Campos'
import { IconeCertificacao, SeloStatus, botaoPrimario } from '@/components/certificacoes/Comuns'
import Preenchimento from '@/components/certificacoes/Preenchimento'
import { apiCertificacoes, type Inscricao } from '@/lib/apiCertificacoes'
import type { PropsAba } from './tipos'

// Etapa 8b: inscrições da página nas certificações da Plura (ADM)
function abrirNaUrl(inscricaoId: string | null) {
  const url = new URL(window.location.href)
  if (inscricaoId) url.searchParams.set('inscricao', inscricaoId)
  else url.searchParams.delete('inscricao')
  window.history.replaceState(null, '', url)
}

export default function AbaSelos({ rascunho: p }: PropsAba) {
  const [inscricoes, setInscricoes] = useState<Inscricao[] | null>(null)
  const [aberta, setAberta] = useState<string | null>(null)
  const [erro, setErro] = useState('')

  function carregar() {
    apiCertificacoes
      .inscricoes(p.id)
      .then((r) => setInscricoes(r.inscricoes))
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar as certificações'))
  }

  useEffect(() => {
    setAberta(new URLSearchParams(window.location.search).get('inscricao'))
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.id])

  function abrir(id: string | null) {
    setAberta(id)
    abrirNaUrl(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (!id) carregar()
  }

  if (aberta) return <Preenchimento paginaId={p.id} inscricaoId={aberta} onVoltar={() => abrir(null)} pagina={{ nome: p.nome, cidade: p.cidade ?? null, uf: p.uf ?? null }} />

  const ativas = (inscricoes ?? []).filter((i) => i.status !== 'cancelada')
  const canceladas = (inscricoes ?? []).filter((i) => i.status === 'cancelada')

  return (
    <Secao titulo="Selos e certificações" descricao="Certificações da Plura mostram, com critérios claros, o que foi verificado no seu espaço. Escolha uma, preencha os requisitos e envie para análise.">
      <a href="/certificacoes" style={{ ...botaoPrimario, alignSelf: 'flex-start' }}>
        <IconSearch size={17} aria-hidden /> Buscar certificações
      </a>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      {inscricoes === null ? (
        !erro && <Carregando compacto />
      ) : ativas.length === 0 ? (
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--c-text-3)' }}>Esta página ainda não está inscrita em nenhuma certificação.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {ativas.map((i) => (
            <li key={i.id}>
              <button type="button" onClick={() => abrir(i.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1rem', borderRadius: '1rem', border: 'var(--c-border)', background: 'var(--c-glass-bg)', color: 'inherit', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}>
                <IconeCertificacao icone={i.certificacao?.icone ?? null} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ display: 'block' }}>{i.certificacao?.titulo ?? 'Certificação'}</strong>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem', fontSize: '0.8125rem', color: 'var(--c-text-3)' }}>
                    <SeloStatus status={i.status} />
                    {i.status === 'aprovada' && i.expira_em ? `válida até ${new Date(i.expira_em).toLocaleDateString('pt-BR')}` : `desde ${new Date(i.created_at).toLocaleDateString('pt-BR')}`}
                  </span>
                </span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--c-accent-text)' }}>{i.status === 'em_andamento' ? 'Continuar' : 'Ver'}</span>
                <IconChevronRight size={18} aria-hidden style={{ color: 'var(--c-text-3)' }} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {canceladas.length > 0 && (
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--c-text-3)' }}>
          {canceladas.length === 1 ? '1 inscrição cancelada' : `${canceladas.length} inscrições canceladas`}: {canceladas.map((i) => i.certificacao?.titulo).join(', ')}.
        </p>
      )}
    </Secao>
  )
}
