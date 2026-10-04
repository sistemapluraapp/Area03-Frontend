'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { IconCheck, IconHistory, IconTrash, IconUserPlus, IconUsers } from '@tabler/icons-react'
import { Aviso, Campo, Grade, Secao, Selecao, Texto } from './Campos'
import { ApiError } from '@/lib/api'
import { apiPaginas, type LogPagina, type VinculoPagina } from '@/lib/apiPaginas'
import type { PropsAba } from './tipos'
import Carregando from '@/components/Carregando'

const AREA01_URL = process.env.NEXT_PUBLIC_AREA01_URL ?? 'https://plura.app.br'

// Única diferença entre as Áreas 02 e 03 neste arquivo
const QUEM_PODE_ENTRAR = 'Contas Gov ou qualquer pessoa com conta Plura (usuário). Ela edita esta página entrando por gov.plura.app.br.'

const botaoPrimario = { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.125rem', borderRadius: '0.75rem', border: 'none', background: 'linear-gradient(135deg,#1a7aff,#0062e6)', color: '#fff', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' } as const
const etiqueta = { fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0.15rem 0.5rem', borderRadius: '9999px', border: '1px solid var(--c-divider)', color: 'var(--c-text-2)' } as const

function dataHora(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AbaEquipe({ salvo }: PropsAba) {
  const paginaId = salvo.id
  const souAdmin = salvo.meu_acesso?.papel === 'administrador'
  const [equipe, setEquipe] = useState<VinculoPagina[]>(salvo.vinculos ?? [])
  const [abas, setAbas] = useState<{ id: string; rotulo: string }[]>([])
  const [logs, setLogs] = useState<LogPagina[] | null>(null)
  const [erro, setErro] = useState('')
  const [semConta, setSemConta] = useState(false)
  const [mensagem, setMensagem] = useState('')

  // Adicionar pessoa
  const [email, setEmail] = useState('')
  const [cargoNovo, setCargoNovo] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Permissões do colaborador selecionado
  const [selecionado, setSelecionado] = useState('')
  const [cargo, setCargo] = useState('')
  const [permissoes, setPermissoes] = useState<string[]>([])
  const [salvando, setSalvando] = useState(false)

  const carregar = useCallback(async () => {
    try {
      const [e, l] = await Promise.all([apiPaginas.equipe(paginaId), apiPaginas.logs(paginaId)])
      setEquipe(e.equipe)
      setAbas(e.abas)
      setLogs(l.logs)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar a equipe')
    }
  }, [paginaId])

  useEffect(() => {
    carregar()
  }, [carregar])

  // Só colaboradores entram no seletor; quem não é dono não edita a si mesmo
  const editaveis = useMemo(() => equipe.filter((m) => m.papel === 'colaborador' && (souAdmin || !m.eh_voce)), [equipe, souAdmin])
  const membro = editaveis.find((m) => m.id === selecionado) ?? null

  useEffect(() => {
    setCargo(membro?.cargo ?? '')
    setPermissoes(membro?.permissoes ?? [])
  }, [membro])

  const alterado = !!membro && ((membro.cargo ?? '') !== cargo.trim() || [...membro.permissoes].sort().join() !== [...permissoes].sort().join())

  async function adicionar(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setEnviando(true)
    setErro('')
    setSemConta(false)
    setMensagem('')
    try {
      const novo = await apiPaginas.adicionarMembro(paginaId, { email: email.trim(), cargo: cargoNovo.trim() || null, permissoes: [] })
      setEmail('')
      setCargoNovo('')
      await carregar()
      setSelecionado(novo.id)
      setMensagem(`${novo.nome ?? 'A pessoa'} entrou na equipe. Agora marque abaixo as abas que ela pode editar.`)
    } catch (err) {
      setSemConta(err instanceof ApiError && err.codigo === 'sem_conta')
      setErro(err instanceof Error ? err.message : 'Erro ao adicionar pessoa')
    } finally {
      setEnviando(false)
    }
  }

  async function remover(m: VinculoPagina) {
    if (!confirm(`Remover ${m.nome} da equipe? Ela deixa de poder editar esta página.`)) return
    setErro('')
    setMensagem('')
    try {
      await apiPaginas.removerMembro(paginaId, m.id)
      if (selecionado === m.id) setSelecionado('')
      await carregar()
      setMensagem(`${m.nome} saiu da equipe.`)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao remover')
    }
  }

  async function salvarPermissoes() {
    if (!membro) return
    setSalvando(true)
    setErro('')
    setMensagem('')
    try {
      await apiPaginas.atualizarMembro(paginaId, membro.id, { cargo: cargo.trim() || null, permissoes })
      await carregar()
      setMensagem(`Permissões de ${membro.nome} salvas.`)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar permissões')
    } finally {
      setSalvando(false)
    }
  }

  function alternar(aba: string) {
    setPermissoes((atual) => (atual.includes(aba) ? atual.filter((a) => a !== aba) : [...atual, aba]))
  }

  return (
    <>
      {erro && (
        <Aviso tipo="erro">
          {erro}
          {semConta && (
            <>
              {' '}
              <a href={`${AREA01_URL}/signup`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', fontWeight: 700 }}>
                Link para criar conta: plura.app.br/signup
              </a>
            </>
          )}
        </Aviso>
      )}
      {mensagem && <Aviso tipo="sucesso">{mensagem}</Aviso>}

      <Secao titulo="Equipe" descricao="Pessoas que ajudam a manter esta página. O dono pode tudo; cada colaborador edita só as abas liberadas para ele.">
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {equipe.map((m) => (
            <li key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', padding: '0.75rem 0.875rem', borderRadius: '0.875rem', border: '1px solid var(--c-divider)' }}>
              <div style={{ minWidth: 0, flex: '1 1 220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '0.9375rem' }}>{m.nome}</strong>
                  {m.eh_voce && <span style={etiqueta}>você</span>}
                  <span style={{ ...etiqueta, color: m.papel === 'administrador' ? 'var(--c-accent-text)' : 'var(--c-text-2)', borderColor: m.papel === 'administrador' ? 'var(--c-accent-soft-border)' : 'var(--c-divider)' }}>
                    {m.papel === 'administrador' ? 'Dono' : 'Colaborador'}
                  </span>
                  {m.tipo_conta === 'gov' && <span style={etiqueta}>conta Gov</span>}
                </div>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.8125rem', color: 'var(--c-text-3)', overflowWrap: 'anywhere' }}>
                  {m.cargo ? `${m.cargo} · ` : ''}
                  {m.email}
                  {m.papel === 'colaborador' && ` · ${m.permissoes.length} de ${abas.length || 13} abas`}
                </p>
              </div>
              {m.papel === 'colaborador' && !m.eh_voce && (
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  <button type="button" onClick={() => setSelecionado(m.id)} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.625rem', border: '1px solid var(--c-input-border)', background: 'transparent', color: 'var(--c-text-1)', fontWeight: 600, fontSize: '0.8125rem', fontFamily: 'inherit', cursor: 'pointer' }}>
                    Permissões
                  </button>
                  <button type="button" onClick={() => remover(m)} aria-label={`Remover ${m.nome} da equipe`} style={{ background: 'none', border: '1px solid var(--c-divider)', borderRadius: '0.625rem', padding: '0.4rem', color: 'var(--c-danger-text)', cursor: 'pointer', display: 'flex' }}>
                    <IconTrash size={16} aria-hidden />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>

        <form onSubmit={adicionar} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--c-divider)' }}>
          <Grade>
            <Campo rotulo="Adicionar pessoa pelo e-mail" ajuda={QUEM_PODE_ENTRAR}>
              <Texto valor={email} onChange={setEmail} placeholder="pessoa@exemplo.com" inputMode="email" tipo="email" />
            </Campo>
            <Campo rotulo="Cargo (opcional)" ajuda="Texto livre, aparece só para a equipe. Ex.: Fotógrafo, Recepção.">
              <Texto valor={cargoNovo} onChange={setCargoNovo} placeholder="Ex.: Gerente de marketing" max={80} />
            </Campo>
          </Grade>
          <div>
            <button type="submit" disabled={enviando || !email.trim()} style={{ ...botaoPrimario, opacity: enviando || !email.trim() ? 0.6 : 1 }}>
              <IconUserPlus size={18} aria-hidden /> {enviando ? 'Adicionando…' : 'Adicionar à equipe'}
            </button>
          </div>
        </form>
      </Secao>

      <Secao titulo="Permissões" descricao="Escolha um colaborador e marque as abas do editor que ele pode alterar.">
        {editaveis.length === 0 ? (
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--c-text-2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <IconUsers size={18} aria-hidden /> Ainda não há colaboradores. Adicione alguém pelo e-mail acima.
          </p>
        ) : (
          <>
            <Grade>
              <Campo rotulo="Colaborador">
                <Selecao valor={selecionado} onChange={setSelecionado} vazio="Selecione um colaborador" opcoes={editaveis.map((m) => ({ valor: m.id, rotulo: m.cargo ? `${m.nome} (${m.cargo})` : m.nome }))} />
              </Campo>
              {membro && (
                <Campo rotulo="Cargo">
                  <Texto valor={cargo} onChange={setCargo} placeholder="Ex.: Fotógrafo" max={80} />
                </Campo>
              )}
            </Grade>

            {membro && (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <caption style={{ textAlign: 'left', fontSize: '0.8125rem', color: 'var(--c-text-3)', paddingBottom: '0.5rem' }}>
                      Acesso de {membro.nome} por aba do editor
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col" style={{ textAlign: 'left', padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--c-divider)', fontWeight: 700 }}>Função</th>
                        <th scope="col" style={{ textAlign: 'center', padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--c-divider)', fontWeight: 700, width: '9rem' }}>Tem acesso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {abas.map((a) => {
                        const ativo = permissoes.includes(a.id)
                        return (
                          <tr key={a.id}>
                            <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--c-divider)' }}>
                              <label htmlFor={`perm-${a.id}`} style={{ cursor: 'pointer' }}>{a.rotulo}</label>
                            </td>
                            <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--c-divider)', textAlign: 'center' }}>
                              <input id={`perm-${a.id}`} type="checkbox" checked={ativo} onChange={() => alternar(a.id)} style={{ width: '1.125rem', height: '1.125rem', cursor: 'pointer', accentColor: '#1a7aff' }} />
                              <span style={{ marginLeft: '0.5rem', fontSize: '0.8125rem', color: ativo ? 'var(--c-success-text)' : 'var(--c-text-3)' }}>{ativo ? 'Sim' : 'Não'}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button type="button" onClick={salvarPermissoes} disabled={salvando || !alterado} style={{ ...botaoPrimario, opacity: salvando || !alterado ? 0.6 : 1 }}>
                    <IconCheck size={18} aria-hidden /> {salvando ? 'Salvando…' : 'Salvar permissões'}
                  </button>
                  <button type="button" onClick={() => setPermissoes(abas.map((a) => a.id))} style={{ padding: '0.6rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--c-input-border)', background: 'transparent', color: 'var(--c-text-1)', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                    Marcar todas
                  </button>
                  <button type="button" onClick={() => setPermissoes([])} style={{ padding: '0.6rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--c-input-border)', background: 'transparent', color: 'var(--c-text-1)', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                    Desmarcar todas
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </Secao>

      <Secao titulo="Logs da página" descricao="Histórico das alterações feitas pela equipe (mais recentes primeiro).">
        {logs === null ? (
          <Carregando compacto />
        ) : logs.length === 0 ? (
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--c-text-2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <IconHistory size={18} aria-hidden /> Nenhuma alteração registrada ainda.
          </p>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: '28rem', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  {['Data', 'Pessoa', 'Ação'].map((t) => (
                    <th key={t} scope="col" style={{ textAlign: 'left', padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--c-divider)', fontWeight: 700, position: 'sticky', top: 0, background: 'var(--c-modal-bg)' }}>{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--c-divider)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{dataHora(l.criado_em)}</td>
                    <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--c-divider)' }}>{l.autor_nome ?? 'Conta removida'}</td>
                    <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--c-divider)' }}>{l.acao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Secao>
    </>
  )
}
