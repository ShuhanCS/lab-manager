import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUserLabs, type LabWithRole } from '@/lib/supabase/labs'
import { DashboardShell } from '@/components/dashboard/shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let labs: LabWithRole[]
  try {
    labs = await getUserLabs(supabase)
  } catch {
    labs = []
  }

  // If user has no labs and is not already on /new-lab, redirect to create one
  // (we check the pathname via a client component wrapper instead)

  return (
    <DashboardShell user={user} labs={labs}>
      {children}
    </DashboardShell>
  )
}
