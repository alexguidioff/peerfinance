'use client';

// components/dashboard/DashboardSidebar.tsx

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from "@supabase/supabase-js";
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, ShoppingCart, CheckCircle2,
  Settings, LogOut, Zap, Activity
} from 'lucide-react';

// Logo inline — stesso pulse dell'app pubblica
function PulseLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
        <svg viewBox="0 0 32 20" fill="none" className="h-4 w-auto" strokeLinecap="round" strokeLinejoin="round">
          <path d="M0,10 L7,10 L10,14 L13,2 L16,18 L19,10 L32,10"
            stroke="white" strokeWidth="2.2" fill="none" />
        </svg>
      </div>
      <span className="text-base tracking-tight text-white">
        <span className="font-medium">Cashflow</span>
        <span className="font-extrabold">Score</span>
      </span>
    </div>
  );
}

const TYPE_LABEL: Record<string, string> = {
  CFA: 'Cons. Finanziario',
  financial_coach: 'Financial Coach',
  career_coach: 'Career Coach',
};

const NAV = [
  { href: '/dashboard',            label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/dashboard/leads',      label: 'Lead Disponibili', icon: Users },
  { href: '/dashboard/acquistati', label: 'Lead Acquistati',  icon: CheckCircle2 },
  { href: '/dashboard/cart',       label: 'Carrello',         icon: ShoppingCart },
  { href: '/dashboard/profile',    label: 'Profilo',          icon: Settings },
];

export default function DashboardSidebar({
  consultant,
}: {
  consultant: { id: string; first_name: string; last_name: string; type: string; credits: number };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#13151f] border-r border-white/5 flex flex-col z-40">

      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/5">
        <PulseLogo />
      </div>

      {/* Profilo consulente */}
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-center gap-3 px-2 py-3 rounded-xl bg-white/5">
          <div className="h-9 w-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-indigo-300">
              {consultant.first_name[0]}{consultant.last_name[0]}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {consultant.first_name} {consultant.last_name}
            </p>
            <p className="text-xs text-white/40 truncate">
              {TYPE_LABEL[consultant.type] ?? consultant.type}
            </p>
          </div>
        </div>

        {/* Crediti */}
        <div className="mt-3 flex items-center justify-between px-2">
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Crediti disponibili
          </div>
          <span className="text-sm font-black text-amber-400">{consultant.credits}</span>
        </div>
      </div>

      {/* Navigazione */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-indigo-400' : ''}`} />
              {label}
              {href === '/dashboard/leads' && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-300">
                  <Activity className="w-3 h-3" />
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Esci
        </button>
      </div>
    </aside>
  );
}