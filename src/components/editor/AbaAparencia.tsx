'use client'

import { IconCheck } from '@tabler/icons-react'
import { Secao } from './Campos'
import { TEMAS_PAGINA } from '@/lib/temasPagina'
import type { PropsAba } from './tipos'

// Cor de destaque da página: vale só para a página deste empreendimento e
// colore botões, ícones, barras, selos, chips e um leve tom de fundo.
export default function AbaAparencia({ rascunho: p, alterar }: PropsAba) {
  return (
    <Secao
      titulo="Cor da página"
      descricao="Escolha a cor que combina com o seu empreendimento. Ela aparece nos destaques da sua página (botões, ícones, barras e selos) nos modos claro e escuro, sem atrapalhar a leitura."
    >
      <div role="radiogroup" aria-label="Cor da página" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
        {TEMAS_PAGINA.map((t) => {
          const ativo = p.tema === t.codigo
          return (
            <button
              key={t.codigo}
              type="button"
              role="radio"
              aria-checked={ativo}
              onClick={() => alterar({ tema: t.codigo })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.75rem',
                borderRadius: '0.875rem',
                border: ativo ? '2px solid var(--c-accent-text)' : '1px solid var(--c-input-border)',
                background: 'var(--c-glass-bg-sm)',
                color: 'var(--c-text-1)',
                fontFamily: 'inherit',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span aria-hidden style={{ width: '28px', height: '28px', borderRadius: '50%', background: t.amostra, border: '1px solid rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.codigo === 'branca' || t.codigo === 'amarelo' ? '#111827' : '#fff', flexShrink: 0 }}>
                {ativo && <IconCheck size={16} stroke={2.5} />}
              </span>
              {t.rotulo}
            </button>
          )
        })}
      </div>

      <div data-tema={p.tema} style={{ borderRadius: '1rem', padding: '1.25rem', background: 'var(--p-bg)', border: 'var(--c-border)' }}>
        <p style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Pré-visualização</p>
        <p style={{ fontSize: '1.25rem', fontWeight: 800 }}>{p.nome || 'Nome do empreendimento'}</p>
        <p style={{ color: 'var(--c-text-2)', marginBottom: '0.875rem' }}>{p.subtitulo || 'Subtítulo'}</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ padding: '0.55rem 1.1rem', borderRadius: '0.75rem', background: 'var(--p-accent)', color: 'var(--p-accent-contrast)', fontWeight: 700, fontSize: '0.875rem' }}>Entrar em contato</span>
          <span style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--p-soft-border)', color: 'var(--p-accent-text)', fontWeight: 600, fontSize: '0.875rem' }}>Como chegar</span>
          <span style={{ padding: '0.3rem 0.75rem', borderRadius: '9999px', background: 'var(--p-soft)', color: 'var(--p-accent-text)', fontWeight: 600, fontSize: '0.75rem' }}>Restaurante</span>
          <span style={{ display: 'inline-flex', gap: '4px' }} aria-hidden>
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: i <= 4 ? 'var(--p-accent)' : 'var(--p-soft)' }} />
            ))}
          </span>
        </div>
      </div>
    </Secao>
  )
}
