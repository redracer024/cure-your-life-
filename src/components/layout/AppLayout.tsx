import React from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen premium-bg text-white font-sans flex flex-col selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      <div className="absolute inset-0 glowing-bg-grid opacity-100 pointer-events-none z-0" />
      {children}
    </div>
  );
};
