'use client'

import { useEffect, useRef, useState } from 'react'
import GlassCard from '@/components/GlassCard'
import Button from '@/components/Button'
import { BellIcon } from '@/components/icons'
import { api, type Notificacao } from '@/lib/api'
import Carregando from '@/components/Carregando'
import { destinoNotificacao } from '@/lib/destinoNotificacao'

const POLL_MS = 60_000

// rotulo: mostra o texto ao lado do sino (menu principal)
export default function NotificationBell({ rotulo }: { rotulo?: string } = {}) {
  const [total, setTotal] = useState(0)
  const [aberto, setAberto] = useState(false)
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [carregando, setCarregando] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  function atualizarContagem() {
    api
      .contarNaoLidas()
      .then(({ total }) => setTotal(total))
      .catch(() => {})
  }

  useEffect(() => {
    atualizarContagem()
    const intervalo = setInterval(atualizarContagem, POLL_MS)
    return () => clearInterval(intervalo)
  }, [])

  useEffect(() => {
    function aoClicarFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', aoClicarFora)
    return () => document.removeEventListener('mousedown', aoClicarFora)
  }, [])

  function alternarPainel() {
    const novoEstado = !aberto
    setAberto(novoEstado)
    if (novoEstado) {
      setCarregando(true)
      api
        .listarNotificacoes()
        .then(({ notificacoes }) => setNotificacoes(notificacoes))
        .catch(() => {})
        .finally(() => setCarregando(false))
    }
  }

  function clicar(n: Notificacao) {
    if (!n.lida) marcarComoLida(n.id)
    const destino = destinoNotificacao(n)
    if (!destino) return
    setAberto(false)
    if (destino.startsWith('/#') && window.location.pathname === '/') window.location.hash = destino.slice(1)
    else window.location.href = destino
  }

  async function marcarComoLida(id: string) {
    setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)))
    setTotal((prev) => Math.max(0, prev - 1))
    try {
      await api.marcarNotificacaoComoLida(id)
    } catch {
      // mantém o estado otimista mesmo em caso de falha silenciosa
    }
  }

  async function marcarTodasComoLidas() {
    const anterior = notificacoes
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })))
    setTotal(0)
    try {
      await api.marcarTodasNotificacoesComoLidas()
    } catch {
      setNotificacoes(anterior)
      atualizarContagem()
    }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={alternarPainel}
        aria-label={total > 0 ? `Notificações: ${total} não lidas` : 'Notificações'}
        className={rotulo ? 'nav-item' : undefined}
        style={rotulo ? undefined : {
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '2.25rem',
          height: '2.25rem',
          borderRadius: 'var(--radius-md)',
          background: aberto ? 'var(--c-glass-bg-sm)' : 'transparent',
          border: '1px solid var(--c-btn-ghost-border)',
          color: 'var(--c-btn-ghost-text)',
          cursor: 'pointer',
        }}
      >
        <BellIcon />
        {rotulo && <span className="nav-rotulo">{rotulo}</span>}
        {total > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              minWidth: '1.05rem',
              height: '1.05rem',
              padding: '0 0.25rem',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#fff',
              fontSize: '0.625rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              boxShadow: '0 0 0 2px var(--c-bg)',
            }}
          >
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>

      {aberto && (
        <GlassCard
          variant="lg"
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            right: 0,
            width: '340px',
            maxWidth: 'calc(100vw - 2rem)',
            maxHeight: '420px',
            overflowY: 'auto',
            padding: '1rem',
            zIndex: 200,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>Notificações</h3>
            <Button variant="ghost" size="sm" onClick={marcarTodasComoLidas} disabled={total === 0} style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}>
              Marcar todas como lidas
            </Button>
          </div>

          {carregando ? (
            <Carregando compacto />
          ) : notificacoes.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: 'var(--c-text-3)', textAlign: 'center', padding: '1.5rem 0' }}>
              Nenhuma notificação por aqui.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {notificacoes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => clicar(n)}
                  style={{
                    padding: '0.65rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: n.lida ? 'var(--c-glass-bg-sm)' : 'var(--c-glass-bg-blue)',
                    border: n.lida ? 'var(--c-border-sm)' : 'var(--c-border-blue)',
                    cursor: n.lida && !destinoNotificacao(n) ? 'default' : 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {!n.lida && (
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: 'var(--blue-400)',
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--c-text-1)' }}>{n.titulo}</span>
                  </div>
                  <p
                    style={{
                      margin: '0.25rem 0 0.3rem',
                      fontSize: '0.75rem',
                      color: 'var(--c-text-2)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {n.corpo}
                  </p>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--c-text-3)' }}>
                    {new Date(n.criada_em).toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}
    </div>
  )
}
