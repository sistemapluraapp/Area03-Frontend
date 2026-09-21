'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import GlassCard from '@/components/GlassCard'
import Button from '@/components/Button'
import Grain from '@/components/Grain'
import Footer from '@/components/Footer'
import GovHeader from '@/components/GovHeader'
import { BuildingIcon } from '@/components/icons'
import { api, type Pagina } from '@/lib/api'
import { estaLogado } from '@/lib/auth'

export default function MinhasPaginasPage() {
  const router = useRouter()
  const [itens, setItens] = useState<{ papel: string; paginas: Pagina }[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!estaLogado()) {
      router.replace('/login')
      return
    }
    api
      .minhasPaginas()
      .then(({ paginas }) => setItens(paginas))
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar Páginas'))
      .finally(() => setCarregando(false))
  }, [router])

  return (
    <>
      <Grain />
      <GovHeader />

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem 3rem', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Páginas institucionais</h1>
          <Button onClick={() => router.push('/nova-pagina')}>+ Nova Página</Button>
        </div>

        {erro && <div style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>{erro}</div>}

        {carregando ? (
          <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--c-text-3)' }}>carregando…</p>
        ) : itens.length === 0 ? (
          <GlassCard style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <div style={{ color: 'var(--c-text-4)', marginBottom: '0.75rem' }}>
              <BuildingIcon />
            </div>
            <p style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--c-text-2)' }}>Nenhuma Página institucional ainda</p>
            <Button onClick={() => router.push('/nova-pagina')} style={{ marginTop: '1rem' }}>
              Criar primeira Página
            </Button>
          </GlassCard>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' }}>
            {itens.map(({ papel, paginas: pagina }) => (
              <GlassCard key={pagina.id} hoverable onClick={() => router.push(`/pagina?id=${pagina.id}`)}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--c-text-blue)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{papel}</span>
                <h3 style={{ margin: '0.4rem 0 0.3rem' }}>{pagina.nome}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--c-text-3)' }}>{pagina.descricao ?? 'Sem descrição'}</p>
              </GlassCard>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
