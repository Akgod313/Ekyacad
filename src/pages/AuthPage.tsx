import React from 'react';
import { SignIn } from '@clerk/clerk-react';

export const AuthPage = () => {
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e1e1e' }}>
      <SignIn 
        routing="hash" 
        // Use the standard redirect paths so Clerk resolves the session smoothly
        afterSignInUrl="/"
        afterSignUpUrl="/"
      />
    </div>
  );
};