'use client'

import { IconBrandWhatsapp, IconPlus, IconStarFilled, IconTrash } from '@tabler/icons-react'
import { Aviso, Campo, Grade, Secao, Selecao, Texto } from './Campos'
import { CANAIS_CONTATO, formatarTelefone, type CanalContato, type ContatoPagina } from '@/lib/apiPaginas'
import type { PropsAba } from './tipos'

export function CampoWhatsapp({ valor, onChange }: { valor: string | null; onChange: (v: string) => void }) {
  return (
    <div style={{ padding: '1.125rem', borderRadius: '1rem', border: '2px solid rgba(37,211,102,0.55)', background: 'rgba(37,211,102,0.08)', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#16a34a', fontWeight: 800 }}>
        <IconBrandWhatsapp size={22} aria-hidden /> Contato WhatsApp
      </div>
      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--c-text-2)', lineHeight: 1.55 }}>
        <strong style={{ color: 'var(--c-text-1)' }}>Este é o principal canal entre você e o visitante.</strong> O botão “Entrar em contato” da sua página abre uma
        conversa neste número — é por ele que as pessoas tiram dúvidas sobre acessibilidade, fazem reservas e combinam a visita. Sem ele, o botão não aparece.
      </p>
      <Texto valor={valor ? formatarTelefone(valor) : ''} onChange={(v) => onChange(formatarTelefone(v))} placeholder="(82) 99999-9999" inputMode="tel" tipo="tel" />
    </div>
  )
}

const MAX_CONTATOS = 12

function CanaisContato({ contatos, onChange }: { contatos: ContatoPagina[]; onChange: (c: ContatoPagina[]) => void }) {
  const alterarItem = (i: number, patch: Partial<ContatoPagina>) => onChange(contatos.map((c, j) => (j === i ? { ...c, ...patch } : c)))
  const marcarPreferencial = (i: number) => onChange(contatos.map((c, j) => ({ ...c, preferencial: j === i ? !c.preferencial : false })))
  const adicionar = () =>
    onChange([...contatos, { canal: 'whatsapp', titulo: '', descricao: null, link: '', preferencial: contatos.length === 0 }])

  return (
    <Secao
      titulo="Canais de contato"
      descricao="Cadastre como o visitante pode falar com você. Marque com a estrela o canal de sua preferência: ele aparece em destaque na página."
    >
      {contatos.length === 0 && <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--c-text-3)' }}>Nenhum canal cadastrado.</p>}
      {contatos.map((c, i) => {
        const exemplo = CANAIS_CONTATO.find((o) => o.valor === c.canal)?.exemplo ?? ''
        return (
          <div
            key={i}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', borderRadius: '1rem', border: c.preferencial ? '2px solid var(--c-input-focus-border)' : 'var(--c-border)', background: c.preferencial ? 'var(--c-accent-soft)' : 'transparent' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => marcarPreferencial(i)}
                aria-pressed={c.preferencial}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', borderRadius: '9999px', border: '1px solid var(--c-input-border)', background: c.preferencial ? 'var(--c-input-focus-border)' : 'transparent', color: c.preferencial ? '#fff' : 'var(--c-text-2)', fontWeight: 600, fontSize: '0.8125rem', fontFamily: 'inherit', cursor: 'pointer' }}
              >
                <IconStarFilled size={14} aria-hidden /> {c.preferencial ? 'Canal preferencial' : 'Marcar como preferencial'}
              </button>
              <button
                type="button"
                onClick={() => onChange(contatos.filter((_, j) => j !== i))}
                aria-label={`Remover o canal ${c.titulo || i + 1}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.625rem', borderRadius: '0.5rem', border: 'none', background: 'transparent', color: 'var(--c-danger-text)', fontWeight: 600, fontSize: '0.8125rem', fontFamily: 'inherit', cursor: 'pointer' }}
              >
                <IconTrash size={16} aria-hidden /> Remover
              </button>
            </div>
            <Grade>
              <Campo rotulo="Tipo de canal">
                <Selecao valor={c.canal} onChange={(v) => alterarItem(i, { canal: v as CanalContato })} opcoes={CANAIS_CONTATO.map((o) => ({ valor: o.valor, rotulo: o.rotulo }))} />
              </Campo>
              <Campo rotulo="Título *">
                <Texto valor={c.titulo} onChange={(v) => alterarItem(i, { titulo: v })} max={80} placeholder="Ex.: Reservas e dúvidas" />
              </Campo>
            </Grade>
            <Campo rotulo="Descrição" ajuda="Opcional. Ex.: horário de atendimento, para que serve este canal.">
              <Texto valor={c.descricao} onChange={(v) => alterarItem(i, { descricao: v })} max={300} placeholder="Atendimento de segunda a sexta, das 9h às 18h" />
            </Campo>
            <Campo rotulo="Link de acesso" ajuda="Pode digitar só o número, e-mail ou @ — o link é montado automaticamente.">
              <Texto valor={c.link} onChange={(v) => alterarItem(i, { link: v })} max={300} placeholder={exemplo} />
            </Campo>
          </div>
        )
      })}
      {contatos.length < MAX_CONTATOS && (
        <button
          type="button"
          onClick={adicionar}
          style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.55rem 1rem', borderRadius: '0.75rem', border: '1px dashed var(--c-input-border)', background: 'transparent', color: 'var(--c-text-1)', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
        >
          <IconPlus size={16} aria-hidden /> Adicionar canal
        </button>
      )}
    </Secao>
  )
}

export default function AbaContato({ rascunho: p, alterar }: PropsAba) {
  return (
    <>
      <Secao titulo="Contato e redes" descricao="Os canais aparecem como botões e ícones clicáveis na página.">
        <CampoWhatsapp valor={p.whatsapp} onChange={(v) => alterar({ whatsapp: v })} />
        {!p.whatsapp && <Aviso>Sem WhatsApp, a sua página não mostra o botão “Entrar em contato”.</Aviso>}
        <Grade>
          <Campo rotulo="Instagram" ajuda="Informe o @ do perfil.">
            <Texto valor={p.instagram} onChange={(v) => alterar({ instagram: v })} placeholder="@sinaisdomar" />
          </Campo>
          <Campo rotulo="Site próprio">
            <Texto valor={p.website} onChange={(v) => alterar({ website: v })} placeholder="https://www.seusite.com.br" inputMode="url" />
          </Campo>
        </Grade>
      </Secao>
      <CanaisContato contatos={p.contatos ?? []} onChange={(contatos) => alterar({ contatos })} />
    </>
  )
}
