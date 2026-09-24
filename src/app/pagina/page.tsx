'use client'

import { Suspense, useCallback, useEffect, useMemo, useState, type ComponentType } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { IconArrowLeft, IconExternalLink } from '@tabler/icons-react'
import Grain from '@/components/Grain'
import Footer from '@/components/Footer'
import Header from '@/components/GovHeader'
import { Aviso } from '@/components/editor/Campos'
import type { PropsAba } from '@/components/editor/tipos'
import AbaIdentidade from '@/components/editor/AbaIdentidade'
import AbaAparencia from '@/components/editor/AbaAparencia'
import AbaAcessibilidade from '@/components/editor/AbaAcessibilidade'
import AbaLocalizacao from '@/components/editor/AbaLocalizacao'
import AbaHorarios from '@/components/editor/AbaHorarios'
import AbaGaleria from '@/components/editor/AbaGaleria'
import AbaExperiencias from '@/components/editor/AbaExperiencias'
import AbaContato from '@/components/editor/AbaContato'
import AbaAntesDeIr from '@/components/editor/AbaAntesDeIr'
import AbaComentarios from '@/components/editor/AbaComentarios'
import AbaEquipe from '@/components/editor/AbaEquipe'
import AbaSelos from '@/components/editor/AbaSelos'
import { apiPaginas, type CamposEditaveis, type Opcoes, type PaginaDetalhe } from '@/lib/apiPaginas'
import { estaLogado } from '@/lib/auth'

const AREA01_URL = process.env.NEXT_PUBLIC_AREA01_URL ?? 'https://area01-frontend.pages.dev'

const ABAS: { id: string; rotulo: string; Componente: ComponentType<PropsAba> }[] = [
  { id: 'identidade', rotulo: 'Identidade', Componente: AbaIdentidade },
  { id: 'aparencia', rotulo: 'Cor da página', Componente: AbaAparencia },
  { id: 'acessibilidade', rotulo: 'Acessibilidade', Componente: AbaAcessibilidade },
  { id: 'localizacao', rotulo: 'Localização', Componente: AbaLocalizacao },
  { id: 'horarios', rotulo: 'Horários', Componente: AbaHorarios },
  { id: 'galeria', rotulo: 'Galeria', Componente: AbaGaleria },
  { id: 'experiencias', rotulo: 'Experiências', Componente: AbaExperiencias },
  { id: 'contato', rotulo: 'Contato', Componente: AbaContato },
  { id: 'antes', rotulo: 'Antes de ir e segurança', Componente: AbaAntesDeIr },
  { id: 'comentarios', rotulo: 'Comentários', Componente: AbaComentarios },
  { id: 'equipe', rotulo: 'Equipe', Componente: AbaEquipe },
  { id: 'selos', rotulo: 'Selos e certificações', Componente: AbaSelos },
]

// Campos do rascunho que são salvos pelo botão "Salvar alterações"
const CAMPOS_RASCUNHO: (keyof CamposEditaveis)[] = [
  'nome', 'subtitulo', 'descricao_curta', 'descricao', 'slogan', 'diferencial', 'categoria', 'faixa_preco', 'tags', 'tema', 'cnpj',
  'whatsapp', 'instagram', 'website', 'video_apresentacao', 'cep', 'endereco', 'cidade', 'uf', 'complemento', 'ponto_referencia',
  'como_chegar_carro', 'como_chegar_transporte', 'rota_acessivel', 'horarios', 'feriados', 'requer_agendamento', 'tempo_medio',
  'antecedencia', 'recursos_acessibilidade', 'destaques_acessibilidade', 'observacoes_recursos', 'antes_de_ir',
  'antes_de_ir_observacoes', 'seguranca', 'como_e_o_lugar', 'video_libras',
]

function diferencas(salvo: PaginaDetalhe, rascunho: PaginaDetalhe): CamposEditaveis {
  const patch: Record<string, unknown> = {}
  for (const campo of CAMPOS_RASCUNHO) {
    if (JSON.stringify(salvo[campo] ?? null) !== JSON.stringify(rascunho[campo] ?? null)) patch[campo] = rascunho[campo]
  }
  // CNPJ só vai para o servidor quando a página ainda não tem um e o campo foi preenchido
  if (salvo.cnpj || !patch.cnpj) delete patch.cnpj
  return patch as CamposEditaveis
}

