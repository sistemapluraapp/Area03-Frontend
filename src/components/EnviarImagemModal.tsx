'use client'

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { IconCrop, IconPhotoUp, IconX, IconZoomIn, IconZoomOut } from '@tabler/icons-react'

// perfil/logo: quadrada, recorte em círculo (estilo foto de perfil do WhatsApp)
// capa: horizontal 16:9 (estilo imagem de cabeçalho do Google Forms)
export type TipoImagem = 'perfil' | 'logo' | 'capa'

const CONFIG: Record<TipoImagem, { titulo: string; largura: number; altura: number; redonda: boolean; dica: string }> = {
  perfil: {
    titulo: 'Foto de perfil',
    largura: 400,
    altura: 400,
    redonda: true,
    dica: 'Imagem quadrada. Ela aparece recortada em círculo.',
  },
  logo: {
    titulo: 'Logo do empreendimento',
    largura: 400,
    altura: 400,
    redonda: true,
    dica: 'Imagem quadrada. A logo aparece recortada em círculo sobre a capa.',
  },
  capa: {
    titulo: 'Imagem de capa',
    largura: 1600,
    altura: 900,
    redonda: false,
    dica: 'Imagem horizontal (proporção 16:9). Prefira fotos reais do local.',
  },
}

const TIPOS_ACEITOS = 'image/jpeg,image/png,image/webp'
const TAMANHO_MAXIMO_ARQUIVO = 15 * 1024 * 1024

async function recortar(src: string, area: Area, largura: number, altura: number): Promise<string> {
  const imagem = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Não foi possível ler a imagem'))
    img.src = src
  })
  const canvas = document.createElement('canvas')
  canvas.width = largura
  canvas.height = altura
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Não foi possível processar a imagem')
  ctx.imageSmoothingQuality = 'high'
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, largura, altura)
  ctx.drawImage(imagem, area.x, area.y, area.width, area.height, 0, 0, largura, altura)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
  return dataUrl.split(',')[1] ?? ''
}

function Moldura({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: ReactNode }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10050,
        background: 'var(--c-overlay)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'ep-fade 150ms ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'var(--c-modal-bg)',
          border: 'var(--c-border)',
          borderRadius: '1.25rem',
          boxShadow: 'var(--c-shadow-lg)',
          color: 'var(--c-text-1)',
          animation: 'ep-scale 180ms ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--c-divider)' }}>
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: 0 }}>{titulo}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            style={{ background: 'none', border: 'none', color: 'var(--c-text-2)', cursor: 'pointer', display: 'flex', padding: '0.25rem' }}
          >
            <IconX size={20} />
          </button>
        </div>
        <div style={{ padding: '1.25rem' }}>{children}</div>
      </div>
    </div>
  )
}

const botaoBase = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  padding: '0.625rem 1.125rem',
  borderRadius: '0.75rem',
  fontSize: '0.9375rem',
  fontWeight: 600,
  fontFamily: 'inherit',
  cursor: 'pointer',
} as const

const botaoPrimario = {
  ...botaoBase,
  border: '1px solid rgba(26,122,255,0.6)',
  background: 'linear-gradient(135deg, #1a7aff 0%, #0062e6 100%)',
  color: '#ffffff',
} as const

const botaoSecundario = {
  ...botaoBase,
  border: '1px solid var(--c-btn-secondary-border)',
  background: 'var(--c-btn-secondary-bg)',
  color: 'var(--c-btn-secondary-text)',
} as const

