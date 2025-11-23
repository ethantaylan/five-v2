import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Fives } from './pages/Fives';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error('Missing Clerk Publishable Key');
}

function SignedInRedirect() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirect = searchParams.get('redirect') || '/fives';
  return <Navigate to={redirect} replace />;
}

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route
            path="/sign-in/*"
            element={
              <>
                <SignedIn>
                  <SignedInRedirect />
                </SignedIn>
                <SignedOut>
                  <SignIn />
                </SignedOut>
              </>
            }
          />
          <Route
            path="/sign-up/*"
            element={
              <>
                <SignedIn>
                  <SignedInRedirect />
                </SignedIn>
                <SignedOut>
                  <SignUp />
                </SignedOut>
              </>
            }
          />

          {/* Protected routes */}
          <Route
            path="/fives"
            element={
              <ProtectedRoute>
                <Fives />
              </ProtectedRoute>
            }
          />

          {/* Default redirect to app */}
          <Route path="/" element={<Navigate to="/fives" replace />} />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/fives" replace />} />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </BrowserRouter>
    </ClerkProvider>
  );
}

export default App;
