'use client'

import { useState } from 'react'
import { LabSettingsForm } from '@/components/settings/lab-settings-form'
import { MembersList } from '@/components/settings/members-list'
import { InviteForm } from '@/components/settings/invite-form'
import { LocationsManager } from '@/components/settings/locations-manager'
import type { Lab, Location, Member } from '@/lib/supabase/types'
import type { MemberWithEmail } from '@/lib/supabase/members'

type Tab = 'general' | 'members' | 'locations'

interface SettingsPageClientProps {
  lab: Lab
  role: Member['role']
  members: MemberWithEmail[]
  locations: Location[]
}

const tabs: { id: Tab; label: string; adminOnly?: boolean }[] = [
  { id: 'general', label: 'General' },
  { id: 'members', label: 'Members' },
  { id: 'locations', label: 'Locations' },
]

export function SettingsPageClient({
  lab,
  role,
  members,
  locations,
}: SettingsPageClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('general')

  const canManageMembers = role === 'owner' || role === 'admin'

  // Filter tabs: Members tab only visible to owner/admin
  const visibleTabs = tabs.filter(
    (tab) => !tab.adminOnly || canManageMembers
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your lab preferences, members, and locations.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6" aria-label="Settings tabs">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap border-b-2 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.id === 'members' && (
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {members.length}
                </span>
              )}
              {tab.id === 'locations' && (
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {locations.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'general' && <LabSettingsForm lab={lab} />}

      {activeTab === 'members' && (
        <div className="space-y-6">
          {canManageMembers && <InviteForm labId={lab.id} />}
          <MembersList members={members} currentUserRole={role} />
        </div>
      )}

      {activeTab === 'locations' && (
        <LocationsManager locations={locations} labId={lab.id} />
      )}
    </div>
  )
}
