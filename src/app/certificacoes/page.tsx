'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { IconChevronRight, IconSearch } from '@tabler/icons-react'
import Grain from '@/components/Grain'
import Footer from '@/components/Footer'
import Header from '@/components/GovHeader'
import Carregando from '@/components/Carregando'
import { Aviso } from '@/components/editor/Campos'
import { BlocosPagina, IconeCertificacao } from '@/components/certificacoes/Comuns'
import { apiCertificacoes, regiao, type BlocoPagina, type Certificacao } from '@/lib/apiCertificacoes'
import { estaLogado } from '@/lib/auth'
import { useTituloPagina } from '@/lib/useTituloPagina'

function semAcento(t: string) {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export default function BuscarCertificacoesPage() {
  const router = useRouter()
  useTituloPagina('Buscar certificações')
  const [dados, setDados] = useState<{ pagina: { titulo: string; subtitulo: string | null; blocos: BlocoPagina[] }; certificacoes: Certificacao[] } | null>(null)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')

  useEffect(() => {
    if (!estaLogado()) {
      router.replace('/login')
      return
    }
    apiCertificacoes.listar().then(setDados).catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar'))
  }, [router])

  const filtradas = useMemo(() => {
    const termo = semAcento(busca.trim())
    const lista = dados?.certificacoes ?? []
    if (!termo) return lista
    return lista.filter((c) => semAcento(`${c.titulo} ${c.resumo ?? ''} ${regiao(c)}`).includes(termo))
  }, [dados, busca])

  return (
    <>
      <Grain />
      <Header />
      <main id="conteudo" tabIndex={-1} style={{ maxWidth: '1040px', margin: '0 auto', padding: '2rem 1.25rem 3rem', position: 'relative', zIndex: 1 }}>
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        {!dados ? (
          !erro && <Carregando />
        ) : (
          <>
            <h1 style={{ fontSize: '1.625rem', fontWeight: 800, margin: '0 0 0.375rem', letterSpacing: '-0.02em' }}>{dados.pagina.titulo}</h1>
            {dados.pagina.subtitulo && <p style={{ margin: '0 0 1.25rem', color: 'var(--c-text-2)', fontSize: '1rem' }}>{dados.pagina.subtitulo}</p>}
            <BlocosPagina blocos={dados.pagina.blocos} />

            <label style={{ position: 'relative', display: 'block', marginBottom: '1rem' }}>
              <span className="sr-only">Buscar certificação</span>
              <IconSearch size={18} aria-hidden style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text-3)' }} />
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome, assunto ou região"
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.875rem', border: '1px solid var(--c-input-border)', background: 'var(--c-input-bg, var(--c-glass-bg))', color: 'var(--c-text-1)', fontSize: '0.9375rem', fontFamily: 'inherit' }}
              />
            </label>

            <p role="status" style={{ fontSize: '0.8125rem', color: 'var(--c-text-3)', margin: '0 0 0.75rem' }}>
              {filtradas.length === 1 ? '1 certificação' : `${filtradas.length} certificações`}
            </p>

            {filtradas.length === 0 ? (
              <Aviso>{dados.certificacoes.length ? 'Nenhuma certificação encontrada com essa busca.' : 'Ainda não há certificações disponíveis. Volte em breve!'}</Aviso>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.875rem' }}>
                {filtradas.map((c) => (
                  <li key={c.id}>
                    <a href={`/certificacoes/ver?id=${c.id}`} style={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '1.125rem', overflow: 'hidden', border: 'var(--c-border)', background: 'var(--c-glass-bg)', boxShadow: 'var(--c-shadow-md)', color: 'inherit', textDecoration: 'none' }}>
                      {c.imagem_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.imagem_url} alt="" style={{ width: '100%', aspectRatio: '16 / 7', objectFit: 'cover' }} />
                      )}
                      <span style={{ display: 'flex', gap: '0.75rem', padding: '1rem', flex: 1 }}>
                        <IconeCertificacao icone={c.icone} />
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <strong style={{ display: 'block', fontSize: '1rem' }}>{c.titulo}</strong>
                          {c.resumo && <span style={{ display: 'block', fontSize: '0.875rem', color: 'var(--c-text-2)', marginTop: '0.25rem', lineHeight: 1.45 }}>{c.resumo}</span>}
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--c-text-3)', marginTop: '0.5rem' }}>
                            {regiao(c)} · {c.validade_meses ? `válida por ${c.validade_meses} meses` : 'não vence'} · {c.total_etapas ?? 0} {c.total_etapas === 1 ? 'etapa' : 'etapas'} · {c.gratuita ? 'gratuita' : 'paga'}
                          </span>
                        </span>
                        <IconChevronRight size={18} aria-hidden style={{ color: 'var(--c-text-3)', alignSelf: 'center' }} />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  )
}
