'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { IconArrowLeft, IconCertificate, IconCheck, IconDownload, IconLock, IconPaperclip, IconPlus, IconSend, IconTrash } from '@tabler/icons-react'
import Carregando from '@/components/Carregando'
import { Aviso } from '@/components/editor/Campos'
import { IconeCertificacao, SeloStatus, botaoPrimario, botaoSecundario } from './Comuns'
import { EXTENSOES_ACEITAS, MAX_ARQUIVO_BYTES, apiCertificacoes, tamanhoLegivel, type ArquivoEnviado, type CampoFormulario, type DataVistoria, type InscricaoDetalhe, type Requisito, type Resposta } from '@/lib/apiCertificacoes'
import { ROTULO_TIPO_REQUISITO } from '@/lib/rotulosCertificacoes'
import { baixarCertificadoPdf } from '@/lib/certificadoPdf'

type Valor = Resposta['valor']

const campo = { width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.75rem', border: '1px solid var(--c-input-border)', background: 'var(--c-input-bg, var(--c-glass-bg))', color: 'var(--c-text-1)', fontFamily: 'inherit', fontSize: '0.9375rem' } as const

const ROTULO_RESPOSTA = {
  rascunho: { texto: 'Salvo, ainda não enviado', cor: 'var(--c-text-2)' },
  enviada: { texto: 'Enviado para análise', cor: 'var(--c-warning-text)' },
  aprovada: { texto: 'Aprovado', cor: 'var(--c-success-text)' },
  ajustes: { texto: 'Ajuste pedido pela Plura', cor: 'var(--c-danger-text)' },
} as const

function iguais(a: Valor | undefined, b: Valor | undefined) {
  return JSON.stringify(a ?? {}) === JSON.stringify(b ?? {})
}

function CamposFormulario({ campos, valor, onChange, desativado, prefixo }: { campos: CampoFormulario[]; valor: (string | null)[]; onChange: (v: (string | null)[]) => void; desativado: boolean; prefixo: string }) {
  const mudar = (i: number, v: string) => {
    const novo = campos.map((_, j) => (j === i ? v : valor[j] ?? ''))
    onChange(novo)
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {campos.map((c, i) => {
        const id = `${prefixo}-${i}`
        const v = valor[i] ?? ''
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label htmlFor={id} style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--c-text-2)' }}>
              {c.rotulo}{c.obrigatorio ? ' *' : ''}
            </label>
            {c.tipo === 'texto_longo' ? (
              <textarea id={id} value={v} onChange={(e) => mudar(i, e.target.value)} rows={3} maxLength={5000} disabled={desativado} style={{ ...campo, resize: 'vertical' }} />
            ) : c.tipo === 'sim_nao' ? (
              <select id={id} value={v} onChange={(e) => mudar(i, e.target.value)} disabled={desativado} style={campo}>
                <option value="">Escolha</option>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            ) : c.tipo === 'opcoes' ? (
              <select id={id} value={v} onChange={(e) => mudar(i, e.target.value)} disabled={desativado} style={campo}>
                <option value="">Escolha</option>
                {(c.opcoes ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                id={id}
                type={c.tipo === 'numero' ? 'number' : c.tipo === 'data' ? 'date' : 'text'}
                value={v}
                onChange={(e) => mudar(i, e.target.value)}
                maxLength={500}
                disabled={desativado}
                style={campo}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

const PERIODO = { manha: 'Manhã', tarde: 'Tarde' } as const

function amanha() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

function dataBr(iso: string) {
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

// Arquivos: cada envio vai direto para o armazenamento (não usa o botão Salvar)
function ArquivosRequisito({ req, itens, editavel, paginaId, inscricaoId, onResposta, onErro }: {
  req: Requisito
  itens: ArquivoEnviado[]
  editavel: boolean
  paginaId: string
  inscricaoId: string
  onResposta: (r: Resposta) => void
  onErro: (m: string) => void
}) {
  const [enviando, setEnviando] = useState<string | null>(null)
  const [removendo, setRemovendo] = useState<string | null>(null)
  const max = Math.min(Math.max(req.config.max_arquivos ?? 1, 1), 10)
  const id = `arq-${req.id}`

  async function enviar(arquivo: File | undefined) {
    if (!arquivo) return
    if (arquivo.size > MAX_ARQUIVO_BYTES) return onErro(`"${arquivo.name}" passa de 25 MB.`)
    setEnviando(arquivo.name)
    onErro('')
    try {
      onResposta(await apiCertificacoes.enviarArquivo(paginaId, inscricaoId, req.id, arquivo))
    } catch (e) {
      onErro(e instanceof Error ? e.message : 'Não foi possível enviar o arquivo')
    } finally {
      setEnviando(null)
    }
  }

  async function remover(item: ArquivoEnviado) {
    if (!confirm(`Remover "${item.nome}"?`)) return
    setRemovendo(item.chave)
    onErro('')
    try {
      await apiCertificacoes.removerArquivo(paginaId, inscricaoId, req.id, item.chave)
      const restantes = itens.filter((i) => i.chave !== item.chave)
      onResposta({ requisito_id: req.id, valor: { itens: restantes }, status: 'rascunho', comentario_adm: null, updated_at: new Date().toISOString() })
    } catch (e) {
      onErro(e instanceof Error ? e.message : 'Não foi possível remover')
    } finally {
      setRemovendo(null)
    }
  }

  async function baixar(item: ArquivoEnviado) {
    try {
      await apiCertificacoes.baixarArquivo(paginaId, inscricaoId, req.id, item)
    } catch (e) {
      onErro(e instanceof Error ? e.message : 'Não foi possível baixar')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {itens.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {itens.map((item) => (
            <li key={item.chave} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '0.75rem', background: 'var(--c-glass-bg-sm)', border: '1px solid var(--c-divider)' }}>
              <IconPaperclip size={16} aria-hidden style={{ flexShrink: 0, color: 'var(--c-text-3)' }} />
              <span style={{ flex: 1, minWidth: 0, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.nome} <span style={{ color: 'var(--c-text-3)' }}>· {tamanhoLegivel(item.tamanho)}</span>
              </span>
              <button type="button" onClick={() => baixar(item)} aria-label={`Baixar ${item.nome}`} style={{ ...botaoSecundario, padding: '0.3rem 0.6rem' }}>
                <IconDownload size={15} aria-hidden />
              </button>
              {editavel && (
                <button type="button" onClick={() => remover(item)} disabled={removendo === item.chave} aria-label={`Remover ${item.nome}`} style={{ ...botaoSecundario, padding: '0.3rem 0.6rem', color: 'var(--c-danger-text)' }}>
                  <IconTrash size={15} aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {editavel && itens.length < max && (
        <div>
          <label htmlFor={id} style={{ ...botaoSecundario, opacity: enviando ? 0.6 : 1, cursor: enviando ? 'wait' : 'pointer' }}>
            <IconPlus size={16} aria-hidden /> {enviando ? `Enviando ${enviando}…` : itens.length ? 'Enviar outro arquivo' : 'Escolher arquivo'}
          </label>
          <input
            id={id}
            type="file"
            accept={EXTENSOES_ACEITAS}
            disabled={!!enviando}
            onChange={(e) => {
              enviar(e.target.files?.[0])
              e.target.value = ''
            }}
            className="sr-only"
          />
        </div>
      )}
      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--c-text-3)' }}>
        {itens.length} de {max} {max === 1 ? 'arquivo' : 'arquivos'} · até 25 MB cada · PDF, imagens, documentos, planilhas ou vídeo MP4/MOV
      </p>
    </div>
  )
}

// Vistoria: até 3 datas (manhã ou tarde), contato e observações
function VistoriaRequisito({ valor, onChange, editavel, prefixo }: { valor: Valor | undefined; onChange: (v: Valor) => void; editavel: boolean; prefixo: string }) {
  const datas = (valor?.itens ?? []) as DataVistoria[]
  const mudarData = (i: number, patch: Partial<DataVistoria>) => onChange({ ...valor, itens: datas.map((d, j) => (j === i ? { ...d, ...patch } : d)) })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      {valor?.confirmada && (
        <Aviso tipo="sucesso">Vistoria confirmada para {dataBr(valor.confirmada.data)} ({PERIODO[valor.confirmada.periodo as keyof typeof PERIODO] ?? valor.confirmada.periodo}).</Aviso>
      )}
      <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--c-text-2)' }}>Sugira até 3 datas. A Plura confirma uma delas.</p>
      {datas.map((d, i) => (
        <div key={i} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <label className="sr-only" htmlFor={`${prefixo}-d${i}`}>Data {i + 1}</label>
          <input id={`${prefixo}-d${i}`} type="date" min={amanha()} value={d.data} onChange={(e) => mudarData(i, { data: e.target.value })} disabled={!editavel} style={{ ...campo, width: 'auto', flex: '1 1 160px' }} />
          <label className="sr-only" htmlFor={`${prefixo}-p${i}`}>Período da data {i + 1}</label>
          <select id={`${prefixo}-p${i}`} value={d.periodo} onChange={(e) => mudarData(i, { periodo: e.target.value as DataVistoria['periodo'] })} disabled={!editavel} style={{ ...campo, width: 'auto', flex: '1 1 120px' }}>
            <option value="manha">Manhã</option>
            <option value="tarde">Tarde</option>
          </select>
          {editavel && (
            <button type="button" onClick={() => onChange({ ...valor, itens: datas.filter((_, j) => j !== i) })} aria-label={`Remover data ${i + 1}`} style={{ ...botaoSecundario, padding: '0.45rem 0.6rem', color: 'var(--c-danger-text)' }}>
              <IconTrash size={15} aria-hidden />
            </button>
          )}
        </div>
      ))}
      {editavel && datas.length < 3 && (
        <button type="button" onClick={() => onChange({ ...valor, itens: [...datas, { data: amanha(), periodo: 'manha' }] })} style={{ ...botaoSecundario, alignSelf: 'flex-start' }}>
          <IconPlus size={16} aria-hidden /> Adicionar data
        </button>
      )}
      <label htmlFor={`${prefixo}-contato`} style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--c-text-2)' }}>Quem recebe a vistoria (nome e telefone)</label>
      <input id={`${prefixo}-contato`} value={valor?.contato ?? ''} onChange={(e) => onChange({ ...valor, contato: e.target.value })} maxLength={200} disabled={!editavel} style={campo} />
      <label htmlFor={`${prefixo}-obs`} style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--c-text-2)' }}>Observações (opcional)</label>
      <textarea id={`${prefixo}-obs`} value={valor?.observacoes ?? ''} onChange={(e) => onChange({ ...valor, observacoes: e.target.value })} rows={2} maxLength={2000} disabled={!editavel} style={{ ...campo, resize: 'vertical' }} />
    </div>
  )
}

function ItemRequisito({ req, resposta, editavel, valor, onChange, onSalvar, salvando, alterado, paginaId, inscricaoId, onResposta, onErro }: {
  paginaId: string
  inscricaoId: string
  onResposta: (r: Resposta) => void
  onErro: (m: string) => void
  req: Requisito
  resposta: Resposta | undefined
  editavel: boolean
  valor: Valor | undefined
  onChange: (v: Valor) => void
  onSalvar: () => void
  salvando: boolean
  alterado: boolean
}) {
  const st = resposta ? ROTULO_RESPOSTA[resposta.status] : null
  const ehArquivo = req.tipo === 'arquivo'
  const id = `req-${req.id}`
  return (
    <li style={{ padding: '1rem', borderRadius: '0.875rem', border: resposta?.status === 'ajustes' ? '1px solid var(--c-danger-border)' : 'var(--c-border)', background: 'var(--c-glass-bg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        <p style={{ margin: 0, fontWeight: 700 }}>
          {req.titulo}
          {!req.obrigatorio && <span style={{ fontWeight: 500, color: 'var(--c-text-3)' }}> (opcional)</span>}
        </p>
        <span style={{ fontSize: '0.75rem', color: 'var(--c-text-3)' }}>{ROTULO_TIPO_REQUISITO[req.tipo]}</span>
      </div>
      {req.descricao && <p style={{ margin: '0.3rem 0 0', fontSize: '0.875rem', color: 'var(--c-text-2)', whiteSpace: 'pre-line' }}>{req.descricao}</p>}
      {resposta?.status === 'ajustes' && resposta.comentario_adm && (
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: 'var(--c-danger-text)' }}>
          <strong>O que ajustar:</strong> {resposta.comentario_adm}
        </p>
      )}

      <div style={{ marginTop: '0.75rem' }}>
        {ehArquivo ? (
          <ArquivosRequisito req={req} itens={(resposta?.valor.itens ?? []) as ArquivoEnviado[]} editavel={editavel} paginaId={paginaId} inscricaoId={inscricaoId} onResposta={onResposta} onErro={onErro} />
        ) : req.tipo === 'vistoria' ? (
          <VistoriaRequisito valor={valor} onChange={onChange} editavel={editavel} prefixo={id} />
        ) : req.tipo === 'texto' ? (
          <>
            <label htmlFor={id} className="sr-only">Resposta para {req.titulo}</label>
            <textarea id={id} value={valor?.texto ?? ''} onChange={(e) => onChange({ texto: e.target.value })} rows={5} maxLength={10000} disabled={!editavel} style={{ ...campo, resize: 'vertical' }} />
          </>
        ) : req.tipo === 'link' || req.tipo === 'video' ? (
          <>
            <label htmlFor={id} className="sr-only">{req.tipo === 'video' ? 'Link do vídeo' : 'Link'} para {req.titulo}</label>
            <input id={id} type="url" inputMode="url" value={valor?.url ?? ''} onChange={(e) => onChange({ url: e.target.value })} placeholder="https://..." disabled={!editavel} style={campo} />
          </>
        ) : (
          <CamposFormulario campos={req.config.campos ?? []} valor={valor?.respostas ?? []} onChange={(respostas) => onChange({ respostas })} desativado={!editavel} prefixo={id} />
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
        {editavel && !ehArquivo && (
          <button type="button" onClick={onSalvar} disabled={!alterado || salvando} style={{ ...botaoSecundario, opacity: !alterado || salvando ? 0.55 : 1 }}>
            <IconCheck size={16} aria-hidden /> {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        )}
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: alterado ? 'var(--c-text-1)' : st?.cor ?? 'var(--c-text-3)' }}>
          {alterado ? 'Alteração não salva' : st?.texto ?? 'Ainda não respondido'}
        </span>
      </div>
    </li>
  )
}

// Preenchimento de uma inscrição: etapas liberadas, requisitos, envio e cancelamento
export default function Preenchimento({ paginaId, inscricaoId, onVoltar, pagina }: { paginaId: string; inscricaoId: string; onVoltar: () => void; pagina: { nome: string; cidade: string | null; uf: string | null } }) {
  const [insc, setInsc] = useState<InscricaoDetalhe | null>(null)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [valores, setValores] = useState<Record<string, Valor>>({})
  const [salvando, setSalvando] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const carregar = useCallback(() => {
    apiCertificacoes
      .inscricao(paginaId, inscricaoId)
      .then((d) => {
        setInsc(d)
        setValores(Object.fromEntries(d.respostas.map((r) => [r.requisito_id, r.valor])))
      })
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar a inscrição'))
  }, [paginaId, inscricaoId])

  useEffect(() => carregar(), [carregar])

  const respostas = useMemo(() => Object.fromEntries((insc?.respostas ?? []).map((r) => [r.requisito_id, r])), [insc])
  const liberadas = useMemo(() => new Map((insc?.etapas_liberadas ?? []).map((l) => [l.etapa_id, l.aprovada])), [insc])
  const alterados = useMemo(
    () => Object.keys(valores).filter((id) => !iguais(valores[id], respostas[id]?.valor)),
    [valores, respostas],
  )

  if (erro && !insc) return <Aviso tipo="erro">{erro}</Aviso>
  if (!insc) return <Carregando />

  const emAndamento = insc.status === 'em_andamento'

  function aplicarResposta(r: Resposta) {
    setInsc((atual) => atual && { ...atual, respostas: [...atual.respostas.filter((x) => x.requisito_id !== r.requisito_id), r] })
    setValores((v) => ({ ...v, [r.requisito_id]: r.valor }))
  }

  async function salvar(req: Requisito) {
    setSalvando(req.id)
    setErro('')
    setAviso('')
    try {
      const r = await apiCertificacoes.salvarResposta(paginaId, inscricaoId, req.id, valores[req.id] ?? {})
      setInsc((atual) => atual && { ...atual, respostas: [...atual.respostas.filter((x) => x.requisito_id !== req.id), r] })
      setValores((v) => ({ ...v, [req.id]: r.valor }))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar')
    } finally {
      setSalvando(null)
    }
  }

  async function enviar() {
    if (!confirm('Enviar para a análise da Plura? Depois de enviado, só dá para alterar se a Plura pedir ajustes.')) return
    setEnviando(true)
    setErro('')
    try {
      await apiCertificacoes.enviar(paginaId, inscricaoId)
      setAviso('Enviado! A equipe da Plura vai analisar e você recebe um aviso com o resultado.')
      carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível enviar')
    } finally {
      setEnviando(false)
    }
  }

  async function cancelar() {
    if (!confirm('Cancelar esta inscrição? As respostas ficam guardadas, mas para continuar será preciso começar uma nova inscrição.')) return
    try {
      await apiCertificacoes.cancelar(paginaId, inscricaoId)
      onVoltar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível cancelar')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <button type="button" onClick={onVoltar} style={{ ...botaoSecundario, alignSelf: 'flex-start', borderRadius: '9999px' }}>
        <IconArrowLeft size={16} aria-hidden /> Minhas certificações
      </button>

      <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
        <IconeCertificacao icone={insc.certificacao.icone} tamanho={52} />
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{insc.certificacao.titulo}</h2>
          <div style={{ marginTop: '0.3rem' }}><SeloStatus status={insc.status} /></div>
        </div>
      </div>

      {aviso && <Aviso tipo="sucesso">{aviso}</Aviso>}
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      {insc.status === 'enviada' && !aviso && <Aviso>Suas respostas estão com a equipe da Plura. Você recebe um aviso quando a análise terminar.</Aviso>}
      {insc.status === 'aprovada' && (
        <>
          <Aviso tipo="sucesso">
            Parabéns! Esta página tem a certificação{insc.expira_em ? ` até ${new Date(insc.expira_em).toLocaleDateString('pt-BR')}` : ''}.
            {insc.codigo && <> Código de verificação: <strong>{insc.codigo}</strong>. O selo já aparece na página pública.</>}
          </Aviso>
          {insc.codigo && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                style={botaoPrimario}
                onClick={() =>
                  baixarCertificadoPdf({
                    codigo: insc.codigo!,
                    certificacao: insc.certificacao.titulo,
                    pagina: pagina.nome,
                    local: [pagina.cidade, pagina.uf].filter(Boolean).join('/'),
                    concedidaEm: insc.concedida_em ?? new Date().toISOString(),
                    expiraEm: insc.expira_em,
                  }).catch(() => setErro('Não foi possível gerar o PDF'))
                }
              >
                <IconCertificate size={17} aria-hidden /> Baixar certificado (PDF)
              </button>
              <a href={`https://plura.app.br/verificar?codigo=${encodeURIComponent(insc.codigo)}`} target="_blank" rel="noopener noreferrer" style={botaoSecundario}>
                Ver página de verificação
              </a>
            </div>
          )}
        </>
      )}
      {insc.status === 'reprovada' && <Aviso tipo="erro">A certificação não foi aprovada.{insc.observacao_adm ? ` Motivo: ${insc.observacao_adm}` : ''}</Aviso>}
      {insc.status === 'cancelada' && <Aviso>Esta inscrição foi cancelada.</Aviso>}

      {insc.certificacao.etapas.map((etapa, i) => {
        const liberada = liberadas.has(etapa.id)
        const aprovada = liberadas.get(etapa.id) === true
        return (
          <section key={etapa.id} aria-labelledby={`etapa-${etapa.id}`} style={{ padding: '1.25rem', borderRadius: '1.125rem', border: 'var(--c-border)', background: 'var(--c-glass-bg-sm)', opacity: liberada ? 1 : 0.7 }}>
            <h3 id={`etapa-${etapa.id}`} style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {!liberada && <IconLock size={18} aria-hidden />}
              Etapa {i + 1}: {etapa.titulo}
              {aprovada && <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-success-text)' }}>aprovada</span>}
            </h3>
            {etapa.descricao && <p style={{ margin: '0.3rem 0 0', fontSize: '0.875rem', color: 'var(--c-text-2)' }}>{etapa.descricao}</p>}
            {!liberada ? (
              <p style={{ margin: '0.625rem 0 0', fontSize: '0.875rem', color: 'var(--c-text-3)' }}>Liberada depois que a etapa anterior for aprovada pela Plura.</p>
            ) : (
              <ul style={{ listStyle: 'none', margin: '0.875rem 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {etapa.requisitos.map((req) => {
                  const resp = respostas[req.id]
                  const editavel = emAndamento && !aprovada && (!resp || resp.status === 'rascunho' || resp.status === 'ajustes')
                  return (
                    <ItemRequisito
                      key={req.id}
                      req={req}
                      resposta={resp}
                      editavel={editavel}
                      valor={valores[req.id]}
                      onChange={(v) => setValores((atual) => ({ ...atual, [req.id]: v }))}
                      onSalvar={() => salvar(req)}
                      salvando={salvando === req.id}
                      alterado={alterados.includes(req.id)}
                      paginaId={paginaId}
                      inscricaoId={inscricaoId}
                      onResposta={aplicarResposta}
                      onErro={setErro}
                    />
                  )
                })}
              </ul>
            )}
          </section>
        )
      })}

      {(emAndamento || insc.status === 'enviada') && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', padding: '1rem', borderRadius: '1rem', border: 'var(--c-border)', background: 'var(--c-glass-bg)' }}>
          {emAndamento && (
            <button type="button" onClick={enviar} disabled={enviando || alterados.length > 0} style={{ ...botaoPrimario, opacity: enviando || alterados.length > 0 ? 0.6 : 1 }}>
              <IconSend size={17} aria-hidden /> {enviando ? 'Enviando…' : 'Enviar para análise'}
            </button>
          )}
          <button type="button" onClick={cancelar} style={{ ...botaoSecundario, color: 'var(--c-danger-text)' }}>Cancelar inscrição</button>
          {emAndamento && alterados.length > 0 && (
            <span style={{ fontSize: '0.8125rem', color: 'var(--c-text-2)' }}>Salve as alterações antes de enviar.</span>
          )}
        </div>
      )}
    </div>
  )
}
