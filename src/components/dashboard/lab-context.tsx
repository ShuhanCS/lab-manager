'use client'

import { createContext, useContext } from 'react'
import type { Lab, Member } from '@/lib/supabase/types'

type LabContextValue = {
  lab: Lab
  role: Member['role']
}

const LabContext = createContext<LabContextValue | null>(null)

export function LabProvider({
  lab,
  role,
  children,
}: {
  lab: Lab
  role: Member['role']
  children: React.ReactNode
}) {
  return (
    <LabContext.Provider value={{ lab, role }}>{children}</LabContext.Provider>
  )
}

export function useLab(): LabContextValue {
  const ctx = useContext(LabContext)
  if (!ctx) {
    throw new Error('useLab must be used within a LabProvider')
  }
  return ctx
}
