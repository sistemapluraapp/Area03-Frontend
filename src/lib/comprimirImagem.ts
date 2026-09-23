const TIPO_PARA_EXTENSAO: Record<string, string> = {
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

function arquivoParaBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const resultado = reader.result as string
      resolve(resultado.split(',')[1] ?? '')
    }
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo'))
    reader.readAsDataURL(blob)
  })
}

export async function comprimirImagem(
  file: File,
  maxDim = 1280,
  qualidade = 0.75
): Promise<{ base64: string; extensao: string }> {
  // Arquivos já pequenos: evita o custo de recomprimir, apenas converte para base64.
  if (file.size < 150 * 1024) {
    const extensao = TIPO_PARA_EXTENSAO[file.type] ?? 'jpeg'
    const base64 = await arquivoParaBase64(file)
    verificarTamanho(base64)
    return { base64, extensao }
  }

  try {
    const bitmap = await createImageBitmap(file)
    const escala = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
    const largura = Math.round(bitmap.width * escala)
    const altura = Math.round(bitmap.height * escala)

    const canvas = document.createElement('canvas')
    canvas.width = largura
    canvas.height = altura
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Não foi possível processar a imagem')
    ctx.drawImage(bitmap, 0, 0, largura, altura)

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', qualidade))
    if (!blob) throw new Error('Não foi possível comprimir a imagem')

    const base64 = await arquivoParaBase64(blob)
    verificarTamanho(base64)
    return { base64, extensao: 'jpeg' }
  } catch {
    // Ambiente sem suporte a createImageBitmap/canvas: usa o arquivo original.
    const extensao = TIPO_PARA_EXTENSAO[file.type] ?? 'jpeg'
    const base64 = await arquivoParaBase64(file)
    verificarTamanho(base64)
    return { base64, extensao }
  }
}

function verificarTamanho(base64: string): void {
  const tamanhoBytes = (base64.length * 3) / 4
  if (tamanhoBytes > 5 * 1024 * 1024) {
    throw new Error('A imagem é muito grande mesmo após compressão. Escolha uma imagem menor.')
  }
}
