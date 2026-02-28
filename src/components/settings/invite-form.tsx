'use client'

import { useState } from 'react'
import { createInviteLink } from '@/lib/supabase/members'

interface InviteFormProps {
  labId: string
}

export function InviteForm({ labId }: InviteFormProps) {
  const [role, setRole] = useState<'admin' | 'member'>('member')
  const [copied, setCopied] = useState(false)

  const invitePath = createInviteLink(labId, role)
  const fullUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${invitePath}`
      : invitePath

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input')
      input.value = fullUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="text-sm font-semibold text-gray-900">Invite Link</h3>
      <p className="mt-1 text-sm text-gray-500">
        Share this link with someone to invite them to your lab.
      </p>

      <div className="mt-4 flex items-end gap-3">
        {/* Role select */}
        <div>
          <label
            htmlFor="invite-role"
            className="block text-xs font-medium text-gray-600"
          >
            Role
          </label>
          <select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
            className="mt-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* URL display + copy */}
        <div className="flex flex-1 items-center gap-2">
          <input
            type="text"
            readOnly
            value={fullUrl}
            className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600 focus:outline-none"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {copied ? (
              <>
                <CheckIcon />
                Copied
              </>
            ) : (
              <>
                <CopyIcon />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-400">
        Anyone with this link can join your lab as a {role}. For MVP, no token
        verification is used.
      </p>
    </div>
  )
}

function CopyIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m4.5 12.75 6 6 9-13.5"
      />
    </svg>
  )
}
