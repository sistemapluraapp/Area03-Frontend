'use client'

import { useState } from 'react'
import { Aviso, Campo, Grade, Secao, Texto } from './Campos'
import type { PropsAba } from './tipos'
import EditorRico from '../EditorRico'

function formatarCep(valor: string) {
  const d = valor.replace(/\D/g, '').slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

export default function AbaLocalizacao({ rascunho: p, alterar }: PropsAba) {
  const [buscandoCep, setBuscandoCep] = useState(false)

  async function aoMudarCep(valor: string) {
    const cep = formatarCep(valor)
    alterar({ cep })
    const digitos = cep.replace(/\D/g, '')
    if (digitos.length !== 8) return
    setBuscandoCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digitos}/json/`)
      const data = await res.json()
      if (!data?.erro) alterar({ cep, endereco: data.logradouro || p.endereco, complemento: p.complemento || data.bairro || null, cidade: data.localidade || p.cidade, uf: data.uf || p.uf })
    } catch {
      // a busca de CEP só ajuda no preenchimento; o usuário pode digitar manualmente
    } finally {
      setBuscandoCep(false)
    }
  }

  return (
    <>
      <Secao titulo="Endereço" descricao="Usado no mapa “Como chegar” e para calcular a distância até o visitante.">
        <Grade colunas={3}>
          <Campo rotulo="CEP" ajuda={buscandoCep ? 'Buscando endereço…' : undefined}>
            <Texto valor={p.cep} onChange={aoMudarCep} placeholder="00000-000" inputMode="numeric" />
          </Campo>
          <Campo rotulo="Cidade">
            <Texto valor={p.cidade} onChange={(v) => alterar({ cidade: v })} />
          </Campo>
          <Campo rotulo="UF">
            <Texto valor={p.uf} onChange={(v) => alterar({ uf: v.toUpperCase().slice(0, 2) })} max={2} />
          </Campo>
        </Grade>
        <Grade>
          <Campo rotulo="Endereço (rua e número)">
            <Texto valor={p.endereco} onChange={(v) => alterar({ endereco: v })} placeholder="Av. Beira Mar, 1234" />
          </Campo>
          <Campo rotulo="Complemento / bairro">
            <Texto valor={p.complemento} onChange={(v) => alterar({ complemento: v })} placeholder="Pajuçara" />
          </Campo>
        </Grade>
        <Campo rotulo="Ponto de referência">
          <Texto valor={p.ponto_referencia} onChange={(v) => alterar({ ponto_referencia: v })} placeholder="Em frente ao posto de salva-vidas 3" />
        </Campo>
        <Campo
          rotulo="Link do Google Maps (opcional)"
          ajuda="No Google Maps, abra o seu local, toque em “Compartilhar” e copie o link. O botão “Como chegar” da página passa a abrir exatamente esse ponto."
        >
          <Texto valor={p.mapa_link} onChange={(v) => alterar({ mapa_link: v })} placeholder="https://maps.app.goo.gl/…" inputMode="url" max={500} />
        </Campo>
        {p.mapa_link && !/^(https?:\/\/)?((www\.)?google\.[a-z.]+\/maps|maps\.google\.|maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(p.mapa_link.trim()) && (
          <Aviso>Este link não parece ser do Google Maps. Confira se ele abre o local certo.</Aviso>
        )}
        <Campo grupo rotulo="Comentários sobre a localização (opcional)" ajuda="Ex.: entrada pelo estacionamento lateral, portão azul, melhor acesso pela rua de trás.">
          <EditorRico rotulo="Comentários sobre a localização" valor={p.localizacao_comentarios} onChange={(v) => alterar({ localizacao_comentarios: v })} max={2000} linhas={3} />
        </Campo>
      </Secao>

      <Secao titulo="Como chegar" descricao="Explique o caminho. O visitante precisa saber não só onde fica, mas como chegar com segurança.">
        <Campo grupo rotulo="Como chegar com cadeira de rodas (rota acessível)" ajuda="Diferencial da Plura: descreva o trajeto sem barreiras, entradas acessíveis, desníveis e obstáculos conhecidos.">
          <EditorRico rotulo="Como chegar com cadeira de rodas" valor={p.rota_acessivel} onChange={(v) => alterar({ rota_acessivel: v })} max={2000} />
        </Campo>
        <Campo grupo rotulo="De carro" ajuda="Acesso, estacionamento e vagas reservadas.">
          <EditorRico rotulo="Como chegar de carro" valor={p.como_chegar_carro} onChange={(v) => alterar({ como_chegar_carro: v })} max={2000} linhas={3} />
        </Campo>
        <Campo grupo rotulo="De transporte público" ajuda="Linhas, pontos de parada e distância a pé.">
          <EditorRico rotulo="Como chegar de transporte público" valor={p.como_chegar_transporte} onChange={(v) => alterar({ como_chegar_transporte: v })} max={2000} linhas={3} />
        </Campo>
      </Secao>
    </>
  )
}
