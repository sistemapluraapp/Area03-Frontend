'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { IconArrowLeft, IconCircleCheck } from '@tabler/icons-react'
import Grain from '@/components/Grain'
import Footer from '@/components/Footer'
import Header from '@/components/GovHeader'
import Carregando from '@/components/Carregando'
import TextoRico from '@/components/TextoRico'
import { Aviso } from '@/components/editor/Campos'
import { IconeCertificacao, botaoPrimario, botaoSecundario } from '@/components/certificacoes/Comuns'
import { apiCertificacoes, regiao, type Certificacao, type Etapa } from '@/lib/apiCertificacoes'
import { apiPaginas } from '@/lib/apiPaginas'
import { ROTULO_TIPO_REQUISITO } from '@/lib/rotulosCertificacoes'
import { estaLogado } from '@/lib/auth'
import { useTituloPagina } from '@/lib/useTituloPagina'

type MinhaPagina = { id: string; nome: string; local: string }

function Detalhe() {
  const router = useRouter()
  const id = useSearchParams().get('id') ?? ''
  const [cert, setCert] = useState<(Certificacao & { etapas: Etapa[] }) | null>(null)
  const [paginas, setPaginas] = useState<MinhaPagina[] | null>(null)
  const [paginaId, setPaginaId] = useState('')
  const [erro, setErro] = useState('')
  const [erroInscricao, setErroInscricao] = useState('')
  const [inscrevendo, setInscrevendo] = useState(false)
  useTituloPagina(cert?.titulo ?? 'Certificação')

  useEffect(() => {
    if (!estaLogado()) {
      router.replace('/login')
      return
    }
    apiCertificacoes.obter(id).then(setCert).catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar'))
    apiPaginas
      .minhas()
      .then(({ paginas: itens }) => {
        // Só páginas em que a pessoa pode mexer em "Selos e certificações"
        const lista = itens
          .filter((i) => i.paginas && !i.paginas.excluida_em && (i.papel === 'administrador' || (i.permissoes ?? []).includes('selos')))
          .map((i) => ({ id: i.paginas.id, nome: i.paginas.nome, local: [i.paginas.cidade, i.paginas.uf].filter(Boolean).join('/') }))
        setPaginas(lista)
        if (lista.length === 1) setPaginaId(lista[0].id)
      })
      .catch(() => setPaginas([]))
  }, [id, router])

  async function inscrever() {
    if (!paginaId) return
    setInscrevendo(true)
    setErroInscricao('')
    try {
      const insc = await apiCertificacoes.inscrever(paginaId, id)
      router.push(`/pagina?id=${paginaId}&aba=selos&inscricao=${insc.id}`)
    } catch (e) {
      setErroInscricao(e instanceof Error ? e.message : 'Não foi possível fazer a inscrição')
      setInscrevendo(false)
    }
  }

  if (erro) return <Aviso tipo="erro">{erro} <a href="/certificacoes" style={{ color: 'inherit', fontWeight: 700 }}>Voltar para a lista</a></Aviso>
  if (!cert) return <Carregando />

  return (
    <>
      <a href="/certificacoes" style={{ ...botaoSecundario, borderRadius: '9999px', marginBottom: '1.25rem' }}>
        <IconArrowLeft size={16} aria-hidden /> Todas as certificações
      </a>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1.5rem' }} className="cert-detalhe">
        <article>
          {cert.imagem_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cert.imagem_url} alt="" style={{ width: '100%', maxHeight: '320px', objectFit: 'cover', borderRadius: '1.125rem', marginBottom: '1.25rem' }} />
          )}
          <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center', marginBottom: '0.75rem' }}>
            <IconeCertificacao icone={cert.icone} tamanho={52} />
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{cert.titulo}</h1>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.875rem', color: 'var(--c-text-3)' }}>
                {regiao(cert)} · {cert.validade_meses ? `válida por ${cert.validade_meses} meses` : 'não vence'} · {cert.gratuita ? 'gratuita' : 'paga'}
              </p>
            </div>
          </div>
          {cert.resumo && <p style={{ fontSize: '1rem', color: 'var(--c-text-2)', lineHeight: 1.55 }}>{cert.resumo}</p>}
          <TextoRico valor={cert.descricao} style={{ color: 'var(--c-text-2)', lineHeight: 1.6, marginBottom: '1.25rem' }} />

          <h2 style={{ fontSize: '1.125rem', fontWeight: 800, margin: '1.5rem 0 0.75rem' }}>Como funciona</h2>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {cert.etapas.map((e, i) => (
              <li key={e.id} style={{ padding: '1rem', borderRadius: '1rem', border: 'var(--c-border)', background: 'var(--c-glass-bg)' }}>
                <p style={{ margin: 0, fontWeight: 700 }}>
                  Etapa {i + 1}: {e.titulo}
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--c-text-3)' }}>
                    {i === 0 ? '' : e.modo === 'paralela' ? '(junto com a anterior)' : '(depois da anterior aprovada)'}
                  </span>
                </p>
                {e.descricao && <p style={{ margin: '0.3rem 0 0', fontSize: '0.875rem', color: 'var(--c-text-2)' }}>{e.descricao}</p>}
                <ul style={{ margin: '0.625rem 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {e.requisitos.map((r) => (
                    <li key={r.id} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <IconCircleCheck size={18} aria-hidden style={{ color: 'var(--c-accent-text)', flexShrink: 0 }} />
                      <span>
                        <strong>{r.titulo}</strong> <span style={{ color: 'var(--c-text-3)' }}>· {ROTULO_TIPO_REQUISITO[r.tipo]}{r.obrigatorio ? '' : ' (opcional)'}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </article>

        <aside aria-labelledby="titulo-inscricao" style={{ alignSelf: 'start', padding: '1.25rem', borderRadius: '1.125rem', border: '1px solid var(--c-accent-soft-border)', background: 'var(--c-accent-soft)' }}>
          <h2 id="titulo-inscricao" style={{ fontSize: '1.0625rem', fontWeight: 800, margin: '0 0 0.5rem' }}>Inscrever minha página</h2>
          {paginas === null ? (
            <Carregando compacto />
          ) : paginas.length === 0 ? (
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--c-text-2)' }}>
              Você ainda não tem uma página em que possa cuidar de selos e certificações. <a href="/" style={{ color: 'var(--c-accent-text)', fontWeight: 700 }}>Ir para Minhas páginas</a>
            </p>
          ) : (
            <>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--c-text-2)', marginBottom: '0.875rem' }}>
                Página
                <select value={paginaId} onChange={(e) => setPaginaId(e.target.value)} style={{ padding: '0.6rem 0.75rem', borderRadius: '0.75rem', border: '1px solid var(--c-input-border)', background: 'var(--c-input-bg, var(--c-glass-bg))', color: 'var(--c-text-1)', fontFamily: 'inherit', fontSize: '0.9375rem' }}>
                  <option value="">Escolha a página</option>
                  {paginas.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}{p.local ? ` (${p.local})` : ''}</option>
                  ))}
                </select>
              </label>
              {erroInscricao && <div style={{ marginBottom: '0.75rem' }}><Aviso tipo="erro">{erroInscricao}</Aviso></div>}
              <button type="button" onClick={inscrever} disabled={!paginaId || inscrevendo} style={{ ...botaoPrimario, width: '100%', justifyContent: 'center', opacity: !paginaId || inscrevendo ? 0.6 : 1 }}>
                {inscrevendo ? 'Abrindo…' : 'Começar inscrição'}
              </button>
              <p style={{ margin: '0.75rem 0 0', fontSize: '0.75rem', color: 'var(--c-text-3)', lineHeight: 1.45 }}>
                Você preenche os requisitos na aba “Selos e certificações” da página e pode salvar e voltar depois. Se a página já estiver inscrita, abrimos a inscrição existente.
              </p>
            </>
          )}
        </aside>
      </div>
    </>
  )
}

export default function CertificacaoPage() {
  return (
    <>
      <Grain />
      <Header />
      <main id="conteudo" tabIndex={-1} style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.25rem 3rem', position: 'relative', zIndex: 1 }}>
        <Suspense fallback={<Carregando />}>
          <Detalhe />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
