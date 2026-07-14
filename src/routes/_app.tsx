// Pathless layout route — available for future routes under the app shell.
// Currently unused: routes/index.tsx handles routing via SharedAppLayout.
// To activate, add child route files under src/routes/_app/ and uncomment below.
//
// import { createFileRoute, Outlet } from '@tanstack/react-router'
// import { Shell } from '@/Shell'
// import { AppSidebarShell } from '@/components/AppSidebarShell'
// import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'
//
// export const Route = createFileRoute('/_app')({
//   component: AppLayout,
// })
//
// function AppLayout() {
//   return (
//     <BlinkClientBoundary fallback={<div className="flex min-h-dvh items-center justify-center bg-background"><div className="size-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" /></div>}>
//       <Shell sidebar={<AppSidebarShell />} appName="Backup Cloud">
//         <Outlet />
//       </Shell>
//     </BlinkClientBoundary>
//   )
// }
