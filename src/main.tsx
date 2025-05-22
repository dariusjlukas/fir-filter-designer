import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { HeroUIProvider, ToastProvider } from '@heroui/react';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HeroUIProvider>
      <ToastProvider />
      <main className='w-screen md:h-screen text-foreground bg-background'>
        <App />
      </main>
    </HeroUIProvider>
  </StrictMode>
);