export default function EnviarImagemModal({
  tipo,
  onClose,
  onConfirm,
}: {
  tipo: TipoImagem
  onClose: () => void
  onConfirm: (imagemBase64: string, extensao: string) => Promise<void>
}) {
  const config = CONFIG[tipo]
  const inputRef = useRef<HTMLInputElement>(null)
  const [src, setSrc] = useState<string | null>(null)
  const [dimensoes, setDimensoes] = useState<{ largura: number; altura: number } | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [area, setArea] = useState<Area | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    return () => {
      if (src) URL.revokeObjectURL(src)
    }
  }, [src])

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape' && !enviando) onClose()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [enviando, onClose])

  const aoCompletarRecorte = useCallback((_: Area, pixels: Area) => setArea(pixels), [])

  function aoEscolherArquivo(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo) return
    if (!TIPOS_ACEITOS.split(',').includes(arquivo.type)) {
      setErro('Formato não suportado. Use JPG, PNG ou WEBP.')
      return
    }
    if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO) {
      setErro('Arquivo muito grande. Escolha uma imagem de até 15 MB.')
      return
    }
    setErro('')
    const url = URL.createObjectURL(arquivo)
    const img = new Image()
    img.onload = () => setDimensoes({ largura: img.naturalWidth, altura: img.naturalHeight })
    img.src = url
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setSrc(url)
  }

  async function confirmar() {
    if (!src || !area) return
    setEnviando(true)
    setErro('')
    try {
      const base64 = await recortar(src, area, config.largura, config.altura)
      await onConfirm(base64, 'jpeg')
      onClose()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao enviar a imagem')
    } finally {
      setEnviando(false)
    }
  }

  const pequenaDemais =
    dimensoes !== null && (dimensoes.largura < config.largura * 0.6 || dimensoes.altura < config.altura * 0.6)

  const inputArquivo = (
    <input ref={inputRef} type="file" accept={TIPOS_ACEITOS} onChange={aoEscolherArquivo} style={{ display: 'none' }} />
  )

  const mensagemErro = erro && (
    <p
      role="alert"
      style={{
        marginTop: '1rem',
        padding: '0.625rem 0.875rem',
        borderRadius: '0.75rem',
        background: 'var(--c-danger-soft)',
        border: '1px solid var(--c-danger-border)',
        color: 'var(--c-danger-text)',
        fontSize: '0.875rem',
      }}
    >
      {erro}
    </p>
  )

  // Etapa 1 — orientação de tamanho antes de escolher o arquivo
  if (!src) {
    return (
      <Moldura titulo={config.titulo} onClose={onClose}>
        {inputArquivo}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div
            aria-hidden
            style={{
              flexShrink: 0,
              width: config.redonda ? '72px' : '112px',
              height: config.redonda ? '72px' : '63px',
              borderRadius: config.redonda ? '50%' : '0.5rem',
              border: '2px dashed var(--c-accent-soft-border)',
              background: 'var(--c-accent-soft)',
              color: 'var(--c-accent-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconPhotoUp size={26} stroke={1.6} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>
              Tamanho ideal: {config.largura} × {config.altura} px
            </p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--c-text-2)', lineHeight: 1.5 }}>{config.dica}</p>
          </div>
        </div>
        <ul style={{ margin: 0, paddingLeft: '1.125rem', fontSize: '0.8125rem', color: 'var(--c-text-2)', lineHeight: 1.7 }}>
          <li>Formatos aceitos: JPG, PNG ou WEBP.</li>
          <li>Depois de escolher o arquivo, você poderá ajustar o enquadramento.</li>
        </ul>
        {mensagemErro}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.625rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <button type="button" style={botaoSecundario} onClick={onClose}>
            Cancelar
          </button>
          <button type="button" style={botaoPrimario} onClick={() => inputRef.current?.click()}>
            <IconPhotoUp size={18} /> Enviar arquivo
          </button>
        </div>
      </Moldura>
    )
  }

  // Etapa 2 — recorte
  return (
    <Moldura titulo={`Ajustar ${config.titulo.toLowerCase()}`} onClose={enviando ? () => {} : onClose}>
      {inputArquivo}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: config.redonda ? '340px' : '300px',
          borderRadius: '0.875rem',
          overflow: 'hidden',
          background: '#111',
        }}
      >
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={config.largura / config.altura}
          cropShape={config.redonda ? 'round' : 'rect'}
          showGrid={!config.redonda}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={aoCompletarRecorte}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem', color: 'var(--c-text-2)' }}>
        <IconZoomOut size={18} aria-hidden />
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          aria-label="Zoom"
          style={{ flex: 1, accentColor: '#1a7aff' }}
        />
        <IconZoomIn size={18} aria-hidden />
      </div>
      <p style={{ margin: '0.625rem 0 0', fontSize: '0.8125rem', color: 'var(--c-text-3)' }}>
        Arraste a imagem para enquadrar e use o controle para aproximar.
      </p>

      {pequenaDemais && (
        <p style={{ margin: '0.75rem 0 0', fontSize: '0.8125rem', color: 'var(--c-text-2)' }}>
          Esta imagem é menor que o tamanho ideal ({config.largura} × {config.altura} px) e pode ficar com pouca nitidez.
        </p>
      )}
      {mensagemErro}

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.625rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
        <button type="button" style={botaoSecundario} onClick={() => inputRef.current?.click()} disabled={enviando}>
          Trocar arquivo
        </button>
        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <button type="button" style={botaoSecundario} onClick={onClose} disabled={enviando}>
            Cancelar
          </button>
          <button type="button" style={{ ...botaoPrimario, opacity: enviando || !area ? 0.6 : 1 }} onClick={confirmar} disabled={enviando || !area}>
            <IconCrop size={18} /> {enviando ? 'Enviando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </Moldura>
  )
}
