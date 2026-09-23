// Caminho interno para onde voltar depois do login/passagem de sessão.
// Só aceita caminhos relativos deste site (evita redirecionamento aberto).
export function destinoSeguro(valor: string | null | undefined, padrao = '/'): string {
  if (!valor || !valor.startsWith('/') || valor.startsWith('//') || valor.startsWith('/\\')) return padrao
  return valor
}
