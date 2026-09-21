'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import GlassCard from '@/components/GlassCard'
import Input from '@/components/Input'
import Button from '@/components/Button'
import Grain from '@/components/Grain'
import Footer from '@/components/Footer'
import GovHeader from '@/components/GovHeader'
import { EmailIcon, CertificateIcon } from '@/components/icons'
import { api, type Pagina, type Vinculo, type Avaliacao, type Certificado } from '@/lib/api'

type Detalhe = Pagina & { vinculos: Vinculo[]; avaliacoes: Avaliacao[]; certificados: Certificado[] }

function PaginaDetalhe() {
  const params = useSearchParams()
  const id = params.get('id') ?? ''
  const [pagina, setPagina] = useState<Detalhe | null>(null)
  const [erro, setErro] = useState('')
  const [emailConvite, setEmailConvite] = useState('')
  const [convidando, setConvidando] = useState(false)
  const [respostas, setRespostas] = useState<Record<string, string>>({})

  async function carregar() {
    try {
      const dados = await api.obterPagina(id)
      setPagina(dados)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Página não encontrada ou sem acesso')
    }
  }

  useEffect(() => {
    if (id) carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function convidar(e: React.FormEvent) {
    e.preventDefault()
    if (!emailConvite.trim()) return
    setConvidando(true)
    setErro('')
    try {
      await api.convidarColaborador(id, emailConvite.trim())
      setEmailConvite('')
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao convidar colaborador')
    } finally {
      setConvidando(false)
    }
  }

  async function remover(vinculoId: string) {
    try {
      await api.removerColaborador(id, vinculoId)
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao remover colaborador')
    }
  }

  async function responder(avaliacaoId: string) {
    const resposta = respostas[avaliacaoId]?.trim()
    if (!resposta) return
    try {
      await api.responderAvaliacao(avaliacaoId, resposta)
      setRespostas((p) => ({ ...p, [avaliacaoId]: '' }))
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao responder avaliação')
    }
  }

  async function solicitarCertificado() {
    try {
      await api.solicitarCertificado(id)
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao solicitar certificado')
    }
  }

  if (erro && !pagina) {
    return <div style={{ padding: '1rem', borderRadius: '0.75rem', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>{erro}</div>
  }
  if (!pagina) return <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--c-text-3)' }}>carregando…</p>

  return (
    <>
      <GlassCard variant="lg">
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--c-text-blue)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{pagina.tipo}</span>
        <h2 style={{ margin: '0.4rem 0', fontSize: '1.375rem', fontWeight: 800 }}>{pagina.nome}</h2>
        <p style={{ color: 'var(--c-text-2)' }}>{pagina.descricao}</p>
      </GlassCard>

      {erro && (
        <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>{erro}</div>
      )}

      <GlassCard style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.0625rem', fontWeight: 700 }}>Colaboradores</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          {pagina.vinculos.map((v) => (
            <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--c-glass-bg-sm)', borderRadius: '0.65rem' }}>
              <span style={{ fontSize: '0.875rem' }}>
                {(v.gov_conta_id ?? v.usuario_id ?? '').slice(0, 8)}… <span style={{ color: 'var(--c-text-3)' }}>({v.papel})</span>
              </span>
              {v.papel === 'colaborador' && (
                <Button variant="danger" size="sm" onClick={() => remover(v.id)}>
                  Remover
                </Button>
              )}
            </div>
          ))}
        </div>
        <form onSubmit={convidar} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <Input label="Convidar por e-mail" placeholder="colega@orgao.gov.br" value={emailConvite} onChange={(e) => setEmailConvite(e.target.value)} leadingIcon={<EmailIcon />} />
          </div>
          <Button type="submit" loading={convidando}>
            Convidar
          </Button>
        </form>
      </GlassCard>

      <GlassCard style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CertificateIcon /> Certificado de Acessibilidade
          </h3>
          <Button size="sm" onClick={solicitarCertificado}>
            Solicitar
          </Button>
        </div>
        {pagina.certificados.length === 0 ? (
          <p style={{ color: 'var(--c-text-3)', fontSize: '0.9rem' }}>Nenhuma solicitação ainda.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pagina.certificados.map((cert) => (
              <div key={cert.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--c-glass-bg-sm)', borderRadius: '0.65rem', fontSize: '0.875rem' }}>
                <span>{new Date(cert.solicitado_em).toLocaleDateString('pt-BR')}</span>
                <span style={{ fontWeight: 700, color: cert.status === 'aprovado' ? '#22c55e' : cert.status === 'reprovado' ? '#ef4444' : 'var(--c-text-2)' }}>{cert.status}</span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <h3 style={{ margin: '2rem 0 1rem', fontSize: '1.0625rem', fontWeight: 700 }}>Avaliações recebidas ({pagina.avaliacoes.length})</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {pagina.avaliacoes.map((a) => (
          <GlassCard key={a.id} variant="sm">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--c-text-blue)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              nota {a.nota}/5 {a.sinalizada && <span style={{ color: '#ef4444' }}>· sinalizada</span>}
            </span>
            <p style={{ margin: '0.4rem 0', fontSize: '0.9375rem' }}>{a.comentario}</p>
            {a.resposta ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--c-text-2)', borderLeft: '2px solid var(--blue-500)', paddingLeft: '0.6rem' }}>Sua resposta: {a.resposta}</p>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input
                  placeholder="Responder…"
                  value={respostas[a.id] ?? ''}
                  onChange={(e) => setRespostas((p) => ({ ...p, [a.id]: e.target.value }))}
                  style={{ flex: 1, padding: '0.5rem 0.75rem', background: 'var(--c-input-bg)', border: '1px solid var(--c-input-border)', borderRadius: '0.65rem', color: 'var(--c-input-text)', fontSize: '0.875rem', fontFamily: 'inherit' }}
                />
                <Button size="sm" onClick={() => responder(a.id)}>
                  Enviar
                </Button>
              </div>
            )}
          </GlassCard>
        ))}
      </div>
    </>
  )
}

export default function PaginaPage() {
  return (
    <>
      <Grain />
      <GovHeader />
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '2rem 1.25rem 3rem', position: 'relative', zIndex: 1 }}>
        <Suspense fallback={<p style={{ fontFamily: 'var(--font-mono)', color: 'var(--c-text-3)' }}>carregando…</p>}>
          <PaginaDetalhe />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
