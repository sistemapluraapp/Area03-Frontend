'use client'

import { IconStarFilled } from '@tabler/icons-react'
import { Aviso, Secao } from './Campos'
import type { PropsAba } from './tipos'

const STATUS = {
  pendente: { rotulo: 'Aguardando moderação', cor: 'var(--c-warning-text)', fundo: 'var(--c-warning-soft)' },
  aprovado: { rotulo: 'Publicado', cor: 'var(--c-success-text)', fundo: 'var(--c-success-soft)' },
  reprovado: { rotulo: 'Não aprovado', cor: 'var(--c-danger-text)', fundo: 'var(--c-danger-soft)' },
} as const

export default function AbaComentarios({ rascunho: p }: PropsAba) {
  const avaliacoes = p.avaliacoes ?? []
  const publicados = avaliacoes.filter((a) => a.status === 'aprovado')
  const media = publicados.length ? publicados.reduce((s, a) => s + a.nota, 0) / publicados.length : null

  return (
    <Secao
      titulo={`Comentários recebidos (${avaliacoes.length})`}
      descricao={media !== null ? `Nota média dos comentários publicados: ${media.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} / 5` : undefined}
    >
      <Aviso>Todo comentário passa pela moderação da Plura antes de aparecer na sua página.</Aviso>
      {avaliacoes.length === 0 && <p style={{ color: 'var(--c-text-3)' }}>Nenhum comentário ainda.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {avaliacoes.map((a) => {
          const st = STATUS[a.status] ?? STATUS.pendente
          return (
            <div key={a.id} style={{ padding: '0.875rem 1rem', borderRadius: '0.875rem', border: '1px solid var(--c-divider)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
                <span style={{ display: 'inline-flex', color: '#f59e0b' }} aria-label={`Nota ${a.nota} de 5`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <IconStarFilled key={i} size={14} style={{ opacity: i < a.nota ? 1 : 0.2 }} />
                  ))}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--c-text-3)' }}>{new Date(a.created_at).toLocaleDateString('pt-BR')}</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px', color: st.cor, background: st.fundo }}>{st.rotulo}</span>
              </div>
              <p style={{ fontSize: '0.9375rem', lineHeight: 1.6 }}>{a.comentario || <em style={{ color: 'var(--c-text-3)' }}>Sem texto</em>}</p>
            </div>
          )
        })}
      </div>
    </Secao>
  )
}
