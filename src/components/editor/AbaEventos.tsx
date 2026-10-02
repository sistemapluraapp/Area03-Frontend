'use client'

import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { IconCalendarEvent, IconDownload, IconEdit, IconPhoto, IconPlus, IconTrash, IconUsers } from '@tabler/icons-react'
import { Aviso, Campo, Chip, Grade, Interruptor, Secao, Selecao, Texto, estiloCampo } from './Campos'
import { apiPaginas, type Evento, type EventoEditavel, type Interessado } from '@/lib/apiPaginas'
import { comprimirImagem } from '@/lib/comprimirImagem'
import { buscarLocalidade } from '@/lib/localidades'
import type { PropsAba } from './tipos'
import EditorRico from '../EditorRico'
import SeletorLocalidade from '../SeletorLocalidade'

// ISO (UTC) -> valor de <input type="datetime-local"> no horário do navegador
function paraCampoData(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export function formatarPeriodo(inicio: string, fim: string | null) {
  const i = new Date(inicio)
  const data = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  const hora = (d: Date) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (!fim) return `${data(i)}, ${hora(i)}`
  const f = new Date(fim)
  return i.toDateString() === f.toDateString() ? `${data(i)}, ${hora(i)} às ${hora(f)}` : `${data(i)}, ${hora(i)} até ${data(f)}, ${hora(f)}`
}

function FormEvento({ inicial, pagina, rotuloRecurso, recursos, onSalvo, onCancelar }: {
  inicial: Partial<Evento>
  pagina: PropsAba['rascunho']
  rotuloRecurso: (c: string) => string
  recursos: string[]
  onSalvo: (e: Evento) => void
  onCancelar: () => void
}) {
  const [ev, setEv] = useState<Partial<Evento>>(inicial)
  const [inicio, setInicio] = useState(paraCampoData(inicial.inicio))
  const [fim, setFim] = useState(paraCampoData(inicial.fim))
  const localDaPagina = !inicial.id || (inicial.cidade === pagina.cidade && inicial.uf === pagina.uf && (inicial.pais ?? 'BR') === (pagina.pais || 'BR'))
  const [outroLocal, setOutroLocal] = useState(!localDaPagina)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const alterar = (patch: Partial<Evento>) => setEv((e) => ({ ...e, ...patch }))
  const acess = ev.acessibilidades ?? []

  async function salvar() {
    setErro('')
    if (!ev.titulo?.trim()) return setErro('Informe o título do evento')
    if (!inicio) return setErro('Informe a data e a hora de início')
    if (fim && new Date(fim) < new Date(inicio)) return setErro('O término precisa ser depois do início')
    setSalvando(true)
    const corpo: EventoEditavel = {
      titulo: ev.titulo,
      descricao: ev.descricao ?? null,
      link: ev.link ?? null,
      inicio: new Date(inicio).toISOString(),
      fim: fim ? new Date(fim).toISOString() : null,
      local_nome: ev.local_nome ?? null,
      endereco: outroLocal ? ev.endereco ?? null : ev.endereco ?? pagina.endereco ?? null,
      pais: outroLocal ? ev.pais ?? 'BR' : pagina.pais || 'BR',
      uf: outroLocal ? ev.uf ?? null : pagina.uf,
      cidade: outroLocal ? ev.cidade ?? null : pagina.cidade,
      gratuito: ev.gratuito ?? null,
      acessibilidades: acess,
      publicado: ev.publicado ?? true,
    }
    try {
      const salvo = ev.id ? await apiPaginas.atualizarEvento(pagina.id, ev.id, corpo) : await apiPaginas.criarEvento(pagina.id, corpo)
      onSalvo(salvo)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar o evento')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Secao titulo={ev.id ? 'Editar evento' : 'Novo evento'} descricao="O evento aparece na sua página e na agenda cultural da Plura. Quem favoritou a cidade recebe um aviso.">
      <Campo rotulo="Título *">
        <Texto valor={ev.titulo ?? ''} onChange={(v) => alterar({ titulo: v })} placeholder="Sarau inclusivo de primavera" max={150} />
      </Campo>
      <Campo grupo rotulo="Descrição">
        <EditorRico rotulo="Descrição do evento" valor={ev.descricao ?? ''} onChange={(v) => alterar({ descricao: v })} max={4000} />
      </Campo>
      <Grade>
        <Campo rotulo="Início *">
          <input type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} style={estiloCampo} />
        </Campo>
        <Campo rotulo="Término" ajuda="Opcional.">
          <input type="datetime-local" value={fim} min={inicio || undefined} onChange={(e) => setFim(e.target.value)} style={estiloCampo} />
        </Campo>
      </Grade>
      <Grade>
        <Campo rotulo="Nome do local" ajuda="Ex.: Auditório principal, Praça central.">
          <Texto valor={ev.local_nome ?? ''} onChange={(v) => alterar({ local_nome: v })} max={200} />
        </Campo>
        <Campo rotulo="Entrada">
          <Selecao
            valor={ev.gratuito == null ? '' : ev.gratuito ? 'sim' : 'nao'}
            onChange={(v) => alterar({ gratuito: v === '' ? null : v === 'sim' })}
            vazio="Não informar"
            opcoes={[
              { valor: 'sim', rotulo: 'Gratuita' },
              { valor: 'nao', rotulo: 'Paga' },
            ]}
          />
        </Campo>
      </Grade>
      <Interruptor ativo={outroLocal} onChange={setOutroLocal} rotulo={`Acontece em outro endereço (não em ${[pagina.cidade, pagina.uf].filter(Boolean).join('/') || 'o endereço da página'})`} />
      {outroLocal && (
        <>
          <SeletorLocalidade
            valor={{ pais: ev.pais ?? 'BR', uf: ev.uf ?? null, cidade: ev.cidade ?? null }}
            onChange={(l) => alterar({ pais: l.pais, uf: l.uf, cidade: l.cidade })}
            buscar={buscarLocalidade}
            obrigatorio
            estiloCampo={estiloCampo}
          />
          <Campo rotulo="Endereço">
            <Texto valor={ev.endereco ?? ''} onChange={(v) => alterar({ endereco: v })} placeholder="Rua, número, bairro" max={200} />
          </Campo>
        </>
      )}
      <Campo rotulo="Link (ingressos, inscrição ou mais informações)">
        <Texto valor={ev.link ?? ''} onChange={(v) => alterar({ link: v })} placeholder="https://" inputMode="url" max={500} />
      </Campo>
      {recursos.length > 0 && (
        <Campo grupo rotulo="Acessibilidade do evento" ajuda="Entre os recursos marcados na aba Acessibilidade.">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {recursos.map((r) => (
              <Chip key={r} ativo={acess.includes(r)} onClick={() => alterar({ acessibilidades: acess.includes(r) ? acess.filter((x) => x !== r) : [...acess, r] })}>
                {rotuloRecurso(r)}
              </Chip>
            ))}
          </div>
        </Campo>
      )}
      <Interruptor ativo={ev.publicado ?? true} onChange={(v) => alterar({ publicado: v })} rotulo="Publicar na página e na agenda" />
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancelar} style={{ padding: '0.6rem 1.125rem', borderRadius: '0.75rem', border: '1px solid var(--c-btn-secondary-border)', background: 'var(--c-btn-secondary-bg)', color: 'var(--c-text-1)', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
          Cancelar
        </button>
        <button type="button" disabled={salvando} onClick={salvar} style={{ padding: '0.6rem 1.125rem', borderRadius: '0.75rem', border: 'none', background: 'linear-gradient(135deg,#1a7aff,#0062e6)', color: '#fff', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: salvando ? 0.6 : 1 }}>
          {salvando ? 'Salvando…' : 'Salvar evento'}
        </button>
      </div>
    </Secao>
  )
}

function Interessados({ paginaId, evento }: { paginaId: string; evento: Evento }) {
  const [lista, setLista] = useState<Interessado[] | null>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    apiPaginas
      .interessadosEvento(paginaId, evento.id)
      .then((r) => setLista(r.interessados))
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar interessados'))
  }, [paginaId, evento.id])

  function exportarCsv() {
    if (!lista) return
    const celula = (v: string) => `"${v.replace(/"/g, '""')}"`
    const linhas = [['Nome', 'Cidade', 'Estado', 'Interesse em'], ...lista.map((i) => [i.nome, i.cidade ?? '', i.uf ?? '', new Date(i.criado_em).toLocaleString('pt-BR')])]
    const csv = '﻿' + linhas.map((l) => l.map(celula).join(';')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `interessados-${evento.titulo.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (erro) return <Aviso tipo="erro">{erro}</Aviso>
  if (!lista) return <p style={{ fontSize: '0.875rem', color: 'var(--c-text-3)' }}>Carregando…</p>
  if (lista.length === 0) return <p style={{ fontSize: '0.875rem', color: 'var(--c-text-3)' }}>Ninguém marcou interesse ainda.</p>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '260px', overflowY: 'auto' }}>
        {lista.map((i, n) => (
          <li key={n} style={{ fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between', gap: '0.75rem', padding: '0.375rem 0', borderBottom: '1px solid var(--c-divider)' }}>
            <span>
              <strong>{i.nome}</strong>
              {i.cidade ? <span style={{ color: 'var(--c-text-2)' }}> · {[i.cidade, i.uf].filter(Boolean).join('/')}</span> : null}
            </span>
            <span style={{ color: 'var(--c-text-3)', whiteSpace: 'nowrap' }}>{new Date(i.criado_em).toLocaleDateString('pt-BR')}</span>
          </li>
        ))}
      </ul>
      <button type="button" onClick={exportarCsv} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.4rem 0.875rem', borderRadius: '0.625rem', border: '1px solid var(--c-btn-secondary-border)', background: 'var(--c-btn-secondary-bg)', color: 'var(--c-text-1)', fontWeight: 600, fontSize: '0.8125rem', fontFamily: 'inherit', cursor: 'pointer' }}>
        <IconDownload size={15} aria-hidden /> Exportar CSV
      </button>
    </div>
  )
}

export default function AbaEventos({ rascunho: p, opcoes }: PropsAba) {
  const [eventos, setEventos] = useState<Evento[] | null>(null)
  const [editando, setEditando] = useState<Partial<Evento> | null>(null)
  const [abertoInteressados, setAbertoInteressados] = useState<string | null>(null)
  const [erro, setErro] = useState('')
  const [enviandoImagem, setEnviandoImagem] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const alvoImagem = useRef<string | null>(null)
  const rotulos = Object.fromEntries(opcoes.grupos_acessibilidade.flatMap((g) => g.recursos.map((r) => [r.codigo, r.rotulo])))

  useEffect(() => {
    apiPaginas
      .listarEventos(p.id)
      .then((r) => setEventos(r.eventos))
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar eventos'))
  }, [p.id])

  function aoSalvar(e: Evento) {
    setEventos((l) => (l ?? []).some((x) => x.id === e.id) ? (l ?? []).map((x) => (x.id === e.id ? e : x)) : [e, ...(l ?? [])])
    setEditando(null)
  }

  async function remover(e: Evento) {
    if (!confirm(`Excluir o evento "${e.titulo}"? Os interesses marcados também serão apagados.`)) return
    try {
      await apiPaginas.removerEvento(p.id, e.id)
      setEventos((l) => (l ?? []).filter((x) => x.id !== e.id))
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao excluir')
    }
  }

  async function aoEscolherImagem(ev: ChangeEvent<HTMLInputElement>) {
    const arquivo = ev.target.files?.[0]
    ev.target.value = ''
    const id = alvoImagem.current
    if (!arquivo || !id) return
    setEnviandoImagem(id)
    try {
      const { base64, extensao } = await comprimirImagem(arquivo, 1600, 0.82)
      const { imagem_url } = await apiPaginas.uploadImagemEvento(p.id, id, base64, extensao)
      setEventos((l) => (l ?? []).map((x) => (x.id === id ? { ...x, imagem_url } : x)))
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao enviar imagem')
    } finally {
      setEnviandoImagem(null)
    }
  }

  if (editando) {
    return <FormEvento inicial={editando} pagina={p} recursos={p.recursos_acessibilidade ?? []} rotuloRecurso={(c) => rotulos[c] ?? c} onSalvo={aoSalvar} onCancelar={() => setEditando(null)} />
  }

  const agora = Date.now()
  const proximos = (eventos ?? []).filter((e) => new Date(e.fim ?? e.inicio).getTime() >= agora).sort((a, b) => a.inicio.localeCompare(b.inicio))
  const passados = (eventos ?? []).filter((e) => new Date(e.fim ?? e.inicio).getTime() < agora)

  const cartao = (e: Evento) => (
    <div key={e.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', padding: '0.75rem', borderRadius: '0.875rem', border: '1px solid var(--c-divider)', opacity: e.publicado ? 1 : 0.65 }}>
      <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => {
            alvoImagem.current = e.id
            inputRef.current?.click()
          }}
          aria-label={`Trocar imagem do evento ${e.titulo}`}
          style={{ width: '120px', height: '90px', borderRadius: '0.625rem', flexShrink: 0, border: '1px dashed var(--c-input-border)', background: e.imagem_url ? `url("${e.imagem_url}") center/cover` : 'var(--c-glass-bg-sm)', color: 'var(--c-text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.75rem' }}
        >
          {enviandoImagem === e.id ? 'Enviando…' : !e.imagem_url && <IconPhoto size={22} aria-hidden />}
        </button>
        <div style={{ flex: '1 1 220px', minWidth: 0 }}>
          <p style={{ fontWeight: 700 }}>{e.titulo}</p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--c-text-2)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <IconCalendarEvent size={14} aria-hidden /> {formatarPeriodo(e.inicio, e.fim)}
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--c-text-2)', marginTop: '0.125rem' }}>
            {[e.local_nome, [e.cidade, e.uf].filter(Boolean).join('/')].filter(Boolean).join(' · ')}
            {!e.publicado && ' · não publicado'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'flex-start' }}>
          <button type="button" onClick={() => setEditando(e)} aria-label={`Editar ${e.titulo}`} style={{ background: 'none', border: '1px solid var(--c-divider)', borderRadius: '0.5rem', padding: '0.35rem', color: 'var(--c-text-2)', cursor: 'pointer', display: 'flex' }}>
            <IconEdit size={16} aria-hidden />
          </button>
          <button type="button" onClick={() => remover(e)} aria-label={`Excluir ${e.titulo}`} style={{ background: 'none', border: '1px solid var(--c-divider)', borderRadius: '0.5rem', padding: '0.35rem', color: 'var(--c-danger-text)', cursor: 'pointer', display: 'flex' }}>
            <IconTrash size={16} aria-hidden />
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setAbertoInteressados((a) => (a === e.id ? null : e.id))}
        aria-expanded={abertoInteressados === e.id}
        style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.35rem 0.75rem', borderRadius: '9999px', border: '1px solid var(--c-accent-soft-border)', background: 'var(--c-accent-soft)', color: 'var(--c-accent-text)', fontWeight: 600, fontSize: '0.8125rem', fontFamily: 'inherit', cursor: 'pointer' }}
      >
        <IconUsers size={15} aria-hidden /> {e.total_interessados} {e.total_interessados === 1 ? 'interessado' : 'interessados'}
      </button>
      {abertoInteressados === e.id && <Interessados paginaId={p.id} evento={e} />}
    </div>
  )

  return (
    <Secao titulo="Eventos" descricao="Shows, oficinas, feiras e outras programações. Aparecem na sua página e na agenda cultural, com o botão “Tenho interesse”.">
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={aoEscolherImagem} style={{ display: 'none' }} />
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <button type="button" onClick={() => setEditando({ publicado: true, acessibilidades: [], pais: p.pais || 'BR' })} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.125rem', borderRadius: '0.75rem', border: 'none', background: 'linear-gradient(135deg,#1a7aff,#0062e6)', color: '#fff', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
        <IconPlus size={18} aria-hidden /> Novo evento
      </button>
      {eventos === null && !erro && <p style={{ color: 'var(--c-text-3)' }}>Carregando eventos…</p>}
      {eventos && eventos.length === 0 && <p style={{ color: 'var(--c-text-3)' }}>Nenhum evento cadastrado.</p>}
      {proximos.length > 0 && (
        <>
          <h3 style={{ margin: '0.5rem 0 0', fontSize: '0.9375rem', fontWeight: 700 }}>Próximos</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>{proximos.map(cartao)}</div>
        </>
      )}
      {passados.length > 0 && (
        <>
          <h3 style={{ margin: '0.5rem 0 0', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--c-text-2)' }}>Já aconteceram</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>{passados.map(cartao)}</div>
        </>
      )}
    </Secao>
  )
}
