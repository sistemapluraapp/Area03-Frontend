'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import GlassCard from '@/components/GlassCard'
import Input from '@/components/Input'
import Button from '@/components/Button'
import Grain from '@/components/Grain'
import { BuildingIcon } from '@/components/icons'
import { api } from '@/lib/api'

export default function NovaPaginaPage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) {
      setErro('Informe o nome da Página')
      return
    }
    setLoading(true)
    setErro('')
    try {
      const pagina = await api.criarPagina({ nome: nome.trim(), descricao: descricao.trim() || undefined })
      router.push(`/pagina?id=${pagina.id}`)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao criar Página')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Grain />
      <main style={{ maxWidth: '480px', margin: '0 auto', padding: '3rem 1.25rem', position: 'relative', zIndex: 1 }}>
        <GlassCard variant="lg" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
            <BuildingIcon />
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Nova Página institucional</h1>
          </div>

          {erro && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.875rem', color: '#f87171' }}>
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input label="Nome do órgão/programa" value={nome} onChange={(e) => setNome(e.target.value)} />
            <div style={{ marginTop: '1rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--c-input-label)', display: 'block', marginBottom: '0.375rem' }}>Descrição</label>
              <textarea
                rows={4}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', background: 'var(--c-input-bg)', border: '1px solid var(--c-input-border)', borderRadius: '0.75rem', color: 'var(--c-input-text)', fontSize: '0.9375rem', fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>
            <Button type="submit" loading={loading} style={{ width: '100%', marginTop: '1.5rem' }}>
              Criar Página
            </Button>
          </form>
        </GlassCard>
      </main>
    </>
  )
}
