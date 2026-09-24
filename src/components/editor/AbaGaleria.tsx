'use client'

import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { IconLink, IconPhotoPlus, IconTrash } from '@tabler/icons-react'
import Icone from '../Icone'
import { Aviso, Campo, Grade, Secao, Selecao, Texto, estiloCampo } from './Campos'
import { apiPaginas, type FormatoLink, type Midia } from '@/lib/apiPaginas'
import { comprimirImagem } from '@/lib/comprimirImagem'
import type { PropsAba } from './tipos'

export const CATEGORIAS_MIDIA = [
  { valor: 'ambiente', rotulo: 'Ambiente' },
  { valor: 'entrada', rotulo: 'Entrada' },
  { valor: 'acessibilidade', rotulo: 'Acessibilidade' },
  { valor: 'banheiros', rotulo: 'Banheiros' },
  { valor: 'quartos', rotulo: 'Quartos' },
  { valor: 'cardapio', rotulo: 'Cardápio' },
  { valor: 'equipe', rotulo: 'Equipe' },
  { valor: 'equipamentos', rotulo: 'Equipamentos' },
  { valor: 'trilhas', rotulo: 'Trilhas' },
  { valor: 'piscina', rotulo: 'Piscina' },
  { valor: 'area_externa', rotulo: 'Área externa' },
]

export const FORMATOS_LINK: { valor: FormatoLink; rotulo: string }[] = [
  { valor: 'video', rotulo: 'Vídeo' },
  { valor: 'reel', rotulo: 'Reel / vídeo curto' },
  { valor: 'foto_360', rotulo: 'Foto 360°' },
  { valor: 'tour_virtual', rotulo: 'Tour virtual' },
]

const LIMITE_FOTOS = 15

function MidiaItem({ midia, paginaId, onAtualizada, onRemovida }: { midia: Midia; paginaId: string; onAtualizada: (m: Midia) => void; onRemovida: () => void }) {
  const [legenda, setLegenda] = useState(midia.legenda ?? '')
  const [alt, setAlt] = useState(midia.texto_alt ?? '')
  const [erro, setErro] = useState('')

  async function salvar(patch: Partial<Midia>) {
    setErro('')
    try {
      onAtualizada(await apiPaginas.atualizarMidia(paginaId, midia.id, patch))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar')
    }
  }

  async function remover() {
    if (!confirm(midia.tipo === 'foto' ? 'Remover esta foto da galeria?' : 'Remover este link da galeria?')) return
    try {
      await apiPaginas.removerMidia(paginaId, midia.id)
      onRemovida()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao remover')
    }
  }

  return (
    <div style={{ display: 'flex', gap: '0.875rem', padding: '0.75rem', borderRadius: '0.875rem', border: '1px solid var(--c-divider)', flexWrap: 'wrap' }}>
      {midia.tipo === 'foto' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={midia.url} alt={midia.texto_alt ?? ''} style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '0.625rem', flexShrink: 0 }} />
      ) : (
        <a href={midia.url} target="_blank" rel="noopener noreferrer" style={{ width: '120px', height: '90px', borderRadius: '0.625rem', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', background: 'var(--c-accent-soft)', color: 'var(--c-accent-text)', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600 }}>
          <Icone nome={midia.formato === 'foto_360' || midia.formato === 'tour_virtual' ? 'view-360' : 'player-play'} size={24} />
          {midia.plataforma}
        </a>
      )}
      <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 0 }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {midia.tipo === 'link' && (
            <select value={midia.formato ?? 'video'} onChange={(e) => salvar({ formato: e.target.value as FormatoLink })} aria-label="Tipo de link" style={{ ...estiloCampo, width: 'auto', padding: '0.45rem 0.625rem', fontSize: '0.8125rem' }}>
              {FORMATOS_LINK.map((f) => (
                <option key={f.valor} value={f.valor}>
                  {f.rotulo}
                </option>
              ))}
            </select>
          )}
          <select value={midia.categoria ?? ''} onChange={(e) => salvar({ categoria: e.target.value || null })} aria-label="Categoria" style={{ ...estiloCampo, width: 'auto', padding: '0.45rem 0.625rem', fontSize: '0.8125rem' }}>
            <option value="">Sem categoria</option>
            {CATEGORIAS_MIDIA.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.rotulo}
              </option>
            ))}
          </select>
          <button type="button" onClick={remover} aria-label="Remover" style={{ marginLeft: 'auto', background: 'none', border: '1px solid var(--c-divider)', borderRadius: '0.5rem', padding: '0.35rem', color: 'var(--c-danger-text)', cursor: 'pointer', display: 'flex' }}>
            <IconTrash size={16} aria-hidden />
          </button>
        </div>
        <input value={legenda} onChange={(e) => setLegenda(e.target.value)} onBlur={() => legenda !== (midia.legenda ?? '') && salvar({ legenda })} placeholder="Legenda (opcional)" maxLength={200} aria-label="Legenda" style={{ ...estiloCampo, padding: '0.45rem 0.625rem', fontSize: '0.8125rem' }} />
        {midia.tipo === 'foto' && !midia.texto_alt && (
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-warning-text)' }}>Sem descrição: pessoas cegas não saberão o que esta foto mostra.</span>
        )}
        {midia.tipo === 'foto' && (
          <input value={alt} onChange={(e) => setAlt(e.target.value)} onBlur={() => alt !== (midia.texto_alt ?? '') && salvar({ texto_alt: alt })} placeholder="Texto alternativo: descreva a foto para quem usa leitor de tela" maxLength={300} aria-label="Texto alternativo" style={{ ...estiloCampo, padding: '0.45rem 0.625rem', fontSize: '0.8125rem' }} />
        )}
        {erro && <span style={{ color: 'var(--c-danger-text)', fontSize: '0.8125rem' }}>{erro}</span>}
      </div>
    </div>
  )
}

