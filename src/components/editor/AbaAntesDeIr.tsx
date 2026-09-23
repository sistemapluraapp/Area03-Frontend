'use client'

import { AreaTexto, Campo, Chip, Secao } from './Campos'
import { CAMPOS_SEGURANCA, type CampoSeguranca } from '@/lib/apiPaginas'
import type { PropsAba } from './tipos'

const ROTULOS_SEGURANCA: Record<CampoSeguranca, { rotulo: string; ajuda: string }> = {
  informacoes: { rotulo: 'Informações de segurança', ajuda: 'Orientações gerais apresentadas antes da atividade.' },
  requisitos: { rotulo: 'Requisitos da atividade', ajuda: 'Requisitos médicos ou físicos, quando pertinentes.' },
  equipamentos: { rotulo: 'Equipamentos disponíveis', ajuda: 'Coletes, cadeiras anfíbias, equipamentos adaptados…' },
  profissionais: { rotulo: 'Profissionais responsáveis', ajuda: 'Guias, instrutores, salva-vidas e suas qualificações.' },
  procedimentos: { rotulo: 'Procedimentos de emergência', ajuda: 'O que acontece se algo der errado.' },
  contatos_emergencia: { rotulo: 'Contatos de emergência', ajuda: 'Telefones úteis (ex.: SAMU 192, Bombeiros 193).' },
}

export default function AbaAntesDeIr({ rascunho: p, alterar, opcoes }: PropsAba) {
  const marcados = p.antes_de_ir ?? []
  const seguranca = p.seguranca ?? {}

  return (
    <>
      <Secao titulo="Antes de ir" descricao="Checklist exibido na página para reduzir imprevistos. Marque o que vale para o seu empreendimento.">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {opcoes.antes_de_ir.map((item) => (
            <Chip
              key={item.codigo}
              ativo={marcados.includes(item.codigo)}
              icone={item.icone}
              onClick={() => alterar({ antes_de_ir: marcados.includes(item.codigo) ? marcados.filter((m) => m !== item.codigo) : [...marcados, item.codigo] })}
            >
              {item.rotulo}
            </Chip>
          ))}
        </div>
        <Campo rotulo="Outras orientações" ajuda="Uma orientação por linha.">
          <AreaTexto valor={p.antes_de_ir_observacoes} onChange={(v) => alterar({ antes_de_ir_observacoes: v })} max={1000} linhas={3} placeholder="Recomenda-se reserva em horários de maior movimento" />
        </Campo>
      </Secao>

      <Secao titulo="Segurança" descricao="Recomendado para passeios e atividades. Só os campos preenchidos aparecem na página.">
        {CAMPOS_SEGURANCA.map((campo) => (
          <Campo key={campo} rotulo={ROTULOS_SEGURANCA[campo].rotulo} ajuda={ROTULOS_SEGURANCA[campo].ajuda}>
            <AreaTexto valor={seguranca[campo] ?? ''} onChange={(v) => alterar({ seguranca: { ...seguranca, [campo]: v } })} max={2000} linhas={2} />
          </Campo>
        ))}
      </Secao>
    </>
  )
}
