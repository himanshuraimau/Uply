'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/auth-context';
import { profileSchema, type ProfileFormData } from '@/lib/validations';
import { apiClient as api } from '@/lib/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ErrorDisplay } from '@/components/ui/error-display';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2 } from 'lucide-react';

export function ProfileForm() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: user?.email || '',
      password: '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(false);

      // Only send fields that have values
      const updateData: any = {};
      if (data.email && data.email !== user?.email) updateData.email = data.email;
      if (data.password) updateData.password = data.password;

      if (Object.keys(updateData).length === 0) {
        return;
      }

      await api.put('/user/profile', updateData);
      setSuccess(true);
      form.reset({
        email: data.email || user?.email || '',
        password: '',
      });

      // Ideally we should reload user context here, but for now user might need to relogin to see changes reflected if they are critical
      // But email is just a field, so it's fine.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-4 border-border bg-card max-w-2xl">
      <CardHeader className="border-b-4 border-border pb-6">
        <CardTitle className="text-2xl font-bold text-card-foreground font-sans tracking-tight">
          PROFILE SETTINGS
        </CardTitle>
        <CardDescription className="text-muted-foreground font-sans text-lg">
          Manage your account settings and notification preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200 text-green-800 border-2">
            <CheckCircle2 className="h-5 w-5" />
            <AlertTitle className="font-bold">Success</AlertTitle>
            <AlertDescription>
              Your profile has been updated successfully.
            </AlertDescription>
          </Alert>
        )}

        {error && <ErrorDisplay error={error} className="mb-6" />}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6">
              <div className="space-y-2">
                <FormLabel className="text-sm font-bold text-foreground uppercase tracking-wide">
                  USERNAME
                </FormLabel>
                <div className="p-3 bg-muted border-2 border-border font-mono text-sm">
                  {user?.username}
                </div>
                <p className="text-xs text-muted-foreground">
                  Username cannot be changed.
                </p>
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-foreground uppercase tracking-wide">
                      EMAIL ADDRESS
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="you@example.com"
                        className="border-4 border-border focus:border-primary"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      We'll send alert notifications to this email address.
                    </FormDescription>
                    <FormMessage className="text-destructive font-semibold" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-foreground uppercase tracking-wide">
                      NEW PASSWORD
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Leave blank to keep current password"
                        className="border-4 border-border focus:border-primary"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter a new password only if you want to change it.
                    </FormDescription>
                    <FormMessage className="text-destructive font-semibold" />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                type="submit"
                size="lg"
                className="border-4 border-border bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-bold px-8"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'SAVING...' : 'SAVE CHANGES'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
