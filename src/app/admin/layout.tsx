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
  UserCheck,
  Zap,
  Sparkles,
  ShieldCheck,
  Search,
  Bell,
  Handshake,
  Compass,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from 'sonner';

const navItems = [
  { name: 'Overview Console', href: '/admin', icon: LayoutDashboard },
  { name: 'Installer Workspaces', href: '/admin/companies', icon: Building2 },
  { name: 'Insights Blog Editor', href: '/admin/content', icon: FileText },
  { name: 'B2C Sizer Leads', href: '/admin/leads', icon: UserCheck },
  { name: 'Lead Scrapers Console', href: '/admin/scrapers', icon: Compass },
  { name: 'Team Members', href: '/admin/users', icon: Users2 },
  { name: 'Supplier Partnerships', href: '/admin/partners', icon: Handshake },
  { name: 'Plan Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
  { name: 'Solar Proposals', href: '/admin/proposals', icon: FileSpreadsheet },
  { name: 'FX Override Manager', href: '/admin/fx-rates', icon: TrendingUp },
  { name: 'System Telemetry Logs', href: '/admin/logs', icon: Terminal },
  { name: 'Global Settings', href: '/admin/settings', icon: Settings2 },
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
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-350 transition-colors duration-300 overflow-hidden font-sans">
      
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0">
        {/* Logo Section */}
        <div className="flex h-16 items-center px-6 gap-2.5 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 shadow-sm group-hover:shadow-md transition-shadow">
              <Sun className="h-4.5 w-4.5 text-white font-black animate-spin-slow" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-slate-850 dark:text-slate-50">SolarQuotePro</span>
              <span className="text-[9px] font-bold text-teal-650 dark:text-teal-400 uppercase tracking-widest leading-none mt-0.5">Control Center</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider px-3.5 mb-2">
            Operations & Billing
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 group border ${
                  isActive 
                    ? 'bg-teal-500/10 border-teal-550/20 text-teal-650 dark:bg-teal-950/40 dark:border-teal-950/50 dark:text-teal-400 shadow-sm' 
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
                }`}
              >
                <item.icon className={`h-4 w-4 transition-transform duration-200 group-hover:scale-105 ${
                  isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-450 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-350'
                }`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between gap-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-3 rounded-2xl shadow-sm">
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Super Operator</span>
              <span className="text-xs font-extrabold text-slate-750 dark:text-slate-300 truncate mt-0.5" title={adminEmail ?? ''}>
                {adminEmail ?? 'Fetching...'}
              </span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center size-8 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer border border-transparent hover:border-rose-200 dark:hover:border-rose-900/30"
              title="Logout Administrative Console"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Menu Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-white dark:bg-slate-900 transition-transform duration-300 ease-in-out border-r border-slate-200 dark:border-slate-800 lg:hidden ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600">
              <Sun className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-850 dark:text-slate-50">SolarQuotePro Admin</span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
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
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                  isActive 
                    ? 'bg-teal-500/10 text-teal-650 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-200/50 dark:border-teal-900/30' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850/50'
                }`}
              >
                <item.icon className={`h-4 w-4 ${isActive ? 'text-teal-600' : 'text-slate-450'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center justify-between gap-2.5 p-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl">
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-bold text-teal-600 uppercase">Operator</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-350 truncate">
                {adminEmail ?? 'Fetching...'}
              </span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center size-8 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky Header Bar */}
        <header className="flex h-16 items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shrink-0 z-30 shadow-sm">
          
          {/* Header Left */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 lg:hidden cursor-pointer"
            >
              <Menu className="h-5.5 w-5.5" />
            </button>
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-base text-slate-850 dark:text-slate-50 lg:block hidden">Admin Console</span>
              <Badge className="bg-emerald-100 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/45 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900/30 flex items-center gap-1.5 text-[9px] py-0.5 px-2.5 rounded-full uppercase tracking-wider font-extrabold">
                <span className="inline-block size-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                Live Control Active
              </Badge>
            </div>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-3.5">
            {/* Session Info */}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 border-r border-slate-250 dark:border-slate-850 pr-4 lg:flex hidden">
              <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>Operator Session: <strong className="text-slate-700 dark:text-slate-350 font-bold">{adminEmail}</strong></span>
            </div>

            {/* Premium Theme Switch and Controls */}
            <ThemeToggle />

            {/* Direct Installer App Link */}
            <Button 
              variant="outline"
              size="sm"
              onClick={() => router.push('/workspace')}
              className="h-8.5 rounded-xl text-xs font-bold text-teal-655 hover:bg-teal-50 border-slate-200 dark:border-slate-800 dark:text-teal-450 dark:hover:bg-slate-800 shrink-0 cursor-pointer"
            >
              ⚡ Installer Workspace
            </Button>

            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLogout}
              className="h-8.5 rounded-xl border border-transparent hover:border-rose-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:border-rose-900/30 font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="lg:inline hidden">Logout</span>
            </Button>
          </div>
        </header>

        {/* Main Administrative Display View */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
