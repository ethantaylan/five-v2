import { SignIn as ClerkSignIn } from '@clerk/clerk-react';
import { useLocation } from 'react-router-dom';

export function SignIn() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirect = searchParams.get('redirect') || '/fives';
  const encodedRedirect = encodeURIComponent(redirect);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-primary px-4 transition-colors duration-300">
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          <img src="/strive-logo.svg" alt="Stryver" className="h-16 w-16 rounded-xl bg-slate-900 shadow-lg" />
        </div>
        <h1 className="text-3xl font-bold text-text-primary">Stryver</h1>
        <p className="mt-2 text-text-secondary">Organisez facilement vos matchs, événements ou sessions</p>
      </div>
      <ClerkSignIn
        appearance={{
          elements: {
            rootBox: 'w-full max-w-md',
            card: 'bg-bg-card/70 border border-border-primary backdrop-blur-sm shadow-xl',
          },
        }}
        routing="path"
        path="/sign-in"
        signUpUrl={`/sign-up?redirect=${encodedRedirect}`}
        afterSignInUrl={redirect}
      />
    </div>
  );
}
