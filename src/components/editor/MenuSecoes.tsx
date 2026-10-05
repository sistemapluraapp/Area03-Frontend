'use client'

import { useEffect, useRef, useState } from 'react'
import {
  IconAccessible, IconAddressBook, IconCalendarEvent, IconCertificate, IconChevronDown, IconClock, IconId, IconMapPin,
  IconMenu2, IconMessageStar, IconPalette, IconPhoto, IconShieldCheck, IconSparkles, IconUsersGroup, IconX, type Icon,
} from '@tabler/icons-react'

const ICONES: Record<string, Icon> = {
  identidade: IconId, aparencia: IconPalette, acessibilidade: IconAccessible, localizacao: IconMapPin, horarios: IconClock,
  galeria: IconPhoto, experiencias: IconSparkles, eventos: IconCalendarEvent, contato: IconAddressBook, antes: IconShieldCheck,
  comentarios: IconMessageStar, equipe: IconUsersGroup, selos: IconCertificate,
}

interface Secao {
  id: string
  rotulo: string
}

// Seções do editor: menu lateral fixo no computador e menu sanduíche recolhível no celular
export default function MenuSecoes({ secoes, atual, aoTrocar }: { secoes: Secao[]; atual: string | null; aoTrocar: (id: string) => void }) {
  const [aberto, setAberto] = useState(false)
  const botaoRef = useRef<HTMLButtonElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const rotuloAtual = secoes.find((s) => s.id === atual)?.rotulo ?? 'Seções'
  const IconeAtual = (atual && ICONES[atual]) || IconMenu2

  useEffect(() => {
    if (!aberto) return
    function tecla(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setAberto(false)
        botaoRef.current?.focus()
      }
    }
    function fora(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('keydown', tecla)
    document.addEventListener('mousedown', fora)
    return () => {
      document.removeEventListener('keydown', tecla)
      document.removeEventListener('mousedown', fora)
    }
  }, [aberto])

  function escolher(id: string) {
    setAberto(false)
    aoTrocar(id)
  }

  return (
    <nav ref={navRef} aria-label="Seções do editor" className="editor-menu">
      <button
        ref={botaoRef}
        type="button"
        className="editor-menu-sanduiche"
        aria-expanded={aberto}
        aria-controls="editor-menu-lista"
        onClick={() => setAberto((v) => !v)}
      >
        {aberto ? <IconX size={20} aria-hidden /> : <IconMenu2 size={20} aria-hidden />}
        <span className="editor-menu-sanduiche-texto">
          <span className="editor-menu-sanduiche-dica">Seção</span>
          <span className="editor-menu-sanduiche-atual">
            <IconeAtual size={16} aria-hidden /> {rotuloAtual}
          </span>
        </span>
        <IconChevronDown size={18} aria-hidden className="editor-menu-seta" data-aberto={aberto} />
      </button>
      <ul id="editor-menu-lista" className="editor-menu-lista" data-aberto={aberto}>
        {secoes.map((s) => {
          const I = ICONES[s.id] ?? IconMenu2
          const ativa = s.id === atual
          return (
            <li key={s.id}>
              <button type="button" className="editor-menu-item" aria-current={ativa ? 'page' : undefined} onClick={() => escolher(s.id)}>
                <I size={18} aria-hidden /> <span>{s.rotulo}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
