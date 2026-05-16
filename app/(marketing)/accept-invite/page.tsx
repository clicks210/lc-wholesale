import { Suspense } from 'react'
import AcceptInviteClient from './AcceptInviteClient'

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f8f3ea] px-4 py-16">
          <div className="mx-auto max-w-xl border border-[#d6cec0] bg-white p-8">
            <p className="text-sm font-black text-[#244f3d]">
              Loading invite...
            </p>
          </div>
        </main>
      }
    >
      <AcceptInviteClient />
    </Suspense>
  )
}