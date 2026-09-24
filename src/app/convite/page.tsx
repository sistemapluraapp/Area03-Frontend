'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import GlassCard from '@/components/GlassCard'
import Input from '@/components/Input'
import Button from '@/components/Button'
import Grain from '@/components/Grain'
import AcessoRapido from '@/components/AcessoRapido'
import Footer from '@/components/Footer'
import { EmailIcon, LockIcon, UserIcon, BuildingIcon } from '@/components/icons'
import { api } from '@/lib/api'
import { salvarSessao } from '@/lib/auth'
import { LOGO_DATA_URI } from '@/lib/logo'

function ConviteConteudo() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') ?? ''

  const [validando, setValidando] = useState(true)
  const [cidade, setCidade] = useState<string | null>(null)
  const [erroConvite, setErroConvite] = useState('')

  const [nome, setNome] = useState('')
  const [orgao, setOrgao] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      setErroConvite('Nenhum link de convite informado')
      setValidando(false)
      return
    }
    api
      .validarConvite(token)
      .then(({ cidade }) => setCidade(cidade))
      .catch((e) => setErroConvite(e instanceof Error ? e.message : 'Link inválido ou expirado'))
      .finally(() => setValidando(false))
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim() || !orgao.trim() || !email.includes('@') || senha.length < 6) {
      setErro('Preencha todos os campos (senha com ao menos 6 caracteres)')
      return
    }
    setLoading(true)
    setErro('')
    try {
      const resposta = await api.signup({ token, nome: nome.trim(), orgao: orgao.trim(), email: email.trim(), password: senha })
      if ('pending_email_confirmation' in resposta) {
        setSucesso('Conta criada! Verifique seu e-mail para confirmar antes de fazer login.')
        return
      }
      salvarSessao(resposta)
      router.push('/')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível criar a conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div id="conteudo" tabIndex={-1} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', position: 'relative', zIndex: 1 }}>
      <GlassCard variant="lg" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_DATA_URI} alt="Plura" style={{ height: '44px', width: 'auto', objectFit: 'contain' }} draggable={false} />
        </div>

        {validando ? (
          <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--c-text-3)' }}>validando link…</p>
        ) : erroConvite ? (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Link inválido</h1>
            <p style={{ color: 'var(--c-text-2)', fontSize: '0.9375rem' }}>{erroConvite}</p>
            <p style={{ color: 'var(--c-text-3)', fontSize: '0.85rem', marginTop: '1rem' }}>
              Peça um novo link à administração da Plura para cadastrar sua conta institucional.
            </p>
          </div>
        ) : sucesso ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#22c55e', fontWeight: 600, marginBottom: '0.5rem' }}>{sucesso}</p>
            <a href="/login" style={{ color: 'var(--c-text-blue)' }}>
              Ir para o login →
            </a>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.375rem' }}>Criar conta institucional</h1>
              <p style={{ fontSize: '0.9375rem', color: 'var(--c-text-2)' }}>
                Cidade: <strong style={{ color: 'var(--c-text-1)' }}>{cidade}</strong>
              </p>
            </div>

            {erro && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'var(--c-danger-soft)', border: '1px solid var(--c-danger-border)', fontSize: '0.875rem', color: 'var(--c-danger-text)', textAlign: 'center' }}>
                {erro}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Input label="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} leadingIcon={<UserIcon />} />
                <Input label="Órgão/programa" placeholder="Ex.: Secretaria de Turismo" value={orgao} onChange={(e) => setOrgao(e.target.value)} leadingIcon={<BuildingIcon />} />
                <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} leadingIcon={<EmailIcon />} />
                <Input label="Senha" type="password" placeholder="Mínimo 6 caracteres" value={senha} onChange={(e) => setSenha(e.target.value)} leadingIcon={<LockIcon />} />
              </div>
              <Button type="submit" size="lg" loading={loading} style={{ width: '100%', marginTop: '1.5rem' }}>
                Criar conta
              </Button>
            </form>
          </>
        )}
      </GlassCard>
      <Footer />
    </div>
  )
}

export default function ConvitePage() {
  return (
    <>
      <Grain />
      <AcessoRapido />
      <Suspense fallback={<p style={{ fontFamily: 'var(--font-mono)', color: 'var(--c-text-3)', textAlign: 'center', paddingTop: '4rem' }}>carregando…</p>}>
        <ConviteConteudo />
      </Suspense>
    </>
  )
}
