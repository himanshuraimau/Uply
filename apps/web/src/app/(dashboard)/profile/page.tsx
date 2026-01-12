import { ProfileForm } from '@/components/profile-form';

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-4 border-border bg-card p-6">
        <h1 className="text-4xl font-bold text-card-foreground mb-2 font-sans tracking-tight">
          YOUR PROFILE
        </h1>
        <p className="text-muted-foreground text-lg font-sans">
          Update your personal information and preferences.
        </p>
      </div>

      {/* Profile Form */}
      <div className="max-w-3xl">
        <ProfileForm />
      </div>
    </div>
  );
}
