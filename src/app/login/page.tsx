'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import GlassCard from '@/components/GlassCard'
import Input from '@/components/Input'
import Button from '@/components/Button'
import Grain from '@/components/Grain'
import AcessoRapido from '@/components/AcessoRapido'
import Footer from '@/components/Footer'
import { EmailIcon, LockIcon, EyeIcon } from '@/components/icons'
import { api, ApiError } from '@/lib/api'
import { salvarSessao } from '@/lib/auth'
import { destinoSeguro } from '@/lib/destino'
import { LOGO_DATA_URI } from '@/lib/logo'
import { useTituloPagina } from '@/lib/useTituloPagina'

const AREA01_URL = process.env.NEXT_PUBLIC_AREA01_URL ?? 'https://plura.app.br'

export default function LoginPage() {
  useTituloPagina('Acesso institucional')
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  // Atalhos quando a conta é de outra área ou ainda não existe
  const [atalhos, setAtalhos] = useState<{ texto: string; link: string }[]>([])
  const [suspensa, setSuspensa] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setErro('Preencha e-mail e senha')
      setSuspensa(false)
      return
    }
    setLoading(true)
    setErro('')
    setSuspensa(false)
    setAtalhos([])
    try {
      const auth = await api.login({ email: email.trim(), password })
      salvarSessao(auth)
      router.push(destinoSeguro(new URLSearchParams(window.location.search).get('destino')))
    } catch (err) {
      if (err instanceof ApiError && err.suspensa) {
        setSuspensa(true)
        setErro(err.message)
      } else if (err instanceof ApiError && err.codigo === 'sem_paginas_gov') {
        setErro(err.message)
        setAtalhos([
          { texto: 'Ir para Plura para empresas', link: err.link ?? 'https://login.plura.app.br' },
          { texto: 'Ir para a busca da Plura', link: AREA01_URL },
        ])
      } else {
        setErro('E-mail ou senha incorretos.')
        setAtalhos([
          { texto: 'Esqueci minha senha', link: '/esqueci-senha' },
          { texto: 'Criar conta Plura (usuário)', link: `${AREA01_URL}/signup` },
        ])
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Grain />
      <AcessoRapido />
      <div id="conteudo" tabIndex={-1} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', position: 'relative', zIndex: 1 }}>
        <GlassCard variant="lg" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem 2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_DATA_URI} alt="Plura" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} draggable={false} />
          </div>

          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.625rem', fontWeight: 800, letterSpacing: '-0.035em', marginBottom: '0.375rem' }}>Acesso institucional</h1>
            <p style={{ fontSize: '0.9375rem', color: 'var(--c-text-2)' }}>Entre com a conta do seu órgão/programa público</p>
          </div>

          {erro && suspensa && (
            <div style={{ marginBottom: '1rem', padding: '0.875rem 1rem', borderRadius: '0.75rem', background: 'rgba(245,158,11,0.16)', border: '1px solid rgba(245,158,11,0.45)', fontSize: '0.875rem', color: '#f59e0b', textAlign: 'center', fontWeight: 700 }}>
              {erro}
            </div>
          )}

          {erro && !suspensa && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'var(--c-danger-soft)', border: '1px solid var(--c-danger-border)', fontSize: '0.875rem', color: 'var(--c-danger-text)', textAlign: 'center' }}>
              {erro}
              {atalhos.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem', marginTop: '0.625rem' }}>
                  {atalhos.map((a) => (
                    <a key={a.link} href={a.link} style={{ padding: '0.35rem 0.75rem', borderRadius: '9999px', border: '1px solid var(--c-danger-border)', color: 'inherit', fontWeight: 700, textDecoration: 'none', fontSize: '0.8125rem' }}>
                      {a.texto}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
              <Input
                label="E-mail"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setSuspensa(false)
                }}
                leadingIcon={<EmailIcon />}
              />
              <Input
                label="Senha"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setSuspensa(false)
                }}
                leadingIcon={<LockIcon />}
                trailingIcon={
                  <button type="button" onClick={() => setShowPass((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', color: 'inherit' }}>
                    <EyeIcon off={showPass} />
                  </button>
                }
              />
              <div style={{ textAlign: 'right', marginTop: '-0.25rem' }}>
                <a href="/esqueci-senha" style={{ color: 'var(--c-text-blue)', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>Esqueci minha senha</a>
              </div>
              <Button type="submit" size="lg" loading={loading} style={{ width: '100%' }}>
                {loading ? 'Entrando…' : 'Entrar'}
              </Button>
            </div>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--c-text-3)', marginTop: '1.5rem' }}>
            Contas institucionais são criadas por convite da administração da Plura. Se você tem conta Plura e foi
            adicionado à equipe de uma página Gov, entre com o mesmo e-mail e senha.
          </p>
        </GlassCard>
        <Footer />
      </div>
    </>
  )
}
