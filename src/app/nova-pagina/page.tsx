'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { IconArrowLeft } from '@tabler/icons-react'
import Grain from '@/components/Grain'
import Footer from '@/components/Footer'
import Header from '@/components/GovHeader'
import { AreaTexto, Aviso, Campo, Grade, Secao, Selecao, Texto } from '@/components/editor/Campos'
import { CampoWhatsapp } from '@/components/editor/AbaContato'
import { apiPaginas, cnpjValido, consultarCnpj, formatarCnpj, formatarTelefone, type DadosCnpj, type OpcaoCatalogo } from '@/lib/apiPaginas'
import { estaLogado } from '@/lib/auth'
import { useTituloPagina } from '@/lib/useTituloPagina'

export default function NovaPaginaPage() {
  useTituloPagina('Nova página institucional')
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [categoria, setCategoria] = useState('')
  const [descricaoCurta, setDescricaoCurta] = useState('')
  const [categorias, setCategorias] = useState<OpcaoCatalogo[]>([])
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [dadosCnpj, setDadosCnpj] = useState<DadosCnpj | null>(null)
  const [consultaCnpj, setConsultaCnpj] = useState<'' | 'buscando' | 'nao_encontrado' | 'falhou'>('')

  useEffect(() => {
    if (!estaLogado()) {
      router.replace('/login?destino=/nova-pagina')
      return
    }
    apiPaginas
      .opcoes()
      .then((o) => setCategorias(o.categorias))
      .catch(() => {})
  }, [router])

  const cnpjCompleto = cnpj.replace(/\D/g, '').length === 14
  const cnpjOk = cnpjCompleto && cnpjValido(cnpj)

  // Com o CNPJ válido, busca os dados públicos na Receita e preenche o que estiver vazio
  useEffect(() => {
    setDadosCnpj(null)
    setConsultaCnpj('')
    if (!cnpjOk) return
    let ativo = true
    setConsultaCnpj('buscando')
    consultarCnpj(cnpj)
      .then((dados) => {
        if (!ativo) return
        if (!dados) return setConsultaCnpj('nao_encontrado')
        setDadosCnpj(dados)
        setConsultaCnpj('')
        setNome((atual) => atual || dados.nome_fantasia || dados.razao_social)
        if (dados.telefone?.length === 11) setWhatsapp((atual) => atual || formatarTelefone(dados.telefone as string))
      })
      .catch(() => ativo && setConsultaCnpj('falhou'))
    return () => {
      ativo = false
    }
  }, [cnpj, cnpjOk])

  async function criar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    if (!nome.trim()) return setErro('Informe o nome do empreendimento.')
    if (!cnpjOk) return setErro('Informe um CNPJ válido.')
    setSalvando(true)
    try {
      const pagina = await apiPaginas.criar({
        nome: nome.trim(),
        cnpj,
        whatsapp: whatsapp || undefined,
        categoria: categoria || undefined,
        descricao_curta: descricaoCurta.trim() || undefined,
        // Endereço vindo do CNPJ: já deixa o mapa pronto (editável depois)
        cep: dadosCnpj?.cep ?? undefined,
        endereco: dadosCnpj?.endereco ?? undefined,
        complemento: dadosCnpj?.bairro ?? undefined,
        cidade: dadosCnpj?.cidade ?? undefined,
        uf: dadosCnpj?.uf ?? undefined,
      })
      router.push(`/pagina?id=${pagina.id}&aba=identidade`)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao criar a página')
      setSalvando(false)
    }
  }

  return (
    <>
      <Grain />
      <Header />
      <main id="conteudo" tabIndex={-1} style={{ maxWidth: '720px', margin: '0 auto', padding: '1.75rem 1.25rem 3rem', position: 'relative', zIndex: 1 }}>
        <button type="button" onClick={() => router.push('/')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.45rem 0.875rem', borderRadius: '9999px', border: '1px solid var(--c-input-border)', background: 'var(--c-glass-bg-sm)', color: 'var(--c-text-1)', fontWeight: 600, fontSize: '0.8125rem', fontFamily: 'inherit', cursor: 'pointer', marginBottom: '1.25rem' }}>
          <IconArrowLeft size={16} aria-hidden /> Minhas páginas
        </button>
        <form onSubmit={criar} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Secao titulo="Nova página institucional" descricao="Comece pelo essencial. Depois você completa acessibilidade, fotos, horários e experiências no editor.">
            <Campo rotulo="Nome do atrativo, programa ou órgão *">
              <Texto valor={nome} onChange={setNome} max={120} placeholder="Praia Acessível de Pajuçara" />
            </Campo>
            <Campo rotulo="CNPJ *" ajuda={cnpjCompleto && !cnpjOk ? undefined : 'Cada CNPJ só pode ter uma página na Plura. Ele não pode ser alterado depois.'}>
              <Texto valor={cnpj} onChange={(v) => setCnpj(formatarCnpj(v))} placeholder="00.000.000/0000-00" inputMode="numeric" />
            </Campo>
            {cnpjCompleto && !cnpjOk && <Aviso tipo="erro">CNPJ inválido. Confira os dígitos.</Aviso>}
            {consultaCnpj === 'buscando' && <Aviso>Buscando os dados do CNPJ na Receita Federal…</Aviso>}
            {consultaCnpj === 'nao_encontrado' && <Aviso tipo="erro">CNPJ não encontrado na Receita Federal. Confira o número.</Aviso>}
            {consultaCnpj === 'falhou' && <Aviso>Não foi possível consultar o CNPJ agora. Você pode preencher os dados manualmente.</Aviso>}
            {dadosCnpj && (
              <Aviso tipo={dadosCnpj.situacao && dadosCnpj.situacao.toUpperCase() !== 'ATIVA' ? 'erro' : 'sucesso'}>
                <strong>{dadosCnpj.razao_social}</strong>
                {dadosCnpj.situacao && <> · Situação: {dadosCnpj.situacao}</>}
                {(dadosCnpj.endereco || dadosCnpj.cidade) && (
                  <>
                    <br />
                    {[dadosCnpj.endereco, dadosCnpj.bairro, [dadosCnpj.cidade, dadosCnpj.uf].filter(Boolean).join(' - ')].filter(Boolean).join(' · ')}
                  </>
                )}
                <br />
                Nome e endereço foram preenchidos com os dados da Receita. Você pode ajustar tudo no editor.
              </Aviso>
            )}
            <Grade>
              <Campo rotulo="Categoria">
                <Selecao valor={categoria} onChange={setCategoria} vazio="Selecione" opcoes={categorias.map((c) => ({ valor: c.codigo, rotulo: c.rotulo }))} />
              </Campo>
            </Grade>
            <Campo rotulo="Descrição curta" ajuda="Aparece nos cards da busca." contador={`${descricaoCurta.length}/200`}>
              <AreaTexto valor={descricaoCurta} onChange={setDescricaoCurta} max={200} linhas={2} />
            </Campo>
          </Secao>

          <CampoWhatsapp valor={whatsapp} onChange={setWhatsapp} />

          {erro && <Aviso tipo="erro">{erro}</Aviso>}
          <button type="submit" disabled={salvando} style={{ alignSelf: 'flex-end', padding: '0.75rem 1.5rem', borderRadius: '0.875rem', border: 'none', background: 'linear-gradient(135deg,#1a7aff,#0062e6)', color: '#fff', fontWeight: 700, fontSize: '1rem', fontFamily: 'inherit', cursor: 'pointer', opacity: salvando ? 0.7 : 1 }}>
            {salvando ? 'Criando…' : 'Criar página e continuar'}
          </button>
        </form>
      </main>
      <Footer />
    </>
  )
}
