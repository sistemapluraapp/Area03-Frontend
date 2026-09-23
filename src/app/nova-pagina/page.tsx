'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { IconArrowLeft } from '@tabler/icons-react'
import Grain from '@/components/Grain'
import Footer from '@/components/Footer'
import Header from '@/components/GovHeader'
import { AreaTexto, Aviso, Campo, Grade, Secao, Selecao, Texto } from '@/components/editor/Campos'
import { CampoWhatsapp } from '@/components/editor/AbaContato'
import { apiPaginas, cnpjValido, formatarCnpj, type OpcaoCatalogo } from '@/lib/apiPaginas'
import { estaLogado } from '@/lib/auth'

export default function NovaPaginaPage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [categoria, setCategoria] = useState('')
  const [descricaoCurta, setDescricaoCurta] = useState('')
  const [categorias, setCategorias] = useState<OpcaoCatalogo[]>([])
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

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
      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '1.75rem 1.25rem 3rem', position: 'relative', zIndex: 1 }}>
        <button type="button" onClick={() => router.push('/')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.45rem 0.875rem', borderRadius: '9999px', border: '1px solid var(--c-input-border)', background: 'var(--c-glass-bg-sm)', color: 'var(--c-text-1)', fontWeight: 600, fontSize: '0.8125rem', fontFamily: 'inherit', cursor: 'pointer', marginBottom: '1.25rem' }}>
          <IconArrowLeft size={16} /> Minhas páginas
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