interface FotoPendente {
  chave: string
  base64: string
  extensao: string
  alt: string
}

export default function AbaGaleria({ rascunho: p, aplicarSalvo }: PropsAba) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [categoriaNova, setCategoriaNova] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [pendentes, setPendentes] = useState<FotoPendente[]>([])
  const [link, setLink] = useState('')
  const [formato, setFormato] = useState<FormatoLink>('video')
  const [categoriaLink, setCategoriaLink] = useState('')
  const [erroLink, setErroLink] = useState('')

  const midias = p.midias ?? []
  const fotos = midias.filter((m) => m.tipo === 'foto')
  const links = midias.filter((m) => m.tipo === 'link')

  function atualizarLista(nova: Midia[]) {
    aplicarSalvo({ midias: nova })
  }

  // As fotos escolhidas ficam numa fila até cada uma ganhar uma descrição
  // (texto alternativo) — é o que o leitor de tela lê para quem não enxerga.
  async function aoEscolherFotos(e: ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files ?? []).slice(0, LIMITE_FOTOS - fotos.length - pendentes.length)
    e.target.value = ''
    if (!arquivos.length) return
    setErro('')
    try {
      const novas: FotoPendente[] = []
      for (const arquivo of arquivos) {
        const { base64, extensao } = await comprimirImagem(arquivo, 1600, 0.82)
        novas.push({ chave: `${Date.now()}-${Math.random()}`, base64, extensao, alt: '' })
      }
      setPendentes((l) => [...l, ...novas])
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao preparar a foto')
    }
  }

  const faltaDescrever = pendentes.some((f) => f.alt.trim().length < 5)

  async function enviarPendentes() {
    if (faltaDescrever) return
    setEnviando(true)
    setErro('')
    let lista = midias
    try {
      for (const foto of pendentes) {
        const midia = await apiPaginas.adicionarFoto(p.id, foto.base64, foto.extensao, { categoria: categoriaNova || null, texto_alt: foto.alt.trim() })
        lista = [...lista, midia]
        atualizarLista(lista)
        setPendentes((l) => l.filter((x) => x.chave !== foto.chave))
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao enviar foto')
    } finally {
      setEnviando(false)
    }
  }

  async function adicionarLink(e: FormEvent) {
    e.preventDefault()
    setErroLink('')
    try {
      const midia = await apiPaginas.adicionarLink(p.id, { url: link.trim(), formato, categoria: categoriaLink || null })
      atualizarLista([...midias, midia])
      setLink('')
    } catch (err) {
      setErroLink(err instanceof Error ? err.message : 'Erro ao adicionar link')
    }
  }

  return (
    <>
      <Secao titulo={`Fotos (${fotos.length}/${LIMITE_FOTOS})`} descricao="Mostre o local como ele é. Fotos reais da entrada, do banheiro, das rampas e dos equipamentos ajudam o visitante a decidir com segurança.">
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Campo rotulo="Categoria das próximas fotos">
            <Selecao valor={categoriaNova} onChange={setCategoriaNova} vazio="Sem categoria" opcoes={CATEGORIAS_MIDIA} />
          </Campo>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={aoEscolherFotos} style={{ display: 'none' }} />
          <button
            type="button"
            disabled={enviando || fotos.length + pendentes.length >= LIMITE_FOTOS}
            onClick={() => inputRef.current?.click()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.125rem', borderRadius: '0.75rem', border: 'none', background: 'linear-gradient(135deg,#1a7aff,#0062e6)', color: '#fff', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', opacity: enviando || fotos.length >= LIMITE_FOTOS ? 0.6 : 1 }}
          >
            <IconPhotoPlus size={18} aria-hidden /> {enviando ? 'Enviando…' : 'Adicionar fotos'}
          </button>
        </div>
        {fotos.length >= LIMITE_FOTOS && <Aviso>Você atingiu o limite de {LIMITE_FOTOS} fotos. Remova uma para adicionar outra.</Aviso>}
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        {pendentes.length > 0 && (
          <div role="group" aria-label="Fotos prontas para enviar" style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', padding: '0.875rem', borderRadius: '0.875rem', border: '1px dashed var(--c-accent-soft-border)', background: 'var(--c-accent-soft)' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9375rem' }}>Descreva cada foto antes de enviar</p>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--c-text-2)' }}>Conte o que aparece nela, como se falasse com alguém que não está vendo. Ex.: “Rampa de concreto com corrimão dos dois lados, na entrada principal”.</p>
            {pendentes.map((f, i) => (
              <div key={f.chave} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`data:image/${f.extensao};base64,${f.base64}`} alt="" style={{ width: '96px', height: '72px', objectFit: 'cover', borderRadius: '0.5rem', flexShrink: 0 }} />
                <div style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label htmlFor={`alt-${f.chave}`} style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Descrição da foto {i + 1} *</label>
                  <textarea
                    id={`alt-${f.chave}`}
                    value={f.alt}
                    maxLength={300}
                    rows={2}
                    onChange={(e) => setPendentes((l) => l.map((x) => (x.chave === f.chave ? { ...x, alt: e.target.value } : x)))}
                    aria-invalid={f.alt.length > 0 && f.alt.trim().length < 5}
                    style={{ ...estiloCampo, padding: '0.5rem 0.625rem', fontSize: '0.875rem', resize: 'vertical' }}
                  />
                </div>
                <button type="button" onClick={() => setPendentes((l) => l.filter((x) => x.chave !== f.chave))} aria-label={`Descartar foto ${i + 1}`} style={{ background: 'none', border: '1px solid var(--c-divider)', borderRadius: '0.5rem', padding: '0.35rem', color: 'var(--c-danger-text)', cursor: 'pointer', display: 'flex' }}>
                  <IconTrash size={16} aria-hidden />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={enviarPendentes}
              disabled={enviando || faltaDescrever}
              style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.125rem', borderRadius: '0.75rem', border: 'none', background: 'linear-gradient(135deg,#1a7aff,#0062e6)', color: '#fff', fontWeight: 700, fontFamily: 'inherit', cursor: enviando || faltaDescrever ? 'not-allowed' : 'pointer', opacity: enviando || faltaDescrever ? 0.6 : 1 }}
            >
              {enviando ? 'Enviando…' : `Enviar ${pendentes.length} ${pendentes.length === 1 ? 'foto' : 'fotos'}`}
            </button>
            {faltaDescrever && <span style={{ fontSize: '0.8125rem', color: 'var(--c-text-2)' }}>Cada descrição precisa ter pelo menos 5 caracteres.</span>}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {fotos.map((m) => (
            <MidiaItem key={m.id} midia={m} paginaId={p.id} onAtualizada={(nova) => atualizarLista(midias.map((x) => (x.id === nova.id ? nova : x)))} onRemovida={() => atualizarLista(midias.filter((x) => x.id !== m.id))} />
          ))}
        </div>
      </Secao>

      <Secao titulo="Vídeos, reels, fotos 360° e tour virtual" descricao="Adicione links de conteúdos publicados em outras plataformas.">
        <Aviso>
          <strong>Links aceitos:</strong> YouTube (vídeos e Shorts), Instagram (reels e posts), TikTok, Facebook e Vimeo para vídeos; Kuula, Matterport e Google Maps
          (Street View) para fotos 360° e tours virtuais. O link precisa começar com <code>https://</code>.
        </Aviso>
        <form onSubmit={adicionarLink} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Campo rotulo="Link">
            <Texto valor={link} onChange={setLink} placeholder="https://www.youtube.com/watch?v=..." inputMode="url" />
          </Campo>
          <Grade>
            <Campo rotulo="Tipo">
              <Selecao valor={formato} onChange={(v) => setFormato(v as FormatoLink)} opcoes={FORMATOS_LINK} />
            </Campo>
            <Campo rotulo="Categoria">
              <Selecao valor={categoriaLink} onChange={setCategoriaLink} vazio="Sem categoria" opcoes={CATEGORIAS_MIDIA} />
            </Campo>
          </Grade>
          <button type="submit" disabled={!link.trim()} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.125rem', borderRadius: '0.75rem', border: '1px solid var(--c-btn-secondary-border)', background: 'var(--c-btn-secondary-bg)', color: 'var(--c-text-1)', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', opacity: link.trim() ? 1 : 0.6 }}>
            <IconLink size={18} aria-hidden /> Adicionar link
          </button>
          {erroLink && <Aviso tipo="erro">{erroLink}</Aviso>}
        </form>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {links.map((m) => (
            <MidiaItem key={m.id} midia={m} paginaId={p.id} onAtualizada={(nova) => atualizarLista(midias.map((x) => (x.id === nova.id ? nova : x)))} onRemovida={() => atualizarLista(midias.filter((x) => x.id !== m.id))} />
          ))}
        </div>
      </Secao>
    </>
  )
}
