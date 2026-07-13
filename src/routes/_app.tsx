import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Shell } from '@/Shell'
import { AppSidebarShell } from '@/components/AppSidebarShell'
import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
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
      <Shell sidebar={<AppSidebarShell />} appName="Backup Cloud">
        <Outlet />
      </Shell>
    </BlinkClientBoundary>
  )
}
