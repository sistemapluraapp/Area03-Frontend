'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import { IconClock, IconEdit, IconPhoto, IconPlus, IconTrash } from '@tabler/icons-react'
import { AreaTexto, Aviso, Campo, Chip, Grade, Interruptor, Secao, Selecao, Texto } from './Campos'
import { apiPaginas, type Experiencia } from '@/lib/apiPaginas'
import { comprimirImagem } from '@/lib/comprimirImagem'
import type { PropsAba } from './tipos'

const NIVEIS = [
  { valor: 'todos', rotulo: 'Todos os níveis' },
  { valor: 'facil', rotulo: 'Fácil' },
  { valor: 'moderado', rotulo: 'Moderado' },
  { valor: 'dificil', rotulo: 'Difícil' },
]

const VAZIA: Partial<Experiencia> = { nome: '', requer_acompanhamento: false, acessibilidades: [], ativo: true }

function FormExperiencia({ inicial, paginaId, recursosPagina, rotuloRecurso, onSalva, onCancelar }: {
  inicial: Partial<Experiencia>
  paginaId: string
  recursosPagina: string[]
  rotuloRecurso: (c: string) => string
  onSalva: (e: Experiencia) => void
  onCancelar: () => void
}) {
  const [exp, setExp] = useState<Partial<Experiencia>>(inicial)
  const [preco, setPreco] = useState(inicial.preco_a_partir != null ? String(inicial.preco_a_partir).replace('.', ',') : '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const alterar = (patch: Partial<Experiencia>) => setExp((e) => ({ ...e, ...patch }))

  async function salvar() {
    setSalvando(true)
    setErro('')
    const precoNumero = preco.trim() ? Number(preco.replace(/\./g, '').replace(',', '.')) : null
    if (precoNumero !== null && Number.isNaN(precoNumero)) {
      setErro('Preço inválido')
      setSalvando(false)
      return
    }
    const corpo = {
      nome: exp.nome,
      descricao: exp.descricao ?? null,
      duracao: exp.duracao ?? null,
      preco_a_partir: precoNumero,
      local: exp.local ?? null,
      faixa_etaria: exp.faixa_etaria ?? null,
      nivel_dificuldade: exp.nivel_dificuldade ?? null,
      requer_acompanhamento: !!exp.requer_acompanhamento,
      equipamentos: exp.equipamentos ?? null,
      o_que_levar: exp.o_que_levar ?? null,
      acessibilidades: exp.acessibilidades ?? [],
      ativo: exp.ativo ?? true,
    }
    try {
      const salva = exp.id ? await apiPaginas.atualizarExperiencia(paginaId, exp.id, corpo) : await apiPaginas.criarExperiencia(paginaId, corpo)
      onSalva(salva)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar experiência')
    } finally {
      setSalvando(false)
    }
  }

  const acess = exp.acessibilidades ?? []

  return (
    <Secao titulo={exp.id ? 'Editar experiência' : 'Nova experiência'}>
      <Campo rotulo="Nome da atividade *">
        <Texto valor={exp.nome ?? ''} onChange={(v) => alterar({ nome: v })} placeholder="Mergulho acessível" max={120} />
      </Campo>
      <Campo rotulo="O que você vai encontrar">
        <AreaTexto valor={exp.descricao ?? ''} onChange={(v) => alterar({ descricao: v })} max={3000} />
      </Campo>
      <Grade colunas={3}>
        <Campo rotulo="Duração">
          <Texto valor={exp.duracao ?? ''} onChange={(v) => alterar({ duracao: v })} placeholder="2 horas" max={60} />
        </Campo>
        <Campo rotulo="A partir de (R$)">
          <Texto valor={preco} onChange={setPreco} placeholder="80,00" inputMode="numeric" />
        </Campo>
        <Campo rotulo="Nível de dificuldade">
          <Selecao valor={exp.nivel_dificuldade ?? ''} onChange={(v) => alterar({ nivel_dificuldade: (v || null) as Experiencia['nivel_dificuldade'] })} vazio="Não informar" opcoes={NIVEIS} />
        </Campo>
        <Campo rotulo="Local">
          <Texto valor={exp.local ?? ''} onChange={(v) => alterar({ local: v })} placeholder="Piscinas naturais" max={200} />
        </Campo>
        <Campo rotulo="Faixa etária">
          <Texto valor={exp.faixa_etaria ?? ''} onChange={(v) => alterar({ faixa_etaria: v })} placeholder="A partir de 8 anos" max={80} />
        </Campo>
      </Grade>
      <Interruptor ativo={!!exp.requer_acompanhamento} onChange={(v) => alterar({ requer_acompanhamento: v })} rotulo="Necessário estar acompanhado" />
      <Grade>
        <Campo rotulo="Equipamentos fornecidos">
          <AreaTexto valor={exp.equipamentos ?? ''} onChange={(v) => alterar({ equipamentos: v })} linhas={2} max={1000} />
        </Campo>
        <Campo rotulo="O que levar">
          <AreaTexto valor={exp.o_que_levar ?? ''} onChange={(v) => alterar({ o_que_levar: v })} linhas={2} max={1000} />
        </Campo>
      </Grade>
      {recursosPagina.length > 0 && (
        <Campo rotulo="Acessibilidades desta experiência" ajuda="Entre os recursos marcados na aba Acessibilidade.">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {recursosPagina.map((r) => (
              <Chip key={r} ativo={acess.includes(r)} onClick={() => alterar({ acessibilidades: acess.includes(r) ? acess.filter((x) => x !== r) : [...acess, r] })}>
                {rotuloRecurso(r)}
              </Chip>
            ))}
          </div>
        </Campo>
      )}
      <Interruptor ativo={exp.ativo ?? true} onChange={(v) => alterar({ ativo: v })} rotulo="Exibir na página" />
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancelar} style={{ padding: '0.6rem 1.125rem', borderRadius: '0.75rem', border: '1px solid var(--c-btn-secondary-border)', background: 'var(--c-btn-secondary-bg)', color: 'var(--c-text-1)', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
          Cancelar
        </button>
        <button type="button" disabled={salvando || !exp.nome?.trim()} onClick={salvar} style={{ padding: '0.6rem 1.125rem', borderRadius: '0.75rem', border: 'none', background: 'linear-gradient(135deg,#1a7aff,#0062e6)', color: '#fff', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: salvando || !exp.nome?.trim() ? 0.6 : 1 }}>
          {salvando ? 'Salvando…' : 'Salvar experiência'}
        </button>
      </div>
    </Secao>
  )
}

export default function AbaExperiencias({ rascunho: p, aplicarSalvo, opcoes }: PropsAba) {
  const [editando, setEditando] = useState<Partial<Experiencia> | null>(null)
  const [erro, setErro] = useState('')
  const [enviandoImagem, setEnviandoImagem] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const alvoImagem = useRef<string | null>(null)
  const experiencias = p.experiencias ?? []

  const rotulos = Object.fromEntries(opcoes.grupos_acessibilidade.flatMap((g) => g.recursos.map((r) => [r.codigo, r.rotulo])))

  function aoSalvar(e: Experiencia) {
    aplicarSalvo({ experiencias: experiencias.some((x) => x.id === e.id) ? experiencias.map((x) => (x.id === e.id ? e : x)) : [...experiencias, e] })
    setEditando(null)
  }

  async function remover(e: Experiencia) {
    if (!confirm(`Remover a experiência "${e.nome}"?`)) return
    try {
      await apiPaginas.removerExperiencia(p.id, e.id)
      aplicarSalvo({ experiencias: experiencias.filter((x) => x.id !== e.id) })
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao remover')
    }
  }

  async function aoEscolherImagem(ev: ChangeEvent<HTMLInputElement>) {
    const arquivo = ev.target.files?.[0]
    ev.target.value = ''
    const id = alvoImagem.current
    if (!arquivo || !id) return
    setEnviandoImagem(id)
    try {
      const { base64, extensao } = await comprimirImagem(arquivo, 1280, 0.82)
      const { imagem_url } = await apiPaginas.uploadImagemExperiencia(p.id, id, base64, extensao)
      aplicarSalvo({ experiencias: experiencias.map((x) => (x.id === id ? { ...x, imagem_url } : x)) })
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao enviar imagem')
    } finally {
      setEnviandoImagem(null)
    }
  }

  if (editando) {
    return (
      <FormExperiencia
        inicial={editando}
        paginaId={p.id}
        recursosPagina={p.recursos_acessibilidade ?? []}
        rotuloRecurso={(c) => rotulos[c] ?? c}
        onSalva={aoSalvar}
        onCancelar={() => setEditando(null)}
      />
    )
  }

  return (
    <Secao titulo="Experiências" descricao="O que o visitante vai fazer no local. Cada experiência vira um card na sua página, com botão “Saiba mais”.">
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={aoEscolherImagem} style={{ display: 'none' }} />
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      {experiencias.length === 0 && <p style={{ color: 'var(--c-text-3)' }}>Nenhuma experiência cadastrada.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {experiencias.map((e) => (
          <div key={e.id} style={{ display: 'flex', gap: '0.875rem', padding: '0.75rem', borderRadius: '0.875rem', border: '1px solid var(--c-divider)', opacity: e.ativo ? 1 : 0.6, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                alvoImagem.current = e.id
                inputRef.current?.click()
              }}
              aria-label="Trocar imagem da experiência"
              style={{ width: '120px', height: '90px', borderRadius: '0.625rem', flexShrink: 0, border: '1px dashed var(--c-input-border)', background: e.imagem_url ? `url("${e.imagem_url}") center/cover` : 'var(--c-glass-bg-sm)', color: 'var(--c-text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.75rem' }}
            >
              {enviandoImagem === e.id ? 'Enviando…' : !e.imagem_url && <IconPhoto size={22} />}
            </button>
            <div style={{ flex: '1 1 200px', minWidth: 0 }}>
              <p style={{ fontWeight: 700 }}>{e.nome}</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--c-text-2)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                {e.duracao && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <IconClock size={14} /> {e.duracao}
                  </span>
                )}
                {e.preco_a_partir != null && <span>a partir de {Number(e.preco_a_partir).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>}
                {!e.ativo && <span>oculta</span>}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'flex-start' }}>
              <button type="button" onClick={() => setEditando(e)} aria-label="Editar" style={{ background: 'none', border: '1px solid var(--c-divider)', borderRadius: '0.5rem', padding: '0.35rem', color: 'var(--c-text-2)', cursor: 'pointer', display: 'flex' }}>
                <IconEdit size={16} />
              </button>
              <button type="button" onClick={() => remover(e)} aria-label="Remover" style={{ background: 'none', border: '1px solid var(--c-divider)', borderRadius: '0.5rem', padding: '0.35rem', color: 'var(--c-danger-text)', cursor: 'pointer', display: 'flex' }}>
                <IconTrash size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setEditando({ ...VAZIA })} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.125rem', borderRadius: '0.75rem', border: 'none', background: 'linear-gradient(135deg,#1a7aff,#0062e6)', color: '#fff', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
        <IconPlus size={18} /> Nova experiência
      </button>
    </Secao>
  )
}
