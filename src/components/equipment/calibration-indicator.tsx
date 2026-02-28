import type { Equipment } from '@/lib/supabase/types'

interface CalibrationIndicatorProps {
  calibrationIntervalDays: Equipment['calibration_interval_days']
  lastCalibrated: Equipment['last_calibrated']
}

export function CalibrationIndicator({
  calibrationIntervalDays,
  lastCalibrated,
}: CalibrationIndicatorProps) {
  if (!calibrationIntervalDays) return null

  const now = new Date()

  if (!lastCalibrated) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
        <CalibrationDot className="text-red-500" />
        Never calibrated
      </span>
    )
  }

  const lastCal = new Date(lastCalibrated)
  const nextDue = new Date(lastCal)
  nextDue.setDate(nextDue.getDate() + calibrationIntervalDays)

  const diffMs = nextDue.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
        <CalibrationDot className="text-red-500" />
        Overdue by {Math.abs(diffDays)} day{Math.abs(diffDays) !== 1 ? 's' : ''}
      </span>
    )
  }

  if (diffDays <= 7) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-600">
        <CalibrationDot className="text-yellow-500" />
        Due in {diffDays} day{diffDays !== 1 ? 's' : ''}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
      <CalibrationDot className="text-green-500" />
      Calibrated {lastCal.toLocaleDateString()}
    </span>
  )
}

function CalibrationDot({ className }: { className?: string }) {
  return (
    <svg className={`h-2 w-2 ${className ?? ''}`} viewBox="0 0 8 8" fill="currentColor">
      <circle cx="4" cy="4" r="4" />
    </svg>
  )
}
