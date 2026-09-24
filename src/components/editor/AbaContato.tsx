'use client'

import { IconBrandWhatsapp } from '@tabler/icons-react'
import { Aviso, Campo, Grade, Secao, Texto } from './Campos'
import { formatarTelefone } from '@/lib/apiPaginas'
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

export default function AbaContato({ rascunho: p, alterar }: PropsAba) {
  return (
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
  )
}
