'use client'

import { useState } from 'react'
import { AreaTexto, Campo, Grade, Secao, Texto } from './Campos'
import type { PropsAba } from './tipos'

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
      if (!data?.erro) alterar({ cep, endereco: data.logradouro || p.endereco, cidade: data.localidade || p.cidade, uf: data.uf || p.uf })
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
      </Secao>

      <Secao titulo="Como chegar" descricao="Explique o caminho. O visitante precisa saber não só onde fica, mas como chegar com segurança.">
        <Campo rotulo="Como chegar com cadeira de rodas (rota acessível)" ajuda="Diferencial da Plura: descreva o trajeto sem barreiras, entradas acessíveis, desníveis e obstáculos conhecidos.">
          <AreaTexto valor={p.rota_acessivel} onChange={(v) => alterar({ rota_acessivel: v })} max={2000} />
        </Campo>
        <Campo rotulo="De carro" ajuda="Acesso, estacionamento e vagas reservadas.">
          <AreaTexto valor={p.como_chegar_carro} onChange={(v) => alterar({ como_chegar_carro: v })} max={2000} linhas={3} />
        </Campo>
        <Campo rotulo="De transporte público" ajuda="Linhas, pontos de parada e distância a pé.">
          <AreaTexto valor={p.como_chegar_transporte} onChange={(v) => alterar({ como_chegar_transporte: v })} max={2000} linhas={3} />
        </Campo>
      </Secao>
    </>
  )
}
