import { createFileRoute } from '@tanstack/react-router'
import { SharedAppLayout } from '@/layouts/shared-app-layout'
import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'
import { DashboardPage } from './_app/index'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Dashboard · Universal Backup Cloud' },
      { name: 'description', content: 'Monitor your universal cloud backups, storage, and earnings.' },
    ],
  }),
  component: Home,
})

function Home() {
  return (
    <BlinkClientBoundary
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
            <span className="text-sm text-muted-foreground">Loading dashboard...</span>
          </div>
        </div>
      }
    >
      <SharedAppLayout appName="Backup Cloud">
        <DashboardPage />
      </SharedAppLayout>
    </BlinkClientBoundary>
  )
}
