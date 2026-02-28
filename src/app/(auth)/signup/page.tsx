import Link from 'next/link'
import { AuthForm } from '@/components/common/auth-form'

export const metadata = {
  title: 'Sign up — Lab Manager',
}

export default function SignupPage() {
  return (
    <div>
      <h2 className="mb-6 text-lg font-semibold text-gray-900">
        Create your account
      </h2>

      <AuthForm mode="signup" />

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}
