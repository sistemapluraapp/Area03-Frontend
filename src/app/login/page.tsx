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

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
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
    try {
      const auth = await api.login({ email: email.trim(), password })
      salvarSessao(auth)
      router.push(destinoSeguro(new URLSearchParams(window.location.search).get('destino')))
    } catch (err) {
      if (err instanceof ApiError && err.suspensa) {
        setSuspensa(true)
        setErro(err.message)
      } else {
        setErro('E-mail ou senha incorretos')
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
              <Button type="submit" size="lg" loading={loading} style={{ width: '100%' }}>
                {loading ? 'Entrando…' : 'Entrar'}
              </Button>
            </div>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--c-text-3)', marginTop: '1.5rem' }}>
            Cadastro de novas contas institucionais é feito apenas por link de convite enviado pela administração da Plura.
          </p>
        </GlassCard>
        <Footer />
      </div>
    </>
  )
}
