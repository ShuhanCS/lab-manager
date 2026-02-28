import Link from 'next/link'
import { AuthForm } from '@/components/common/auth-form'

export const metadata = {
  title: 'Sign in — Lab Manager',
}

export default function LoginPage() {
  return (
    <div>
      <h2 className="mb-6 text-lg font-semibold text-gray-900">
        Sign in to your account
      </h2>

      <AuthForm mode="login" />

      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
          Create one
        </Link>
      </p>
    </div>
  )
}
