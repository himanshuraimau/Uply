import { Loading } from '@/components/ui/loading';

export default function LoadingPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="border-4 border-border bg-card p-8">
        <Loading size="lg" text="LOADING..." />
      </div>
    </div>
  );
}