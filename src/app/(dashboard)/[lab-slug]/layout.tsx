import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLabBySlug, getUserRoleInLab } from '@/lib/supabase/labs'
import { LabProvider } from '@/components/dashboard/lab-context'

export default async function LabLayout({
  params,
  children,
}: {
  params: Promise<{ 'lab-slug': string }>
  children: React.ReactNode
}) {
  const { 'lab-slug': slug } = await params
  const supabase = await createServerSupabaseClient()

  const lab = await getLabBySlug(supabase, slug)
  if (!lab) notFound()

  const role = await getUserRoleInLab(supabase, lab.id)
  if (!role) notFound()

  return (
    <LabProvider lab={lab} role={role}>
      {children}
    </LabProvider>
  )
}
