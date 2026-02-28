'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { LabWithRole } from '@/lib/supabase/labs'

type DashboardShellProps = {
  user: User
  labs: LabWithRole[]
  children: React.ReactNode
}

const navItems = [
  { label: 'Dashboard', href: '', icon: DashboardIcon },
  { label: 'Inventory', href: '/inventory', icon: InventoryIcon },
  { label: 'Equipment', href: '/equipment', icon: EquipmentIcon },
  { label: 'Budgets', href: '/budgets', icon: BudgetsIcon },
  { label: 'Settings', href: '/settings', icon: SettingsIcon },
]

export function DashboardShell({ user, labs, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // Extract current lab slug from the URL
  const segments = pathname.split('/')
  const currentLabSlug = segments[1] && segments[1] !== 'new-lab' ? segments[1] : null
  const currentLab = labs.find((l) => l.slug === currentLabSlug)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navContent = (
    <>
      {/* Lab selector */}
      <div className="px-3 py-4">
        {currentLab ? (
          <div className="mb-1">
            <p className="truncate text-sm font-semibold text-gray-900">
              {currentLab.name}
            </p>
            {currentLab.institution && (
              <p className="truncate text-xs text-gray-500">
                {currentLab.institution}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm font-semibold text-gray-900">Lab Manager</p>
        )}

        {/* Lab switcher — show if user has multiple labs */}
        {labs.length > 1 && (
          <select
            value={currentLabSlug ?? ''}
            onChange={(e) => {
              if (e.target.value) router.push(`/${e.target.value}`)
            }}
            className="mt-2 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            {!currentLabSlug && (
              <option value="" disabled>
                Select a lab
              </option>
            )}
            {labs.map((lab) => (
              <option key={lab.id} value={lab.slug}>
                {lab.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200" />

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3">
        {currentLabSlug ? (
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const href = `/${currentLabSlug}${item.href}`
              const isActive =
                item.href === ''
                  ? pathname === `/${currentLabSlug}`
                  : pathname.startsWith(href)

              return (
                <li key={item.label}>
                  <Link
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <item.icon active={isActive} />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="px-3 py-4 text-sm text-gray-500">
            {labs.length === 0 ? (
              <Link
                href="/new-lab"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
              >
                + Create your first lab
              </Link>
            ) : (
              <p>Select a lab to get started</p>
            )}
          </div>
        )}
      </nav>

      {/* New lab link */}
      <div className="border-t border-gray-200 px-2 py-2">
        <Link
          href="/new-lab"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <PlusIcon />
          New lab
        </Link>
      </div>

      {/* User section */}
      <div className="border-t border-gray-200 px-3 py-3">
        <p className="truncate text-sm text-gray-700">{user.email}</p>
        <button
          onClick={handleSignOut}
          className="mt-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Sign out
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-white">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop */}
      <aside className="hidden w-60 flex-shrink-0 flex-col border-r border-gray-200 bg-gray-50 lg:flex">
        {navContent}
      </aside>

      {/* Sidebar — mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-gray-200 bg-gray-50 transition-transform lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center border-b border-gray-200 px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="mr-3 rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
            aria-label="Open sidebar"
          >
            <HamburgerIcon />
          </button>

          <div className="flex-1" />

          <span className="hidden text-sm text-gray-500 sm:block">
            {user.email}
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}

// ---- Icons (simple SVG) ----

function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`h-4 w-4 ${active ? 'text-blue-600' : 'text-gray-400'}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
      />
    </svg>
  )
}

function InventoryIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`h-4 w-4 ${active ? 'text-blue-600' : 'text-gray-400'}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
      />
    </svg>
  )
}

function EquipmentIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`h-4 w-4 ${active ? 'text-blue-600' : 'text-gray-400'}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085"
      />
    </svg>
  )
}

function BudgetsIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`h-4 w-4 ${active ? 'text-blue-600' : 'text-gray-400'}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
      />
    </svg>
  )
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`h-4 w-4 ${active ? 'text-blue-600' : 'text-gray-400'}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg
      className="h-4 w-4 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4.5v15m7.5-7.5h-15"
      />
    </svg>
  )
}

function HamburgerIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
      />
    </svg>
  )
}
