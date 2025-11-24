import { SignIn as ClerkSignIn } from '@clerk/clerk-react';
import { useLocation } from 'react-router-dom';

export function SignIn() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirect = searchParams.get('redirect') || '/fives';
  const encodedRedirect = encodeURIComponent(redirect);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          <img src="/strive-logo.svg" alt="Stryver" className="h-16 w-16 rounded-xl bg-slate-900" />
        </div>
        <h1 className="text-3xl font-bold text-white">Stryver</h1>
        <p className="mt-2 text-slate-400">Organisez facilement vos matchs, événements ou sessions</p>
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
        signUpUrl={`/sign-up?redirect=${encodedRedirect}`}
        afterSignInUrl={redirect}
      />
    </div>
  );
}
