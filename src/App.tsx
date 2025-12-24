import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Fives } from './pages/Fives';
import { EventPage } from './pages/EventPage';
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

          {/* Event page - public but better with auth */}
          <Route
            path="/evenement/:id"
            element={<EventPage />}
          />

          {/* Landing page - show to non-authenticated users, redirect if authenticated */}
          <Route
            path="/"
            element={
              <>
                <SignedIn>
                  <Navigate to="/fives" replace />
                </SignedIn>
                <SignedOut>
                  <Navigate to="/sign-in" replace />
                </SignedOut>
              </>
            }
          />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
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
