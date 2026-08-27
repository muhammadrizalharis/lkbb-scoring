import type { Metadata } from 'next'
import { LoginForm } from '../login/LoginForm'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function OperatorEntryPage() {
  return <LoginForm variant="operator" />
}
