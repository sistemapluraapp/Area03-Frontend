'use client'

import { IconStar, IconStarFilled } from '@tabler/icons-react'
import Icone from '../Icone'
import { Aviso, Secao } from './Campos'
import type { PropsAba } from './tipos'

// Recursos marcados por grupo. O nível de cada grupo (x/5) mostrado na
// página pública é calculado pela proporção de recursos marcados no grupo.
export function nivelDoGrupo(marcados: number, total: number): number {
  if (total === 0 || marcados === 0) return 0
  return Math.max(1, Math.round((marcados / total) * 5))
}

export default function AbaAcessibilidade({ rascunho: p, alterar, opcoes }: PropsAba) {
  const recursos = p.recursos_acessibilidade ?? []
  const destaques = p.destaques_acessibilidade ?? []
  const observacoes = p.observacoes_recursos ?? {}

  function alternarRecurso(codigo: string) {
    if (recursos.includes(codigo)) {
      const { [codigo]: _, ...restoObs } = observacoes
      alterar({
        recursos_acessibilidade: recursos.filter((r) => r !== codigo),
        destaques_acessibilidade: destaques.filter((d) => d !== codigo),
        observacoes_recursos: restoObs,
      })
    } else {
      alterar({ recursos_acessibilidade: [...recursos, codigo] })
    }
  }

  function alternarDestaque(codigo: string) {
    if (destaques.includes(codigo)) alterar({ destaques_acessibilidade: destaques.filter((d) => d !== codigo) })
    else if (destaques.length < 4) alterar({ destaques_acessibilidade: [...destaques, codigo] })
  }

  return (
    <>
      <Aviso>
        Marque só o que o local realmente tem. Use a observação para explicar <strong>como</strong> é o recurso (ex.: “rampa na entrada lateral, com corrimão”).
        Clique na estrela para destacar até <strong>4 recursos</strong>, que aparecem como ícones logo no topo da sua página ({destaques.length}/4).
      </Aviso>

      {opcoes.grupos_acessibilidade.map((g) => {
        const marcados = g.recursos.filter((r) => recursos.includes(r.codigo)).length
        const nivel = nivelDoGrupo(marcados, g.recursos.length)
        return (
          <Secao
            key={g.codigo}
            titulo={g.rotulo}
            descricao={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {g.descricao}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--c-accent-text)' }}>
                  nível {nivel}/5 · {marcados} de {g.recursos.length}
                </span>
              </span>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {g.recursos.map((r) => {
                const marcado = recursos.includes(r.codigo)
                const destacado = destaques.includes(r.codigo)
                return (
                  <div key={r.codigo} style={{ borderRadius: '0.875rem', border: marcado ? '1px solid var(--c-accent-soft-border)' : '1px solid var(--c-divider)', background: marcado ? 'var(--c-accent-soft)' : 'transparent', padding: '0.625rem 0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, cursor: 'pointer', minWidth: 0 }}>
                        <input type="checkbox" checked={marcado} onChange={() => alternarRecurso(r.codigo)} style={{ width: '1.125rem', height: '1.125rem', accentColor: '#1a7aff', flexShrink: 0 }} />
                        <span style={{ color: marcado ? 'var(--c-accent-text)' : 'var(--c-text-2)', display: 'flex' }}>
                          <Icone nome={r.icone} size={20} />
                        </span>
                        <span style={{ fontSize: '0.9375rem', fontWeight: marcado ? 600 : 500 }}>{r.rotulo}</span>
                      </label>
                      {marcado && (
                        <button
                          type="button"
                          onClick={() => alternarDestaque(r.codigo)}
                          disabled={!destacado && destaques.length >= 4}
                          aria-pressed={destacado}
                          title={destacado ? 'Remover dos destaques' : destaques.length >= 4 ? 'Você já escolheu 4 destaques' : 'Destacar no topo da página'}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: destacado ? '#f59e0b' : 'var(--c-text-3)', display: 'flex', opacity: !destacado && destaques.length >= 4 ? 0.4 : 1 }}
                        >
                          {destacado ? <IconStarFilled size={20} /> : <IconStar size={20} />}
                        </button>
                      )}
                    </div>
                    {marcado && (
                      <input
                        value={observacoes[r.codigo] ?? ''}
                        maxLength={300}
                        onChange={(e) => alterar({ observacoes_recursos: { ...observacoes, [r.codigo]: e.target.value } })}
                        placeholder="Observação (opcional): como é esse recurso no local?"
                        aria-label={`Observação sobre ${r.rotulo}`}
                        style={{ marginTop: '0.5rem', width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.625rem', border: '1px solid var(--c-input-border)', background: 'var(--c-input-bg)', color: 'var(--c-input-text)', fontSize: '0.875rem', fontFamily: 'inherit' }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </Secao>
        )
      })}
    </>
  )
}
