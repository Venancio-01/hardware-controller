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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { useState } from 'react';
import { useAuth } from '../contexts/auth.context';

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
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 section-padding">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle className="text-2xl text-center">系统登录</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>错误</AlertTitle>
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
                      <Input placeholder="admin" {...field} />
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
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? '登录中...' : '登录'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
