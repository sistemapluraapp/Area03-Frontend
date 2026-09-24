'use client'

import { useState } from 'react'
import { IconRosetteDiscountCheck, IconSparkles } from '@tabler/icons-react'
import Icone from '../Icone'
import { Aviso, Secao } from './Campos'
import { api } from '@/lib/api'
import type { PropsAba } from './tipos'

// TODO(selos): área de "Selos e certificações" ainda será desenhada (landing
// page com selos, benefícios e botão de solicitar; aprovação pela Área 04).
// Por enquanto esta aba é só uma prévia visual, igual em todas as áreas.
const SELOS_EXEMPLO = [
  { icone: 'wheelchair', rotulo: 'Acessibilidade física' },
  { icone: 'hand-finger', rotulo: 'Libras' },
  { icone: 'braille', rotulo: 'Braille' },
  { icone: 'headphones', rotulo: 'Audiodescrição' },
  { icone: 'brain', rotulo: 'Acessibilidade sensorial' },
]

export default function AbaSelos({ rascunho: p, aplicarSalvo }: PropsAba) {
  const [solicitando, setSolicitando] = useState(false)
  const [erro, setErro] = useState('')
  const certificados = p.certificados ?? []

  async function solicitar() {
    setSolicitando(true)
    setErro('')
    try {
      const cert = await api.solicitarCertificado(p.id)
      aplicarSalvo({ certificados: [...certificados, cert] })
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao solicitar certificado')
    } finally {
      setSolicitando(false)
    }
  }

  return (
    <>
      <Secao titulo="Selos e certificações" descricao="Em breve: selos que mostram, com critérios claros, o que foi verificado no seu empreendimento.">
        <div style={{ position: 'relative', borderRadius: '1rem', padding: '1.25rem', border: '1px dashed var(--c-input-border)', background: 'var(--c-glass-bg-sm)' }}>
          <span style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px', background: 'var(--c-accent-soft)', color: 'var(--c-accent-text)' }}>
            <IconSparkles size={14} aria-hidden /> Em breve
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem', opacity: 0.75 }} aria-hidden>
            {SELOS_EXEMPLO.map((s) => (
              <div key={s.rotulo} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem 0.5rem', borderRadius: '0.875rem', border: 'var(--c-border)', background: 'var(--c-glass-bg)' }}>
                <span style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--c-accent-soft)', color: 'var(--c-accent-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icone nome={s.icone} size={24} />
                </span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, textAlign: 'center' }}>{s.rotulo}</span>
              </div>
            ))}
          </div>
          <button type="button" disabled style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.125rem', borderRadius: '0.75rem', border: '1px solid var(--c-btn-secondary-border)', background: 'var(--c-btn-secondary-bg)', color: 'var(--c-text-2)', fontWeight: 600, fontFamily: 'inherit', cursor: 'not-allowed' }}>
            <IconRosetteDiscountCheck size={18} aria-hidden /> Ver selos e solicitar
          </button>
        </div>
      </Secao>

      <Secao titulo="Certificado de acessibilidade" descricao="Solicitação atual, analisada pela equipe da Plura.">
        {certificados.length === 0 ? (
          <p style={{ color: 'var(--c-text-3)', fontSize: '0.9rem' }}>Nenhuma solicitação ainda.</p>
        ) : (
          certificados.map((cert) => (
            <div key={cert.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--c-glass-bg-sm)', borderRadius: '0.65rem', fontSize: '0.875rem' }}>
              <span>{new Date(cert.solicitado_em).toLocaleDateString('pt-BR')}</span>
              <span style={{ fontWeight: 700, color: cert.status === 'aprovado' ? 'var(--c-success-text)' : cert.status === 'reprovado' ? 'var(--c-danger-text)' : 'var(--c-text-2)' }}>{cert.status}</span>
            </div>
          ))
        )}
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        <button type="button" disabled={solicitando} onClick={solicitar} style={{ alignSelf: 'flex-start', padding: '0.6rem 1.125rem', borderRadius: '0.75rem', border: 'none', background: 'linear-gradient(135deg,#1a7aff,#0062e6)', color: '#fff', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', opacity: solicitando ? 0.6 : 1 }}>
          {solicitando ? 'Enviando…' : 'Solicitar certificado'}
        </button>
      </Secao>
    </>
  )
}
