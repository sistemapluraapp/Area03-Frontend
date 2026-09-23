import type { CamposEditaveis, Opcoes, PaginaDetalhe } from '@/lib/apiPaginas'

export interface PropsAba {
  // Rascunho com as alterações ainda não salvas
  rascunho: PaginaDetalhe
  // Última versão salva no servidor
  salvo: PaginaDetalhe
  // Altera campos do rascunho (salvos pelo botão "Salvar alterações")
  alterar: (patch: CamposEditaveis) => void
  // Aplica algo que já foi salvo no servidor (uploads, galeria, experiências)
  aplicarSalvo: (patch: Partial<PaginaDetalhe>) => void
  opcoes: Opcoes
}
