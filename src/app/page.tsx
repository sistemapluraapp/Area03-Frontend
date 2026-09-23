'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { IconBuildingStore, IconPlus } from '@tabler/icons-react'
import Grain from '@/components/Grain'
import Footer from '@/components/Footer'
import Header from '@/components/GovHeader'
import { Aviso } from '@/components/editor/Campos'
import { apiPaginas, type PaginaCompleta } from '@/lib/apiPaginas'
import { estaLogado } from '@/lib/auth'

const PAPEL: Record<string, string> = { administrador: 'Administrador', colaborador: 'Colaborador' }

export default function MinhasPaginasPage() {
  const router = useRouter()
  const [itens, setItens] = useState<{ papel: string; paginas: PaginaCompleta }[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!estaLogado()) {
      router.replace('/login')
      return
    }
    apiPaginas
      .minhas()
      .then(({ paginas }) => setItens(paginas.filter((i) => i.paginas)))
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar páginas'))
      .finally(() => setCarregando(false))
  }, [router])

  const botaoNova = (
    <button type="button" onClick={() => router.push('/nova-pagina')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.6rem 1.125rem', borderRadius: '0.75rem', border: 'none', background: 'linear-gradient(135deg,#1a7aff,#0062e6)', color: '#fff', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
      <IconPlus size={18} /> Nova página
    </button>
  )

  return (
    <>
      <Grain />
      <Header />
      <main style={{ maxWidth: '1040px', margin: '0 auto', padding: '2rem 1.25rem 3rem', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Minhas páginas</h1>
          {botaoNova}
        </div>

        {erro && <Aviso tipo="erro">{erro}</Aviso>}

        {carregando ? (
          <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--c-text-3)' }}>carregando…</p>
        ) : itens.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', borderRadius: '1.25rem', border: 'var(--c-border)', background: 'var(--c-glass-bg)' }}>
            <div style={{ color: 'var(--c-text-3)', marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>
              <IconBuildingStore size={36} stroke={1.5} />
            </div>
            <p style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: '0.25rem' }}>Você ainda não tem nenhuma página institucional</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--c-text-2)', marginBottom: '1.25rem' }}>Crie a página institucional do seu órgão ou atrativo para começar.</p>
            {botaoNova}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {itens.map(({ papel, paginas: p }) => (
              <button
                key={p.id}
                type="button"
                onClick={() => router.push(`/pagina?id=${p.id}`)}
                style={{ textAlign: 'left', padding: 0, borderRadius: '1.25rem', overflow: 'hidden', border: 'var(--c-border)', background: 'var(--c-glass-bg)', boxShadow: 'var(--c-shadow-md)', cursor: 'pointer', fontFamily: 'inherit', color: 'inherit' }}
              >
                <div data-tema={p.tema ?? 'plura'} style={{ position: 'relative', aspectRatio: '16 / 9', background: p.capa_url ? `url("${p.capa_url}") center/cover` : 'var(--p-accent)' }}>
                  <span style={{ position: 'absolute', left: '0.75rem', bottom: '-22px', width: '48px', height: '48px', borderRadius: '50%', border: '3px solid var(--c-bg)', background: p.logo_url ? `url("${p.logo_url}") center/cover` : 'var(--p-accent)', color: 'var(--p-accent-contrast)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                    {!p.logo_url && p.nome.trim()[0]?.toUpperCase()}
                  </span>
                </div>
                <div style={{ padding: '1.75rem 1rem 1rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {PAPEL[papel] ?? papel}
                    {p.suspensa && ' · suspensa'}
                    {p.legado && !p.cnpj && ' · falta CNPJ'}
                  </span>
                  <p style={{ fontWeight: 700, fontSize: '1.0625rem', margin: '0.25rem 0' }}>{p.nome}</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--c-text-2)', lineHeight: 1.45 }}>{p.descricao_curta ?? p.subtitulo ?? 'Sem descrição'}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
