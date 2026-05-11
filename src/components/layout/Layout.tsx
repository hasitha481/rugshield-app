// src/components/layout/Layout.tsx
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { Footer } from './Footer';

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-primary text-text-primary">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MobileNav />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}