function Editor() {
  const router = useRouter()
  const params = useSearchParams()
  const id = params.get('id') ?? ''
  const [aba, setAba] = useState(params.get('aba') ?? 'identidade')
  const [salvo, setSalvo] = useState<PaginaDetalhe | null>(null)
  const [rascunho, setRascunho] = useState<PaginaDetalhe | null>(null)
  const [opcoes, setOpcoes] = useState<Opcoes | null>(null)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    if (!estaLogado()) {
      router.replace(`/login?destino=${encodeURIComponent(`/pagina?id=${id}`)}`)
      return
    }
    if (!id) return
    Promise.all([apiPaginas.obter(id), apiPaginas.opcoes()])
      .then(([p, o]) => {
        setSalvo(p)
        setRascunho(p)
        setOpcoes(o)
      })
      .catch((e) => setErro(e instanceof Error ? e.message : 'Página não encontrada ou sem acesso'))
  }, [id, router])

  const patch = useMemo(() => (salvo && rascunho ? diferencas(salvo, rascunho) : {}), [salvo, rascunho])
  const alterado = Object.keys(patch).length > 0

  useEffect(() => {
    if (!alterado) return
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [alterado])

  const alterar = useCallback((p: CamposEditaveis) => {
    setMensagem('')
    setRascunho((r) => (r ? { ...r, ...p } : r))
  }, [])

  const aplicarSalvo = useCallback((p: Partial<PaginaDetalhe>) => {
    setSalvo((s) => (s ? { ...s, ...p } : s))
    setRascunho((r) => (r ? { ...r, ...p } : r))
  }, [])

  async function salvar() {
    if (!salvo || !alterado) return
    setSalvando(true)
    setErro('')
    try {
      const atualizada = await apiPaginas.atualizar(salvo.id, patch)
      setSalvo((s) => (s ? { ...s, ...atualizada } : s))
      setRascunho((r) => (r ? { ...r, ...atualizada } : r))
      setMensagem('Alterações salvas.')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  function trocarAba(nova: string) {
    setAba(nova)
    const url = new URL(window.location.href)
    url.searchParams.set('aba', nova)
    window.history.replaceState(null, '', url)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (erro && !salvo) return <Aviso tipo="erro">{erro}</Aviso>
  if (!salvo || !rascunho || !opcoes) return <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--c-text-3)' }}>carregando…</p>

  const Atual = (ABAS.find((a) => a.id === aba) ?? ABAS[0]).Componente

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <button type="button" onClick={() => router.push('/')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.45rem 0.875rem', borderRadius: '9999px', border: '1px solid var(--c-input-border)', background: 'var(--c-glass-bg-sm)', color: 'var(--c-text-1)', fontWeight: 600, fontSize: '0.8125rem', fontFamily: 'inherit', cursor: 'pointer' }}>
          <IconArrowLeft size={16} aria-hidden /> Minhas páginas
        </button>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', flex: '1 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{salvo.nome}</h1>
        <a href={`${AREA01_URL}/pagina?id=${salvo.id}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.45rem 0.875rem', borderRadius: '9999px', border: '1px solid var(--c-accent-soft-border)', color: 'var(--c-accent-text)', fontWeight: 600, fontSize: '0.8125rem', textDecoration: 'none' }}>
          Ver página pública <IconExternalLink size={15} aria-hidden />
        </a>
      </div>

      {salvo.suspensa && (
        <div style={{ marginBottom: '1rem' }}>
          <Aviso tipo="erro">Esta página está suspensa pela administração da Plura e não aparece nas buscas.</Aviso>
        </div>
      )}

      <nav role="tablist" aria-label="Seções do editor" style={{ display: 'flex', gap: '0.375rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.25rem', scrollbarWidth: 'thin' }}>
        {ABAS.map((a) => (
          <button
            key={a.id}
            role="tab"
            aria-selected={aba === a.id}
            onClick={() => trocarAba(a.id)}
            style={{
              flexShrink: 0,
              padding: '0.5rem 0.95rem',
              borderRadius: '9999px',
              border: aba === a.id ? '1px solid var(--c-accent-soft-border)' : '1px solid var(--c-divider)',
              background: aba === a.id ? 'var(--c-accent-soft)' : 'transparent',
              color: aba === a.id ? 'var(--c-accent-text)' : 'var(--c-text-2)',
              fontWeight: 600,
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            {a.rotulo}
          </button>
        ))}
      </nav>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: alterado ? '6rem' : 0 }}>
        <Atual rascunho={rascunho} salvo={salvo} alterar={alterar} aplicarSalvo={aplicarSalvo} opcoes={opcoes} />
      </div>

      {(alterado || erro || mensagem) && (
        <div role="region" aria-label="Salvar alterações" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 200, padding: '0.875rem 1rem', background: 'var(--c-modal-bg)', borderTop: '1px solid var(--c-divider)', boxShadow: '0 -8px 24px rgba(0,0,0,0.12)' }}>
          <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ flex: '1 1 200px', fontSize: '0.875rem', color: erro ? 'var(--c-danger-text)' : alterado ? 'var(--c-text-1)' : 'var(--c-success-text)', fontWeight: 600 }}>
              {erro || (alterado ? 'Você tem alterações não salvas.' : mensagem)}
            </span>
            {alterado && (
              <>
                <button type="button" onClick={() => { setRascunho(salvo); setErro('') }} disabled={salvando} style={{ padding: '0.6rem 1.125rem', borderRadius: '0.75rem', border: '1px solid var(--c-btn-secondary-border)', background: 'var(--c-btn-secondary-bg)', color: 'var(--c-text-1)', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                  Descartar
                </button>
                <button type="button" onClick={salvar} disabled={salvando} style={{ padding: '0.6rem 1.25rem', borderRadius: '0.75rem', border: 'none', background: 'linear-gradient(135deg,#1a7aff,#0062e6)', color: '#fff', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: salvando ? 0.7 : 1 }}>
                  {salvando ? 'Salvando…' : 'Salvar alterações'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default function EditorPaginaPage() {
  return (
    <>
      <Grain />
      <Header />
      <main id="conteudo" tabIndex={-1} style={{ maxWidth: '980px', margin: '0 auto', padding: '1.75rem 1.25rem 3rem', position: 'relative', zIndex: 1 }}>
        <Suspense fallback={<p style={{ fontFamily: 'var(--font-mono)', color: 'var(--c-text-3)' }}>carregando…</p>}>
          <Editor />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
