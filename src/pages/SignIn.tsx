import { SignIn as ClerkSignIn } from '@clerk/clerk-react';

export function SignIn() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/50">
            <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white">Football 5c5</h1>
        <p className="mt-2 text-slate-400">Organisez vos matchs de foot en salle</p>
      </div>
      <ClerkSignIn
        appearance={{
          elements: {
            rootBox: 'w-full max-w-md',
            card: 'bg-slate-900/50 border border-white/10 backdrop-blur-sm shadow-xl',
          },
        }}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl="/groups"
      />
    </div>
  );
}
