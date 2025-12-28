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
import { LoginStatusPanel } from '@/components/auth/LoginStatusPanel';

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
    <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-[900px] h-[600px] grid grid-cols-1 md:grid-cols-2 bg-card rounded-xl shadow-2xl overflow-hidden border border-border/50">

        {/* Left Side - Login Form */}
        <div className="flex flex-col justify-center p-6 lg:p-10 relative">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <div className="flex justify-center mb-2">
                <div className="p-3 rounded-full bg-primary/10 ring-1 ring-primary/20">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">欢迎回来</h1>
              <p className="text-sm text-muted-foreground">
                请输入您的凭据登录控制系统
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="animate-in fade-in-0 slide-in-from-top-1 duration-200">
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
                      <FormLabel>用户名</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="请输入用户名"
                          {...field}
                          className="h-10"
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
                      <FormLabel>密码</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="请输入密码"
                          {...field}
                          className="h-10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full h-10 mt-2"
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

            <p className="px-8 text-center text-sm text-muted-foreground">
              登录即代表您同意遵守
              <span className="underline underline-offset-4 hover:text-primary cursor-pointer mx-1">
                安全操作规范
              </span>
              和
              <span className="underline underline-offset-4 hover:text-primary cursor-pointer mx-1">
                使用条款
              </span>
              。
            </p>
          </div>
        </div>

        {/* Right Side - Status Panel */}
        <div className="hidden md:block h-full bg-muted/30">
          <LoginStatusPanel />
        </div>
      </div>
    </div>
  );
}
