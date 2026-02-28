'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateMemberRole, removeMember } from '@/lib/supabase/members'
import type { MemberWithEmail } from '@/lib/supabase/members'
import type { Member } from '@/lib/supabase/types'

interface MembersListProps {
  members: MemberWithEmail[]
  currentUserRole: Member['role']
}

const roleBadgeClasses: Record<Member['role'], string> = {
  owner: 'bg-purple-50 text-purple-700 border-purple-200',
  admin: 'bg-blue-50 text-blue-700 border-blue-200',
  member: 'bg-gray-50 text-gray-700 border-gray-200',
}

export function MembersList({ members, currentUserRole }: MembersListProps) {
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin'

  async function handleRoleChange(memberId: string, newRole: 'admin' | 'member') {
    setUpdating(memberId)
    setError(null)
    try {
      await updateMemberRole(supabase, memberId, newRole)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role')
    } finally {
      setUpdating(null)
    }
  }

  async function handleRemove(memberId: string) {
    setUpdating(memberId)
    setError(null)
    try {
      await removeMember(supabase, memberId)
      setConfirmRemove(null)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Joined
              </th>
              {canManage && (
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                  {member.email || member.user_id.slice(0, 8) + '...'}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {member.role === 'owner' ? (
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${roleBadgeClasses.owner}`}
                    >
                      Owner
                    </span>
                  ) : canManage ? (
                    <select
                      value={member.role}
                      onChange={(e) =>
                        handleRoleChange(
                          member.id,
                          e.target.value as 'admin' | 'member'
                        )
                      }
                      disabled={updating === member.id}
                      className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </select>
                  ) : (
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${roleBadgeClasses[member.role]}`}
                    >
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                  {new Date(member.joined_at).toLocaleDateString()}
                </td>
                {canManage && (
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {member.role !== 'owner' && (
                      <>
                        {confirmRemove === member.id ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="text-xs text-gray-500">Sure?</span>
                            <button
                              onClick={() => handleRemove(member.id)}
                              disabled={updating === member.id}
                              className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                            >
                              {updating === member.id ? 'Removing...' : 'Yes'}
                            </button>
                            <button
                              onClick={() => setConfirmRemove(null)}
                              className="text-xs font-medium text-gray-500 hover:text-gray-700"
                            >
                              No
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setConfirmRemove(member.id)}
                            className="text-xs font-medium text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {members.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">No members found.</p>
        </div>
      )}
    </div>
  )
}
