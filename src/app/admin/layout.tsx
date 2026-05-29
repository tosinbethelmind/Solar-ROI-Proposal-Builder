'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { 
  LayoutDashboard, 
  Building2, 
  Users2, 
  CreditCard, 
  FileSpreadsheet, 
  TrendingUp, 
  Terminal, 
  Settings2, 
  LogOut, 
  Sun,
  Menu,
  X,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const navItems = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Companies', href: '/admin/companies', icon: Building2 },
  { name: 'Users', href: '/admin/users', icon: Users2 },
  { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
  { name: 'Proposals', href: '/admin/proposals', icon: FileSpreadsheet },
  { name: 'FX Rate Manager', href: '/admin/fx-rates', icon: TrendingUp },
  { name: 'System Logs', href: '/admin/logs', icon: Terminal },
  { name: 'Settings', href: '/admin/settings', icon: Settings2 },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [adminEmail, setAdminEmail] = React.useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    async function getAdminUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setAdminEmail(user.email ?? 'Platform Admin');
      }
    }
    getAdminUser();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Failed to log out: ' + error.message);
    } else {
      toast.success('Logged out successfully');
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-100 border-r border-slate-800 shrink-0">
        {/* Sidebar Header */}
        <div className="flex h-16 items-center px-6 gap-2.5 border-b border-slate-800 bg-slate-950">
          <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 shadow-md">
            <Sun className="h-4.5 w-4.5 text-slate-950 font-black animate-spin-slow" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white">SolarPro Admin</span>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                  isActive 
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <item.icon className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-105 ${
                  isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
                }`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Super Admin</span>
              <span className="text-sm font-semibold text-slate-300 truncate" title={adminEmail ?? ''}>
                {adminEmail ?? 'Loading...'}
              </span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center size-9 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
              title="Logout Platform Admin"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Left Sidebar Drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-slate-900 text-slate-100 transition-transform duration-300 ease-in-out lg:hidden ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500">
              <Sun className="h-4.5 w-4.5 text-slate-950" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white">SolarPro Admin</span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <item.icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Super Admin</span>
              <span className="text-sm font-semibold text-slate-300 truncate">
                {adminEmail ?? 'Loading...'}
              </span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center size-9 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="flex h-16 items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 shadow-sm z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-slate-800 dark:text-white lg:block hidden">Super Admin Control</span>
              <span className="text-xs font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded-full border border-teal-200/50 dark:border-teal-900/50 uppercase tracking-wide">
                Platform Live
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800 pr-4 lg:flex hidden">
              <UserCheck className="h-4 w-4 text-emerald-500" />
              <span>Session: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{adminEmail}</strong></span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLogout}
              className="h-8.5 rounded-lg border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm hover:text-red-500 hover:border-red-200 dark:hover:border-red-900/50"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </Button>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
