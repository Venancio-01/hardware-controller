import { createRootRoute, Outlet, redirect, useLocation } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { HeaderActionsContainer } from "@/components/layout/HeaderActions"

import { AuthProvider } from '@/contexts/auth.context'

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    // 检查认证状态: 如果未登录且不在登录页,重定向到登录页
    const token = localStorage.getItem('token');
    if (!token && location.pathname !== '/login') {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: RootLayout,
})

function RootLayout() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  // 登录页使用独立的全屏布局，不包含 header
  if (isLoginPage) {
    return (
      <AuthProvider>
        <TooltipProvider delayDuration={200}>
          <Outlet />
          <Toaster />
          <TanStackRouterDevtools position="bottom-right" />
        </TooltipProvider>
      </AuthProvider>
    );
  }

  // 其他页面使用标准布局
  return (
    <AuthProvider>
      <TooltipProvider delayDuration={200}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 font-sans antialiased">
          <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-sm">
            <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
              <h1 className="text-xl font-semibold tracking-tight px-4">供弹柜控制系统</h1>
              <div className="flex items-center gap-2 px-4">
                <HeaderActionsContainer />
              </div>
            </div>
          </header>
          <main className="container max-w-screen-2xl mx-auto p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
          <Toaster />
          <TanStackRouterDevtools position="bottom-right" />
        </div>
      </TooltipProvider>
    </AuthProvider>
  );
}
