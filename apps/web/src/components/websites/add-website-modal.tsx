'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';

import { websiteSchema, type WebsiteFormData } from '@/lib/validations';
import { useWebsites } from '@/contexts/websites-context';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface AddWebsiteModalProps {
  trigger?: React.ReactNode;
}

export function AddWebsiteModal({ trigger }: AddWebsiteModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addWebsite } = useWebsites();

  const form = useForm<WebsiteFormData>({
    resolver: zodResolver(websiteSchema),
    defaultValues: {
      url: '',
    },
  });

  const onSubmit = async (data: WebsiteFormData) => {
    try {
      setIsSubmitting(true);
      await addWebsite({ ...data, isActive: true });
      form.reset();
      setOpen(false);
    } catch (error) {
      // Error is handled by the hook
      console.error('Add website error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button className="border-4 border-border bg-primary text-primary-foreground hover:bg-primary/80 font-bold">
      <Plus className="h-4 w-4 mr-2" />
      ADD WEBSITE
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="border-4 border-border bg-card max-w-md">
        <DialogHeader className="border-b-4 border-border pb-4">
          <DialogTitle className="text-2xl font-bold text-card-foreground font-sans tracking-tight">
            ADD WEBSITE
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter the URL of the website you want to monitor for uptime.
          </DialogDescription>
        </DialogHeader>

        <div className="pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-foreground uppercase tracking-wide">
                      WEBSITE URL
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="https://example.com"
                        className="border-4 border-border focus:border-primary"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage className="text-destructive font-semibold" />
                  </FormItem>
                )}
              />

              <div className="flex space-x-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="flex-1 border-4 border-border hover:bg-foreground font-semibold"
                  disabled={isSubmitting}
                >
                  CANCEL
                </Button>
                <Button
                  type="submit"
                  className="flex-1 border-4 border-border bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-bold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'ADDING...' : 'ADD WEBSITE'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
