import Link from 'next/link'
import type { ActivityLog, Json } from '@/lib/supabase/types'

type ActivityFeedProps = {
  labSlug: string
  activities: ActivityLog[]
}

/**
 * Format an activity log entry into a human-readable string.
 */
function formatActivity(entry: ActivityLog): string {
  const details = entry.details as Record<string, unknown> | null
  const name = (details?.name as string) ?? ''
  const type = (details?.type as string) ?? entry.entity_type

  switch (entry.action) {
    case 'created': {
      if (entry.entity_type === 'inventory_item') {
        const qty = details?.quantity
        return qty ? `Added ${qty} ${name}` : `Added ${name}`
      }
      if (entry.entity_type === 'equipment') {
        return `Registered equipment: ${name}`
      }
      if (entry.entity_type === 'grant') {
        const amount = details?.total_amount as number | undefined
        return amount
          ? `Created grant "${name}" ($${amount.toLocaleString()})`
          : `Created grant "${name}"`
      }
      if (entry.entity_type === 'transaction') {
        const amount = details?.amount as number | undefined
        const desc = details?.description as string | undefined
        return amount
          ? `Recorded purchase of $${amount.toLocaleString()}${desc ? `: ${desc}` : ''}`
          : `Recorded a transaction`
      }
      return `Created ${type}`
    }
    case 'updated': {
      const changes = details?.changes as string[] | undefined
      if (entry.entity_type === 'inventory_item') {
        return changes
          ? `Updated ${name} (${changes.join(', ')})`
          : `Updated ${name}`
      }
      if (entry.entity_type === 'equipment') {
        return `Updated equipment settings`
      }
      if (entry.entity_type === 'grant') {
        return `Updated grant details`
      }
      return `Updated ${type}`
    }
    case 'deleted': {
      if (entry.entity_type === 'inventory_item') {
        return `Removed ${name} from inventory`
      }
      if (entry.entity_type === 'transaction') {
        return `Deleted a transaction`
      }
      return `Deleted ${type}`
    }
    case 'quantity_changed': {
      const prev = details?.previous as number | undefined
      const delta = details?.delta as number | undefined
      if (delta !== undefined && delta > 0) {
        return `Added ${delta} to ${name} (was ${prev})`
      }
      if (delta !== undefined && delta < 0) {
        return `Removed ${Math.abs(delta)} from ${name} (was ${prev})`
      }
      return `Updated quantity of ${name}`
    }
    case 'maintenance_logged': {
      const mType = details?.type as string | undefined
      return mType
        ? `Logged ${mType} for equipment`
        : `Logged maintenance`
    }
    default:
      return `${entry.action} on ${entry.entity_type}`
  }
}

/**
 * Format a date string into a relative time like "2 hours ago" or "yesterday".
 */
function relativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHr / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Build a link for an activity entry based on entity type.
 */
function activityLink(
  labSlug: string,
  entry: ActivityLog
): string | null {
  if (!entry.entity_id) return null

  switch (entry.entity_type) {
    case 'inventory_item':
      return `/${labSlug}/inventory/${entry.entity_id}`
    case 'equipment':
      return `/${labSlug}/equipment/${entry.entity_id}`
    case 'grant':
      return `/${labSlug}/budgets/${entry.entity_id}`
    default:
      return null
  }
}

export function ActivityFeed({ labSlug, activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
        <p className="mt-4 text-sm text-gray-500">No activity yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
      <ul className="mt-4 space-y-3">
        {activities.map((entry) => {
          const link = activityLink(labSlug, entry)
          const text = formatActivity(entry)

          return (
            <li key={entry.id} className="flex items-start gap-3">
              <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-300" />
              <div className="min-w-0 flex-1">
                {link ? (
                  <Link
                    href={link}
                    className="text-sm text-gray-700 hover:text-blue-600 hover:underline"
                  >
                    {text}
                  </Link>
                ) : (
                  <p className="text-sm text-gray-700">{text}</p>
                )}
                <p className="mt-0.5 text-xs text-gray-400">
                  {relativeTime(entry.created_at)}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
