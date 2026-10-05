import type { TipoCampo, TipoRequisito } from './apiCertificacoes'

export const ROTULO_TIPO_REQUISITO: Record<TipoRequisito, string> = {
  arquivo: 'Envio de arquivo',
  texto: 'Resposta em texto',
  formulario: 'Formulário',
  link: 'Link',
  video: 'Vídeo',
  vistoria: 'Agendamento de vistoria',
}

export const ROTULO_TIPO_CAMPO: Record<TipoCampo, string> = {
  texto_curto: 'Resposta curta',
  texto_longo: 'Resposta longa',
  numero: 'Número',
  data: 'Data',
  sim_nao: 'Sim ou não',
  opcoes: 'Escolha entre opções',
}
