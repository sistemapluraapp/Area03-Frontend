'use client'

import { useEffect, useState } from 'react'
import { IconCheck, IconUsersGroup, IconX } from '@tabler/icons-react'
import { apiPaginas, type ConviteRecebido } from '@/lib/apiPaginas'

const ROTULO_ABA: Record<string, string> = {
  identidade: 'Identidade', aparencia: 'Cor da página', acessibilidade: 'Acessibilidade', localizacao: 'Localização',
  horarios: 'Horários', galeria: 'Galeria', experiencias: 'Experiências', eventos: 'Eventos', contato: 'Contato',
  antes: 'Antes de ir e segurança', comentarios: 'Avaliações', selos: 'Selos e certificações', equipe: 'Equipe e logs',
}

const botao = { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0.95rem', borderRadius: '0.75rem', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'inherit', cursor: 'pointer' } as const

// Convites para equipes de páginas desta área: aceitar ou recusar.
// Ao aceitar, a página passa a aparecer em "Minhas páginas" (onAceito recarrega).
export default function ConvitesEquipe({ onAceito }: { onAceito: () => void }) {
  const [convites, setConvites] = useState<ConviteRecebido[]>([])
  const [respondendo, setRespondendo] = useState<string | null>(null)
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  useEffect(() => {
    apiPaginas.meusConvites().then((r) => setConvites(r.convites)).catch(() => {})
  }, [])

  // Vindo do sino (/#convites): rola até a seção quando ela aparece
  useEffect(() => {
    function rolar() {
      if (window.location.hash === '#convites') document.getElementById('convites')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    rolar()
    window.addEventListener('hashchange', rolar)
    return () => window.removeEventListener('hashchange', rolar)
  }, [convites.length])

  async function responder(cv: ConviteRecebido, aceitar: boolean) {
    if (!aceitar && !confirm(`Recusar o convite para a equipe de ${cv.pagina_nome}?`)) return
    setRespondendo(cv.id)
    setAviso(null)
    try {
      await apiPaginas.responderConvite(cv.id, aceitar)
      setConvites((l) => l.filter((x) => x.id !== cv.id))
      setAviso({ tipo: 'ok', texto: aceitar ? `Pronto! Você agora faz parte da equipe de ${cv.pagina_nome}.` : `Convite de ${cv.pagina_nome} recusado.` })
      if (aceitar) onAceito()
    } catch (e) {
      setAviso({ tipo: 'erro', texto: e instanceof Error ? e.message : 'Não foi possível responder o convite' })
    } finally {
      setRespondendo(null)
    }
  }

  if (convites.length === 0 && !aviso) return null

  return (
    <section id="convites" aria-labelledby="titulo-convites" style={{ marginBottom: '1.5rem' }}>
      {convites.length > 0 && (
        <h2 id="titulo-convites" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', fontWeight: 800, margin: '0 0 0.75rem' }}>
          <IconUsersGroup size={20} aria-hidden /> Convites para equipes ({convites.length})
        </h2>
      )}
      {aviso && (
        <p role="status" style={{ margin: '0 0 0.75rem', padding: '0.625rem 0.875rem', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 600, background: aviso.tipo === 'ok' ? 'var(--c-success-soft)' : 'var(--c-danger-soft)', color: aviso.tipo === 'ok' ? 'var(--c-success-text)' : 'var(--c-danger-text)' }}>
          {aviso.texto}
        </p>
      )}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {convites.map((cv) => (
          <li key={cv.id} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--c-accent-soft-border)', background: 'var(--c-accent-soft)' }}>
            <span aria-hidden style={{ width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0, background: cv.pagina_logo ? `#fff url("${cv.pagina_logo}") center/cover` : 'var(--c-accent-text)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
              {!cv.pagina_logo && cv.pagina_nome.trim()[0]?.toUpperCase()}
            </span>
            <div style={{ flex: '1 1 240px', minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 700 }}>{cv.pagina_nome}</p>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.8125rem', color: 'var(--c-text-2)', lineHeight: 1.45 }}>
                {cv.convidado_por_nome} convidou você{cv.cargo ? ` como ${cv.cargo}` : ''}.{' '}
                {cv.permissoes.length ? `Abas: ${cv.permissoes.map((a) => ROTULO_ABA[a] ?? a).join(', ')}.` : 'As abas serão liberadas pelo responsável.'}{' '}
                Vale até {new Date(cv.expira_em).toLocaleDateString('pt-BR')}.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" onClick={() => responder(cv, true)} disabled={respondendo === cv.id} style={{ ...botao, border: 'none', background: 'linear-gradient(135deg,#1a7aff,#0062e6)', color: '#fff' }}>
                <IconCheck size={16} aria-hidden /> Aceitar
              </button>
              <button type="button" onClick={() => responder(cv, false)} disabled={respondendo === cv.id} style={{ ...botao, border: '1px solid var(--c-input-border)', background: 'transparent', color: 'var(--c-text-1)' }}>
                <IconX size={16} aria-hidden /> Recusar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
