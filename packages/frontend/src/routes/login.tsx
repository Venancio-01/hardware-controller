import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginRequestSchema } from 'shared';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { useState } from 'react';
import { useAuth } from '../contexts/auth.context';
import { Loader2, Shield } from 'lucide-react';

export const Route = createFileRoute('/login')({
  component: LoginPage,
  beforeLoad: async ({ location }) => {
    // 如果已登录,重定向到首页
    const token = localStorage.getItem('token');
    if (token) {
      throw redirect({
        to: '/',
      });
    }
  },
});

function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof loginRequestSchema>>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const { login, isLoading } = useAuth();

  async function onSubmit(values: z.infer<typeof loginRequestSchema>) {
    try {
      setError(null);
      await login(values);
    } catch (err: any) {
      setError(err.message || '登录失败，请检查用户名和密码');
    }
  }

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 overflow-hidden">
      {/* 装饰性背景元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-[380px] shadow-xl border-border/50 backdrop-blur-sm bg-card/95 animate-in fade-in-0 zoom-in-95 duration-300">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex justify-center mb-2">
            <div className="p-3 rounded-full bg-primary/10 ring-1 ring-primary/20">
              <Shield className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-semibold text-center tracking-tight">供弹柜控制系统</CardTitle>
          <CardDescription className="text-center text-muted-foreground">请输入您的凭据登录</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {error && (
            <Alert variant="destructive" className="mb-4 animate-in fade-in-0 slide-in-from-top-1 duration-200">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>登录失败</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">用户名</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="请输入用户名"
                        className="h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">密码</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="请输入密码"
                        className="h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-10 mt-2 font-medium transition-all duration-200 hover:shadow-md"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    登录中...
                  </>
                ) : '登录'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
