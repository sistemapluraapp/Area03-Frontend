'use client'

import { useEffect, useRef, useState } from 'react'
import Portal from '@/components/Portal'
import TextoRico from '@/components/TextoRico'
import { useFocoPreso } from '@/lib/useFocoPreso'
import { request } from '@/lib/api'

export interface Termo {
  chave: string
  titulo: string
  conteudo_html: string
  atualizado_em: string
}

// Aceite obrigatório dos termos e condições (editados no ADM). O texto abre
// num modal acessível; "Aceitar" no modal também marca a caixa.
export default function CheckboxTermos({
  chave,
  aceito,
  onChange,
  erro,
}: {
  chave: string
  aceito: boolean
  onChange: (aceito: boolean) => void
  erro?: string
}) {
  const [aberto, setAberto] = useState(false)
  const idErro = `erro-${chave}`
  return (
    <div style={{ marginTop: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
        <input
          id={`aceite-${chave}`}
          type="checkbox"
          checked={aceito}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? idErro : undefined}
          style={{ width: '1.125rem', height: '1.125rem', marginTop: '0.15rem', accentColor: 'var(--c-text-blue)', flexShrink: 0, cursor: 'pointer' }}
        />
        <label htmlFor={`aceite-${chave}`} style={{ fontSize: '0.9375rem', color: 'var(--c-text-2)', lineHeight: 1.5, cursor: 'pointer' }}>
          Li e aceito os{' '}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              setAberto(true)
            }}
            style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'var(--c-text-blue)', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}
          >
            termos e condições
          </button>
        </label>
      </div>
      {erro && (
        <p id={idErro} role="alert" style={{ margin: '0.375rem 0 0 1.75rem', fontSize: '0.8125rem', color: 'var(--c-danger-text)' }}>
          {erro}
        </p>
      )}
      {aberto && (
        <ModalTermos
          chave={chave}
          onFechar={() => setAberto(false)}
          onAceitar={() => {
            onChange(true)
            setAberto(false)
          }}
        />
      )}
    </div>
  )
}

type PropsModal = { chave: string; onFechar: () => void; onAceitar: () => void }

// O Portal só monta o conteúdo depois da hidratação; o foco preso fica no
// componente de dentro para enxergar o elemento já no <body>.
function ModalTermos(props: PropsModal) {
  return (
    <Portal>
      <ConteudoModal {...props} />
    </Portal>
  )
}

function ConteudoModal({ chave, onFechar, onAceitar }: PropsModal) {
  const ref = useRef<HTMLDivElement>(null)
  const [termo, setTermo] = useState<Termo | null>(null)
  const [falha, setFalha] = useState('')
  useFocoPreso(ref)

  useEffect(() => {
    let ativo = true
    request<Termo>(`/termos/${chave}`)
      .then((t) => ativo && setTermo(t))
      .catch(() => ativo && setFalha('Não foi possível carregar os termos agora. Tente novamente em instantes.'))
    return () => {
      ativo = false
    }
  }, [chave])

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && onFechar()
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [onFechar])

  const titulo = termo?.titulo ?? 'Termos e condições'
  return (
    <>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`titulo-${chave}`}
        style={{ position: 'fixed', inset: 0, zIndex: 9500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(4,4,15,0.72)', backdropFilter: 'blur(6px)' }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onFechar()
        }}
      >
        <div style={{ width: '100%', maxWidth: '640px', maxHeight: 'calc(100vh - 2rem)', display: 'flex', flexDirection: 'column', background: 'var(--c-glass-bg-lg)', backdropFilter: 'blur(24px) saturate(1.8)', border: 'var(--c-border-lg)', borderRadius: 'var(--radius-2xl)', boxShadow: 'var(--c-shadow-lg)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--c-divider)' }}>
            <h2 id={`titulo-${chave}`} style={{ fontSize: '1.125rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              {titulo}
            </h2>
            <button type="button" onClick={onFechar} aria-label="Fechar" style={{ background: 'none', border: 'none', fontSize: '1.5rem', lineHeight: 1, color: 'var(--c-text-2)', cursor: 'pointer', padding: '0.25rem' }}>
              ×
            </button>
          </div>
          <div tabIndex={0} aria-label="Texto dos termos" style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', fontSize: '0.9375rem', lineHeight: 1.65, color: 'var(--c-text-1, inherit)' }}>
            {falha ? (
              <p role="alert" style={{ color: 'var(--c-danger-text)' }}>{falha}</p>
            ) : termo ? (
              <TextoRico valor={termo.conteudo_html} />
            ) : (
              <p aria-live="polite" style={{ color: 'var(--c-text-2)' }}>Carregando os termos…</p>
            )}
            {termo && (
              <p style={{ marginTop: '1.25rem', fontSize: '0.8125rem', color: 'var(--c-text-2)' }}>
                Atualizado em {new Date(termo.atualizado_em).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.5rem', borderTop: '1px solid var(--c-divider)', flexWrap: 'wrap' }}>
            <button type="button" onClick={onFechar} style={{ padding: '0.625rem 1.125rem', borderRadius: '0.75rem', border: 'var(--c-border)', background: 'transparent', color: 'inherit', font: 'inherit', fontWeight: 600, cursor: 'pointer' }}>
              Fechar
            </button>
            <button type="button" onClick={onAceitar} disabled={!termo} style={{ padding: '0.625rem 1.125rem', borderRadius: '0.75rem', border: 'none', background: 'var(--c-text-blue)', color: '#fff', font: 'inherit', fontWeight: 700, cursor: termo ? 'pointer' : 'not-allowed', opacity: termo ? 1 : 0.6 }}>
              Aceitar os termos
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
