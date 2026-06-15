/* Single source of truth for the demo document used across the "Como funciona"
   scenes: the messy notes the user types, the structured multi-section document
   the AI produces, and the deck agenda it maps to. Keeping it here means the
   write scene, the script scene and the generated deck always agree. */

import { msg } from '@lingui/core/macro'
import type { MessageDescriptor } from '@lingui/core'

export const DOC_TITLE: MessageDescriptor = msg`Apollo 11: A Chegada à Lua`

/** The raw braindump the user types in scene 1 (lowercase, out of order). */
export const RAW_NOTES: MessageDescriptor[] = [
  msg`apollo 11 — chegada à lua`,
  msg`corrida espacial: eua x urss`,
  msg`1957 sputnik / 1961 gagarin`,
  msg`kennedy prometeu ir à lua`,
  msg`saturn V decolou em 16 jul 1969`,
  msg`cabo kennedy, flórida`,
  msg`tripulação: armstrong, aldrin, collins`,
  msg`3 dias até a órbita lunar`,
  msg`20 jul: módulo eagle pousa`,
  msg`mar da tranquilidade`,
  msg`armstrong: "um pequeno passo..."`,
  msg`aprox 2h na superfície`,
  msg`trouxeram amostras da lua`,
  msg`voltaram à terra em 24 jul`
]

export type DocSection = {
  title: MessageDescriptor
  /** Prose version of the section (shown before the AI turns it into topics). */
  lead?: MessageDescriptor
  bullets: MessageDescriptor[]
}

/** The structured document the AI organizes the notes into — a proper deck
    outline: a title slide plus these sections plus a closing ≈ 8 slides. */
export const SECTIONS: DocSection[] = [
  {
    title: msg`Contexto`,
    lead: msg`No auge da Guerra Fria, EUA e URSS disputavam cada marco da exploração espacial.`,
    bullets: [
      msg`1957: a URSS lança o Sputnik`,
      msg`1961: Gagarin, o primeiro humano em órbita`,
      msg`Kennedy promete levar o homem à Lua até 1970`
    ]
  },
  {
    title: msg`A viagem`,
    bullets: [
      msg`Lançada em 16 de julho de 1969, do Cabo Kennedy`,
      msg`O foguete Saturn V impulsionou a nave rumo à Lua`,
      msg`Três dias de viagem até a órbita lunar`
    ]
  },
  {
    title: msg`A tripulação`,
    bullets: [
      msg`Neil Armstrong — comandante`,
      msg`Buzz Aldrin — piloto do módulo lunar`,
      msg`Michael Collins — piloto do módulo de comando`
    ]
  },
  {
    title: msg`O pouso na Lua`,
    lead: msg`Em 20 de julho de 1969 o módulo lunar Eagle pousou no Mar da Tranquilidade. Horas depois, Armstrong desceu e tornou-se o primeiro humano a pisar na Lua.`,
    bullets: [
      msg`Eagle pousa no Mar da Tranquilidade`,
      msg`Armstrong, o primeiro a pisar na Lua`,
      msg`Aldrin o acompanha minutos depois`
    ]
  },
  {
    title: msg`Na superfície`,
    bullets: [
      msg`≈ 2h de caminhada e coleta de amostras`,
      msg`Instalação de experimentos científicos`,
      msg`Bandeira e placa comemorativa`
    ]
  },
  {
    title: msg`Legado`,
    bullets: [
      msg`Marco da corrida espacial`,
      msg`Cerca de 600 milhões assistiram ao vivo`,
      msg`21,5 kg de amostras lunares trazidas à Terra`
    ]
  }
]

/** Deck table of contents — derived from the document's sections. */
export const AGENDA: MessageDescriptor[] = SECTIONS.map((s) => s.title)
