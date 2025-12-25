import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Toaster } from "@/components/ui/sonner"

import { AuthProvider } from '@/contexts/auth.context'

export const Route = createRootRoute({
  component: () => (
    <AuthProvider>
      <div className="min-h-screen bg-background font-sans antialiased">
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 max-w-screen-2xl items-center">
            <h1 className="text-xl font-bold px-4">Node Switch Controller</h1>
          </div>
        </header>
        <main className="container max-w-screen-2xl mx-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
        <Toaster />
        <TanStackRouterDevtools position="bottom-right" />
      </div>
    </AuthProvider>
  ),
})
