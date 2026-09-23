'use client'

import { IconPlus, IconTrash } from '@tabler/icons-react'
import { Campo, Grade, Interruptor, Secao, Texto, AreaTexto } from './Campos'
import type { DiaSemana, Horarios, Turno } from '@/lib/apiPaginas'
import type { PropsAba } from './tipos'

export const DIAS: { codigo: DiaSemana; rotulo: string }[] = [
  { codigo: 'seg', rotulo: 'Segunda' },
  { codigo: 'ter', rotulo: 'Terça' },
  { codigo: 'qua', rotulo: 'Quarta' },
  { codigo: 'qui', rotulo: 'Quinta' },
  { codigo: 'sex', rotulo: 'Sexta' },
  { codigo: 'sab', rotulo: 'Sábado' },
  { codigo: 'dom', rotulo: 'Domingo' },
]

const campoHora = {
  padding: '0.45rem 0.5rem',
  borderRadius: '0.5rem',
  border: '1px solid var(--c-input-border)',
  background: 'var(--c-input-bg)',
  color: 'var(--c-input-text)',
  fontFamily: 'inherit',
  fontSize: '0.875rem',
} as const

export default function AbaHorarios({ rascunho: p, alterar }: PropsAba) {
  const horarios: Horarios = p.horarios ?? {}

  function definirDia(dia: DiaSemana, turnos: Turno[]) {
    alterar({ horarios: { ...horarios, [dia]: turnos } })
  }

  function copiarParaDiasUteis() {
    const seg = horarios.seg ?? []
    alterar({ horarios: { ...horarios, ter: seg, qua: seg, qui: seg, sex: seg } })
  }

  return (
    <>
      <Secao titulo="Horário de funcionamento" descricao="Até 2 turnos por dia. Dias sem turno aparecem como fechados. O selo “Aberto agora” é calculado a partir desta tabela.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {DIAS.map(({ codigo, rotulo }) => {
            const turnos = horarios[codigo] ?? []
            const aberto = turnos.length > 0
            return (
              <div key={codigo} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', padding: '0.625rem 0.75rem', borderRadius: '0.75rem', border: '1px solid var(--c-divider)' }}>
                <span style={{ width: '5.5rem', fontWeight: 600 }}>{rotulo}</span>
                <Interruptor ativo={aberto} onChange={(v) => definirDia(codigo, v ? [{ abre: '09:00', fecha: '18:00' }] : [])} rotulo={aberto ? 'Aberto' : 'Fechado'} />
                {turnos.map((t, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                    <input type="time" value={t.abre} aria-label={`${rotulo}: abre`} onChange={(e) => definirDia(codigo, turnos.map((x, j) => (j === i ? { ...x, abre: e.target.value } : x)))} style={campoHora} />
                    <span style={{ color: 'var(--c-text-3)' }}>às</span>
                    <input type="time" value={t.fecha} aria-label={`${rotulo}: fecha`} onChange={(e) => definirDia(codigo, turnos.map((x, j) => (j === i ? { ...x, fecha: e.target.value } : x)))} style={campoHora} />
                    {i === 1 && (
                      <button type="button" aria-label="Remover segundo turno" onClick={() => definirDia(codigo, turnos.slice(0, 1))} style={{ background: 'none', border: 'none', color: 'var(--c-danger-text)', cursor: 'pointer', display: 'flex' }}>
                        <IconTrash size={16} />
                      </button>
                    )}
                  </span>
                ))}
                {aberto && turnos.length < 2 && (
                  <button type="button" onClick={() => definirDia(codigo, [...turnos, { abre: '18:00', fecha: '22:00' }])} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: '1px dashed var(--c-input-border)', borderRadius: '0.5rem', padding: '0.35rem 0.625rem', color: 'var(--c-text-2)', fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <IconPlus size={14} /> 2º turno
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <button type="button" onClick={copiarParaDiasUteis} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--c-accent-text)', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem' }}>
          Copiar horário de segunda para terça a sexta
        </button>
      </Secao>

      <Secao titulo="Informações de funcionamento">
        <Interruptor ativo={p.requer_agendamento} onChange={(v) => alterar({ requer_agendamento: v })} rotulo="É necessário agendar a visita" />
        <Grade>
          <Campo rotulo="Tempo médio da experiência">
            <Texto valor={p.tempo_medio} onChange={(v) => alterar({ tempo_medio: v })} placeholder="2 horas" max={80} />
          </Campo>
          <Campo rotulo="Antecedência recomendada">
            <Texto valor={p.antecedencia} onChange={(v) => alterar({ antecedencia: v })} placeholder="Reservar com 2 dias de antecedência" max={80} />
          </Campo>
        </Grade>
        <Campo rotulo="Feriados e datas especiais">
          <AreaTexto valor={p.feriados} onChange={(v) => alterar({ feriados: v })} placeholder="Feriados: funciona normalmente. Fechado em 25/12 e 01/01." linhas={3} max={1000} />
        </Campo>
      </Secao>
    </>
  )
}
