'use client'

import type { CSSProperties, ReactNode } from 'react'
import Icone from '../Icone'

// Primitivos de formulário do editor de página (compartilhado Áreas 02/03).

export const estiloCampo: CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.875rem',
  background: 'var(--c-input-bg)',
  border: '1px solid var(--c-input-border)',
  borderRadius: '0.75rem',
  color: 'var(--c-input-text)',
  fontSize: '0.9375rem',
  fontFamily: 'inherit',
  outline: 'none',
}

export function Secao({ titulo, descricao, children }: { titulo: string; descricao?: ReactNode; children: ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', borderRadius: '1.25rem', background: 'var(--c-glass-bg)', border: 'var(--c-border)', boxShadow: 'var(--c-shadow-sm)' }}>
      <div>
        <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: 0 }}>{titulo}</h2>
        {descricao && <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--c-text-2)', lineHeight: 1.55 }}>{descricao}</p>}
      </div>
      {children}
    </section>
  )
}

export function Campo({ rotulo, ajuda, contador, children, destaque }: { rotulo: string; ajuda?: ReactNode; contador?: string; children: ReactNode; destaque?: boolean }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', minWidth: 0 }}>
      <span style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', fontSize: destaque ? '0.9375rem' : '0.875rem', fontWeight: destaque ? 700 : 600, color: 'var(--c-input-label)' }}>
        {rotulo}
        {contador && <span style={{ fontWeight: 400, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--c-text-3)' }}>{contador}</span>}
      </span>
      {children}
      {ajuda && <span style={{ fontSize: '0.8125rem', color: 'var(--c-input-helper)', lineHeight: 1.5 }}>{ajuda}</span>}
    </label>
  )
}

export function Grade({ colunas = 2, children }: { colunas?: number; children: ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${colunas >= 3 ? 180 : 240}px, 1fr))`, gap: '1rem' }}>{children}</div>
}

export function Texto({ valor, onChange, placeholder, max, tipo = 'text', inputMode }: { valor: string | null; onChange: (v: string) => void; placeholder?: string; max?: number; tipo?: string; inputMode?: 'text' | 'numeric' | 'tel' | 'url' | 'email' }) {
  return <input type={tipo} inputMode={inputMode} value={valor ?? ''} maxLength={max} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={estiloCampo} />
}

export function AreaTexto({ valor, onChange, placeholder, max, linhas = 4 }: { valor: string | null; onChange: (v: string) => void; placeholder?: string; max?: number; linhas?: number }) {
  return <textarea value={valor ?? ''} maxLength={max} rows={linhas} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={{ ...estiloCampo, resize: 'vertical', lineHeight: 1.55 }} />
}

export function Selecao({ valor, onChange, opcoes, vazio }: { valor: string | number | null; onChange: (v: string) => void; opcoes: { valor: string | number; rotulo: string }[]; vazio?: string }) {
  return (
    <select value={valor ?? ''} onChange={(e) => onChange(e.target.value)} style={estiloCampo}>
      {vazio !== undefined && <option value="">{vazio}</option>}
      {opcoes.map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.rotulo}
        </option>
      ))}
    </select>
  )
}

// Chip selecionável com ícone (tags, antes de ir, recursos...)
export function Chip({ ativo, onClick, icone, children, desativado, titulo }: { ativo: boolean; onClick: () => void; icone?: string | null; children: ReactNode; desativado?: boolean; titulo?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desativado}
      aria-pressed={ativo}
      title={titulo}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.45rem 0.875rem',
        borderRadius: '9999px',
        fontSize: '0.8125rem',
        fontWeight: 600,
        fontFamily: 'inherit',
        cursor: desativado ? 'not-allowed' : 'pointer',
        opacity: desativado ? 0.5 : 1,
        border: ativo ? '1px solid var(--c-accent-soft-border)' : '1px solid var(--c-input-border)',
        background: ativo ? 'var(--c-accent-soft)' : 'var(--c-glass-bg-sm)',
        color: ativo ? 'var(--c-accent-text)' : 'var(--c-text-2)',
      }}
    >
      {icone !== undefined && <Icone nome={icone} size={16} />}
      {children}
    </button>
  )
}

export function Interruptor({ ativo, onChange, rotulo }: { ativo: boolean; onChange: (v: boolean) => void; rotulo: string }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', fontSize: '0.9375rem', color: 'var(--c-text-1)' }}>
      <button
        type="button"
        role="switch"
        aria-checked={ativo}
        onClick={() => onChange(!ativo)}
        style={{ width: '2.5rem', height: '1.375rem', borderRadius: '9999px', border: 'none', position: 'relative', cursor: 'pointer', flexShrink: 0, background: ativo ? 'linear-gradient(135deg,#1a7aff,#0062e6)' : 'var(--c-text-4)' }}
      >
        <span style={{ position: 'absolute', top: '3px', left: ativo ? 'calc(100% - 1.125rem - 3px)' : '3px', width: '1.125rem', height: '1rem', borderRadius: '9999px', background: '#fff', transition: 'left 150ms ease' }} />
      </button>
      {rotulo}
    </label>
  )
}

export function Aviso({ tipo = 'info', children }: { tipo?: 'info' | 'erro' | 'sucesso'; children: ReactNode }) {
  const cores = {
    info: { fundo: 'var(--c-accent-soft)', borda: 'var(--c-accent-soft-border)', texto: 'var(--c-text-1)' },
    erro: { fundo: 'var(--c-danger-soft)', borda: 'var(--c-danger-border)', texto: 'var(--c-danger-text)' },
    sucesso: { fundo: 'var(--c-success-soft)', borda: 'var(--c-success-text)', texto: 'var(--c-success-text)' },
  }[tipo]
  return (
    <div role={tipo === 'erro' ? 'alert' : 'status'} style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', background: cores.fundo, border: `1px solid ${cores.borda}`, color: cores.texto, fontSize: '0.875rem', lineHeight: 1.55 }}>
      {children}
    </div>
  )
}
