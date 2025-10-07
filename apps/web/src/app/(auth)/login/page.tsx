'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

import { useAuth } from '@/contexts/auth-context';
import { loginSchema, type LoginFormData } from '@/lib/validations';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      router.push('/dashboard');
    } catch (error) {
      // Error is handled by the auth context
      console.error('Login error:', error);
    }
  };

  return (
    <Card className="tech-card">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center text-card-foreground font-sans tracking-wide uppercase">
          LOGIN TO UPLY
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-bold text-foreground uppercase tracking-wide mb-3">
                    USERNAME
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter your username"
                      className="border-2 border-border focus:border-primary hover-glow text-base"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage className="text-destructive font-semibold text-sm mt-2" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-bold text-foreground uppercase tracking-wide mb-3">
                    PASSWORD
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        className="border-2 border-border focus:border-primary hover-glow pr-14 text-base"
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 p-0 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-destructive font-semibold text-sm mt-2" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full h-14 hover-glow font-bold text-lg uppercase tracking-wide mt-8"
              disabled={isLoading}
            >
              {isLoading ? 'LOGGING IN...' : 'LOGIN'}
            </Button>
          </form>
        </Form>

        <div className="mt-8 text-center">
          <p className="text-muted-foreground font-sans text-base">
            Don't have an account?{' '}
            <Link
              href="/signup"
              className="font-bold text-primary hover:text-primary/80 uppercase tracking-wide transition-colors"
            >
              Sign Up
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground font-medium uppercase tracking-wide transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
