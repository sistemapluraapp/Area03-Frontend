'use client'

import type { CSSProperties } from 'react'
import { IconCertificate } from '@tabler/icons-react'
import Icone from '@/components/Icone'
import TextoRico from '@/components/TextoRico'
import type { BlocoPagina, StatusInscricao } from '@/lib/apiCertificacoes'
import { ROTULO_STATUS_INSCRICAO } from '@/lib/apiCertificacoes'

// Peças visuais compartilhadas pelas telas de certificações (8b)

export const botaoPrimario: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.125rem', borderRadius: '0.75rem', border: 'none', background: 'linear-gradient(135deg,#1a7aff,#0062e6)', color: '#fff', fontWeight: 700, fontFamily: 'inherit', fontSize: '0.9375rem', cursor: 'pointer', textDecoration: 'none' }
export const botaoSecundario: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--c-input-border)', background: 'transparent', color: 'var(--c-text-1)', fontWeight: 600, fontFamily: 'inherit', fontSize: '0.875rem', cursor: 'pointer', textDecoration: 'none' }

export function IconeCertificacao({ icone, tamanho = 44 }: { icone: string | null; tamanho?: number }) {
  return (
    <span aria-hidden style={{ width: tamanho, height: tamanho, borderRadius: '0.875rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--c-accent-soft)', color: 'var(--c-accent-text)' }}>
      {icone ? <Icone nome={icone} size={tamanho / 2} /> : <IconCertificate size={tamanho / 2} />}
    </span>
  )
}

export function SeloStatus({ status }: { status: StatusInscricao }) {
  const s = ROTULO_STATUS_INSCRICAO[status]
  return <span style={{ display: 'inline-block', padding: '0.15rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, color: s.cor, background: s.fundo }}>{s.texto}</span>
}

// Blocos da "Página de certificações" editada no ADM
export function BlocosPagina({ blocos }: { blocos: BlocoPagina[] }) {
  if (!blocos.length) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.75rem' }}>
      {blocos.map((b, i) => {
        if (b.tipo === 'titulo') return <h2 key={i} style={{ fontSize: '1.1875rem', fontWeight: 800, margin: '0.5rem 0 0' }}>{b.texto}</h2>
        if (b.tipo === 'texto') return <TextoRico key={i} valor={b.html} style={{ color: 'var(--c-text-2)', lineHeight: 1.6 }} />
        if (b.tipo === 'imagem' && b.url)
          // eslint-disable-next-line @next/next/no-img-element
          return <img key={i} src={b.url} alt={b.alt ?? ''} style={{ width: '100%', maxHeight: '360px', objectFit: 'cover', borderRadius: '1rem' }} />
        if (b.tipo === 'link' && b.url)
          return (
            <a key={i} href={b.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--c-accent-text)', fontWeight: 700 }}>
              {b.texto || b.url}
            </a>
          )
        return null
      })}
    </div>
  )
}
