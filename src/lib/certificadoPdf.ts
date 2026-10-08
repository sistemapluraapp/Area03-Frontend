// Etapa 8e: certificado em PDF (gerado no navegador) com código e QR code de verificação

export interface DadosCertificado {
  codigo: string
  certificacao: string
  pagina: string
  local: string
  concedidaEm: string
  expiraEm: string | null
}

const URL_VERIFICAR = 'https://plura.app.br/verificar'

function data(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export async function baixarCertificadoPdf(d: DadosCertificado) {
  const [{ jsPDF }, QRCode] = await Promise.all([import('jspdf'), import('qrcode')])
  const link = `${URL_VERIFICAR}?codigo=${encodeURIComponent(d.codigo)}`
  const qr = await QRCode.toDataURL(link, { margin: 1, width: 360, errorCorrectionLevel: 'M' })

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  pdf.setProperties({ title: `Certificado ${d.certificacao} - ${d.pagina}`, subject: d.codigo, author: 'Plura', creator: 'Plura' })
  const L = 297
  const A = 210
  const azul: [number, number, number] = [0, 98, 230]
  const cinza: [number, number, number] = [90, 98, 110]

  // Moldura
  pdf.setDrawColor(...azul)
  pdf.setLineWidth(1.6)
  pdf.rect(10, 10, L - 20, A - 20)
  pdf.setLineWidth(0.4)
  pdf.rect(14, 14, L - 28, A - 28)

  // Marca
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(22)
  pdf.setTextColor(...azul)
  pdf.text('Plura', L / 2, 34, { align: 'center' })
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.setTextColor(...cinza)
  pdf.text('Turismo e lazer acessíveis', L / 2, 40, { align: 'center' })

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(30)
  pdf.setTextColor(20, 24, 32)
  pdf.text('CERTIFICADO', L / 2, 60, { align: 'center' })

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(13)
  pdf.setTextColor(...cinza)
  pdf.text('A Plura certifica que', L / 2, 76, { align: 'center' })

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(24)
  pdf.setTextColor(20, 24, 32)
  const nome = pdf.splitTextToSize(d.pagina, 220) as string[]
  pdf.text(nome.slice(0, 2), L / 2, 90, { align: 'center' })
  const yDepoisNome = 90 + (Math.min(nome.length, 2) - 1) * 10

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(12)
  pdf.setTextColor(...cinza)
  if (d.local) pdf.text(d.local, L / 2, yDepoisNome + 8, { align: 'center' })
  pdf.setFontSize(13)
  pdf.text('cumpriu os requisitos e recebeu a certificação', L / 2, yDepoisNome + 20, { align: 'center' })

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(20)
  pdf.setTextColor(...azul)
  pdf.text(pdf.splitTextToSize(d.certificacao, 230).slice(0, 2), L / 2, yDepoisNome + 33, { align: 'center' })

  // Datas e código
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(11)
  pdf.setTextColor(40, 44, 52)
  const yInfo = 165
  pdf.text(`Concedido em ${data(d.concedidaEm)}`, 30, yInfo)
  pdf.text(d.expiraEm ? `Válido até ${data(d.expiraEm)}` : 'Sem data de vencimento', 30, yInfo + 7)
  pdf.setFont('courier', 'bold')
  pdf.setFontSize(13)
  pdf.text(`Código: ${d.codigo}`, 30, yInfo + 16)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(...cinza)
  pdf.text('Confira a validade em plura.app.br/verificar ou leia o QR code ao lado.', 30, yInfo + 23)

  // QR code
  pdf.addImage(qr, 'PNG', L - 30 - 38, yInfo - 22, 38, 38)
  pdf.setFontSize(8)
  pdf.text('Verificar certificado', L - 30 - 19, yInfo + 20, { align: 'center' })

  pdf.save(`certificado-plura-${d.codigo}.pdf`)
}
