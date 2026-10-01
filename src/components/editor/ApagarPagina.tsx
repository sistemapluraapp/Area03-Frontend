'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { IconTrash } from '@tabler/icons-react'
import { Aviso, Campo, Secao, Texto } from './Campos'
import { apiPaginas, DIAS_LIXEIRA } from '@/lib/apiPaginas'

// Leva a página para a lixeira: some do público na hora e pode ser
// restaurada em "Minhas páginas" por 30 dias. Só administradores conseguem.
export default function ApagarPagina({ id, nome }: { id: string; nome: string }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [confirmacao, setConfirmacao] = useState('')
  const [apagando, setApagando] = useState(false)
  const [erro, setErro] = useState('')
  const confere = confirmacao.trim().toLocaleLowerCase('pt-BR') === nome.trim().toLocaleLowerCase('pt-BR')

  async function apagar() {
    setErro('')
    setApagando(true)
    try {
      await apiPaginas.excluir(id)
      router.push('/?apagada=1')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível apagar a página')
      setApagando(false)
    }
  }

  const estiloBotao = { display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.6rem 1rem', borderRadius: '0.75rem', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' } as const

  return (
    <Secao
      titulo="Apagar página"
      descricao={`A página sai do ar na hora e vai para a lixeira. Você pode restaurá-la em “Minhas páginas” por ${DIAS_LIXEIRA} dias; depois disso ela é excluída de vez, com fotos, avaliações e experiências.`}
    >
      {!aberto ? (
        <button type="button" onClick={() => setAberto(true)} style={{ ...estiloBotao, alignSelf: 'flex-start', border: '1px solid var(--c-danger-border)', background: 'transparent', color: 'var(--c-danger-text)' }}>
          <IconTrash size={18} aria-hidden /> Apagar esta página
        </button>
      ) : (
        <>
          <Campo rotulo={`Para confirmar, digite o nome da página: ${nome}`}>
            <Texto valor={confirmacao} onChange={setConfirmacao} placeholder={nome} />
          </Campo>
          {erro && <Aviso tipo="erro">{erro}</Aviso>}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" disabled={!confere || apagando} onClick={apagar} style={{ ...estiloBotao, border: 'none', background: 'var(--c-danger-text)', color: '#fff', opacity: !confere || apagando ? 0.5 : 1, cursor: !confere || apagando ? 'not-allowed' : 'pointer' }}>
              <IconTrash size={18} aria-hidden /> {apagando ? 'Apagando…' : 'Apagar página'}
            </button>
            <button type="button" onClick={() => { setAberto(false); setConfirmacao('') }} style={{ ...estiloBotao, border: '1px solid var(--c-input-border)', background: 'transparent', color: 'var(--c-text-1)' }}>
              Cancelar
            </button>
          </div>
        </>
      )}
    </Secao>
  )
}
