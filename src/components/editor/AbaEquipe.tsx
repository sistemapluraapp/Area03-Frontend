'use client'

import { useState, type FormEvent } from 'react'
import { IconTrash, IconUserPlus } from '@tabler/icons-react'
import { Aviso, Campo, Secao, Texto } from './Campos'
import { api } from '@/lib/api'
import type { PropsAba } from './tipos'

// Específico da Área 03: colaboradores são contas Gov convidadas pelo e-mail.
export default function AbaEquipe({ rascunho: p, aplicarSalvo }: PropsAba) {
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const vinculos = p.vinculos ?? []

  async function convidar(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setEnviando(true)
    setErro('')
    try {
      const vinculo = await api.convidarColaborador(p.id, email.trim())
      aplicarSalvo({ vinculos: [...vinculos, vinculo] })
      setEmail('')
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao convidar colaborador')
    } finally {
      setEnviando(false)
    }
  }

  async function remover(vinculoId: string) {
    if (!confirm('Remover este colaborador?')) return
    try {
      await api.removerColaborador(p.id, vinculoId)
      aplicarSalvo({ vinculos: vinculos.filter((v) => v.id !== vinculoId) })
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao remover colaborador')
    }
  }

  return (
    <Secao titulo="Equipe" descricao="Colaboradores podem ajudar a manter a página. Só administradores alteram as informações.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {vinculos.map((v) => (
          <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.875rem', borderRadius: '0.75rem', border: '1px solid var(--c-divider)' }}>
            <span style={{ fontSize: '0.9375rem' }}>
              {v.usuarios?.nome ?? `${(v.gov_conta_id ?? v.usuario_id ?? '').slice(0, 8)}…`} <span style={{ color: 'var(--c-text-3)', fontSize: '0.8125rem' }}>({v.papel})</span>
            </span>
            {v.papel === 'colaborador' && (
              <button type="button" onClick={() => remover(v.id)} aria-label="Remover colaborador" style={{ background: 'none', border: '1px solid var(--c-divider)', borderRadius: '0.5rem', padding: '0.35rem', color: 'var(--c-danger-text)', cursor: 'pointer', display: 'flex' }}>
                <IconTrash size={16} aria-hidden />
              </button>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={convidar} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 240px' }}>
          <Campo rotulo="Convidar por e-mail (conta Gov)">
            <Texto valor={email} onChange={setEmail} placeholder="colega@orgao.gov.br" inputMode="email" tipo="email" />
          </Campo>
        </div>
        <button type="submit" disabled={enviando || !email.trim()} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.125rem', borderRadius: '0.75rem', border: 'none', background: 'linear-gradient(135deg,#1a7aff,#0062e6)', color: '#fff', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', opacity: enviando || !email.trim() ? 0.6 : 1 }}>
          <IconUserPlus size={18} aria-hidden /> Convidar
        </button>
      </form>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
    </Secao>
  )
}
