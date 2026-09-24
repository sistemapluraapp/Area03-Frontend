'use client'

import { useState } from 'react'
import { IconCamera } from '@tabler/icons-react'
import EnviarImagemModal from '../EnviarImagemModal'
import { AreaTexto, Aviso, Campo, Chip, Grade, Secao, Selecao, Texto } from './Campos'
import { apiPaginas, cnpjValido, formatarCnpj } from '@/lib/apiPaginas'
import type { PropsAba } from './tipos'

const FAIXAS = [
  { valor: 1, rotulo: '$ · Econômico' },
  { valor: 2, rotulo: '$$ · Moderado' },
  { valor: 3, rotulo: '$$$ · Alto' },
  { valor: 4, rotulo: '$$$$ · Premium' },
]

function youtubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1) || null
    if (u.pathname.startsWith('/shorts/') || u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2] || null
    return u.searchParams.get('v')
  } catch {
    return null
  }
}

export default function AbaIdentidade({ rascunho: p, salvo, alterar, aplicarSalvo, opcoes }: PropsAba) {
  const [enviando, setEnviando] = useState<'logo' | 'capa' | null>(null)
  const tags = p.tags ?? []
  const idVideo = p.video_apresentacao ? youtubeId(p.video_apresentacao) : null

  function alternarTag(codigo: string) {
    alterar({ tags: tags.includes(codigo) ? tags.filter((t) => t !== codigo) : [...tags, codigo] })
  }

  return (
    <>
      <Secao titulo="Imagens" descricao="A capa e a logo são as primeiras coisas que o visitante vê. Prefira fotos reais do local.">
        <div style={{ position: 'relative', borderRadius: '1rem', overflow: 'hidden', aspectRatio: '16 / 9', maxHeight: '320px', width: '100%', background: p.capa_url ? `url("${p.capa_url}") center/cover` : 'linear-gradient(135deg,#1a7aff,#0062e6)' }}>
          <button type="button" onClick={() => setEnviando('capa')} style={{ position: 'absolute', right: '0.75rem', bottom: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.35)', background: 'rgba(0,0,0,0.55)', color: '#fff', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}>
            <IconCamera size={16} aria-hidden /> {p.capa_url ? 'Trocar capa' : 'Adicionar capa'}
          </button>
          <button
            type="button"
            onClick={() => setEnviando('logo')}
            aria-label={p.logo_url ? 'Trocar logo' : 'Adicionar logo'}
            style={{ position: 'absolute', left: '1rem', bottom: '1rem', width: '92px', height: '92px', borderRadius: '50%', border: '3px solid #fff', background: p.logo_url ? `url("${p.logo_url}") center/cover` : 'rgba(255,255,255,0.9)', color: '#1a7aff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 6px 20px rgba(0,0,0,0.3)' }}
          >
            {!p.logo_url && <IconCamera size={26} aria-hidden />}
          </button>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--c-text-3)' }}>Capa: 1600 × 900 px (16:9). Logo: 400 × 400 px (aparece em círculo).</p>
      </Secao>

      <Secao titulo="Identidade do empreendimento">
        {!salvo.cnpj ? (
          <Campo rotulo="CNPJ" ajuda="Esta página foi criada antes da exigência do CNPJ. Informe-o para completar o cadastro — depois de salvo, ele não pode ser alterado.">
            <Texto valor={formatarCnpj(p.cnpj ?? '')} onChange={(v) => alterar({ cnpj: formatarCnpj(v) })} placeholder="00.000.000/0000-00" inputMode="numeric" />
          </Campo>
        ) : (
          <p style={{ fontSize: '0.875rem', color: 'var(--c-text-2)' }}>
            CNPJ: <strong style={{ color: 'var(--c-text-1)', fontFamily: 'var(--font-mono)' }}>{formatarCnpj(salvo.cnpj)}</strong>
          </p>
        )}
        {!salvo.cnpj && p.cnpj && p.cnpj.replace(/\D/g, '').length === 14 && !cnpjValido(p.cnpj) && <Aviso tipo="erro">CNPJ inválido. Confira os dígitos.</Aviso>}
        <Grade>
          <Campo rotulo="Nome do empreendimento *" contador={`${p.nome?.length ?? 0}/120`}>
            <Texto valor={p.nome} onChange={(v) => alterar({ nome: v })} max={120} />
          </Campo>
          <Campo rotulo="Subtítulo" ajuda='Aparece abaixo do nome. Ex.: "Restaurante Inclusivo".' contador={`${p.subtitulo?.length ?? 0}/80`}>
            <Texto valor={p.subtitulo} onChange={(v) => alterar({ subtitulo: v })} max={80} placeholder="Restaurante Inclusivo" />
          </Campo>
        </Grade>
        <Grade>
          <Campo rotulo="Categoria">
            <Selecao valor={p.categoria} onChange={(v) => alterar({ categoria: v || null })} vazio="Selecione" opcoes={opcoes.categorias.map((c) => ({ valor: c.codigo, rotulo: c.rotulo }))} />
          </Campo>
          <Campo rotulo="Faixa de preço">
            <Selecao valor={p.faixa_preco} onChange={(v) => alterar({ faixa_preco: v ? Number(v) : null })} vazio="Não informar" opcoes={FAIXAS} />
          </Campo>
        </Grade>
        <Campo rotulo="Slogan" contador={`${p.slogan?.length ?? 0}/140`}>
          <Texto valor={p.slogan} onChange={(v) => alterar({ slogan: v })} max={140} placeholder="Sabores, comunicação e inclusão." />
        </Campo>
        <Campo rotulo="Descrição curta" ajuda="Aparece nos cards da busca. Seja direto: o que é e para quem é." contador={`${p.descricao_curta?.length ?? 0}/200`}>
          <AreaTexto valor={p.descricao_curta} onChange={(v) => alterar({ descricao_curta: v })} max={200} linhas={2} />
        </Campo>
        <Campo rotulo="Descrição completa" ajuda="Aparece em “Sobre o empreendimento”. Separe parágrafos com uma linha em branco e use “- ” no início da linha para listas." contador={`${p.descricao?.length ?? 0}/10000`}>
          <AreaTexto valor={p.descricao} onChange={(v) => alterar({ descricao: v })} max={10000} linhas={8} />
        </Campo>
        <Campo rotulo="Diferencial" ajuda="O que torna a experiência acessível e especial." contador={`${p.diferencial?.length ?? 0}/400`}>
          <AreaTexto valor={p.diferencial} onChange={(v) => alterar({ diferencial: v })} max={400} linhas={3} placeholder="Cardápio em Braille e em Libras, atendimento em Libras e sinalização visual." />
        </Campo>
      </Secao>

      <Secao titulo="Tags" descricao={`Escolha até 10 etiquetas que descrevem o empreendimento (${tags.length}/10).`}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {opcoes.tags.map((t) => (
            <Chip key={t.codigo} ativo={tags.includes(t.codigo)} icone={t.icone} onClick={() => alternarTag(t.codigo)} desativado={!tags.includes(t.codigo) && tags.length >= 10}>
              {t.rotulo}
            </Chip>
          ))}
        </div>
      </Secao>

      <Secao titulo="Vídeo de apresentação" descricao="Cole o link de um vídeo do YouTube. Outros vídeos podem ser adicionados na aba Galeria.">
        <Campo rotulo="Link do YouTube">
          <Texto valor={p.video_apresentacao} onChange={(v) => alterar({ video_apresentacao: v })} placeholder="https://www.youtube.com/watch?v=..." inputMode="url" />
        </Campo>
        {p.video_apresentacao && !idVideo && <Aviso tipo="erro">Não reconhecemos este link como um vídeo do YouTube.</Aviso>}
        {idVideo && (
          <iframe
            title="Pré-visualização do vídeo de apresentação"
            src={`https://www.youtube-nocookie.com/embed/${idVideo}`}
            style={{ width: '100%', aspectRatio: '16 / 9', border: 0, borderRadius: '0.875rem' }}
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </Secao>

      {enviando && (
        <EnviarImagemModal
          tipo={enviando}
          onClose={() => setEnviando(null)}
          onConfirm={async (base64, extensao) => {
            if (enviando === 'logo') {
              const { logo_url } = await apiPaginas.uploadLogo(p.id, base64, extensao)
              aplicarSalvo({ logo_url })
            } else {
              const { capa_url } = await apiPaginas.uploadCapa(p.id, base64, extensao)
              aplicarSalvo({ capa_url })
            }
          }}
        />
      )}
    </>
  )
}
