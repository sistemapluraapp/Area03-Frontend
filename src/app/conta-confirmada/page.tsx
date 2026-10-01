'use client'

import { useEffect, useState, type FormEvent } from 'react'
import GlassCard from '@/components/GlassCard'
import Input from '@/components/Input'
import Button from '@/components/Button'
import Grain from '@/components/Grain'
import AcessoRapido from '@/components/AcessoRapido'
import Footer from '@/components/Footer'
import TextoRico from '@/components/TextoRico'
import { EmailIcon } from '@/components/icons'
import { api, type ConteudoPagina } from '@/lib/api'
import { LOGO_DATA_URI } from '@/lib/logo'
import { useTituloPagina } from '@/lib/useTituloPagina'

// Destino do link de confirmação do e-mail. O Supabase valida o link e
// redireciona para cá com o resultado no endereço (#access_token… quando deu
// certo, #error… quando o link expirou ou já foi usado).
const CHAVE_CONTEUDO = 'pagina_confirmada_gov'
const DESTINO_ENTRAR = '/login'
const PADRAO: ConteudoPagina = {
  titulo: 'Conta institucional confirmada!',
  corpo_html: '<p>Seu e-mail foi confirmado e a conta institucional na Plura já está ativa.</p>',
  botao_texto: 'Entrar na área institucional',
  imagem_url: null,
}

type Estado = 'carregando' | 'confirmada' | 'erro'

function lerResultado(): { estado: Estado; motivo: string | null } {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const query = new URLSearchParams(window.location.search)
  const erro = hash.get('error_code') ?? hash.get('error') ?? query.get('error_code') ?? query.get('error')
  if (erro) return { estado: 'erro', motivo: erro }
  return { estado: 'confirmada', motivo: null }
}

export default function ContaConfirmadaPage() {
  const [estado, setEstado] = useState<Estado>('carregando')
  const [motivo, setMotivo] = useState<string | null>(null)
  const [conteudo, setConteudo] = useState<ConteudoPagina>(PADRAO)
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erroEnvio, setErroEnvio] = useState('')
  useTituloPagina(estado === 'erro' ? 'Link de confirmação inválido' : 'Conta confirmada')

  useEffect(() => {
    const resultado = lerResultado()
    setEstado(resultado.estado)
    setMotivo(resultado.motivo)
    // Tira os tokens do endereço: não ficam no histórico nem são compartilhados por engano
    if (window.location.hash || window.location.search) window.history.replaceState(null, '', window.location.pathname)
    api
      .conteudoPagina(CHAVE_CONTEUDO)
      .then((c) => setConteudo({ ...PADRAO, ...Object.fromEntries(Object.entries(c).filter(([, v]) => v)) }))
      .catch(() => {})
  }, [])

  async function reenviar(e: FormEvent) {
    e.preventDefault()
    setErroEnvio('')
    setMensagem('')
    setEnviando(true)
    try {
      const r = await api.reenviarConfirmacao(email.trim())
      setMensagem(r.message)
    } catch (err) {
      setErroEnvio(err instanceof Error ? err.message : 'Não foi possível reenviar agora')
    } finally {
      setEnviando(false)
    }
  }

  const expirado = motivo === 'otp_expired' || motivo === 'access_denied'

  return (
    <>
      <Grain />
      <AcessoRapido />
      <div id="conteudo" tabIndex={-1} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', position: 'relative', zIndex: 1 }}>
        <GlassCard variant="lg" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem 2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={conteudo.imagem_url || LOGO_DATA_URI} alt="Plura" style={{ height: '56px', width: 'auto', objectFit: 'contain' }} draggable={false} />
          </div>

          {estado === 'carregando' && <p style={{ textAlign: 'center', color: 'var(--c-text-3)', fontFamily: 'var(--font-mono)' }}>confirmando…</p>}

          {estado === 'confirmada' && (
            <div role="status">
              <div aria-hidden style={{ width: '56px', height: '56px', margin: '0 auto 1rem', borderRadius: '50%', background: 'var(--c-success-soft)', color: 'var(--c-success-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 800 }}>
                ✓
              </div>
              <h1 style={{ textAlign: 'center', fontSize: '1.625rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>{conteudo.titulo}</h1>
              <div style={{ color: 'var(--c-text-2)', fontSize: '1rem', marginBottom: '1.5rem' }}>
                <TextoRico valor={conteudo.corpo_html} />
              </div>
              <a href={DESTINO_ENTRAR} style={{ display: 'block', textAlign: 'center', padding: '0.875rem 1rem', borderRadius: '0.875rem', background: 'linear-gradient(135deg,#1a7aff,#0062e6)', color: '#fff', fontWeight: 700, textDecoration: 'none' }}>
                {conteudo.botao_texto}
              </a>
            </div>
          )}

          {estado === 'erro' && (
            <div>
              <h1 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
                {expirado ? 'Este link expirou ou já foi usado' : 'Não foi possível confirmar o e-mail'}
              </h1>
              <p style={{ textAlign: 'center', color: 'var(--c-text-2)', marginBottom: '1.5rem', lineHeight: 1.55 }}>
                Se você já confirmou, é só entrar. Se não, peça um novo link de confirmação abaixo.
              </p>
              <form onSubmit={reenviar} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <Input label="E-mail do cadastro" type="email" value={email} onChange={(e) => setEmail(e.target.value)} leadingIcon={<EmailIcon />} />
                {mensagem && <p role="status" style={{ margin: 0, fontSize: '0.875rem', color: 'var(--c-success-text)' }}>{mensagem}</p>}
                {erroEnvio && <p role="alert" style={{ margin: 0, fontSize: '0.875rem', color: 'var(--c-danger-text)' }}>{erroEnvio}</p>}
                <Button type="submit" size="lg" loading={enviando} disabled={!email.trim()} style={{ width: '100%' }}>
                  {enviando ? 'Enviando…' : 'Enviar novo link'}
                </Button>
              </form>
              <a href={DESTINO_ENTRAR} style={{ display: 'block', textAlign: 'center', marginTop: '1rem', color: 'var(--c-text-blue)', fontWeight: 600 }}>
                Já confirmei, quero entrar
              </a>
            </div>
          )}
        </GlassCard>
        <Footer />
      </div>
    </>
  )
}
