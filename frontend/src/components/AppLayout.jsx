import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { WalletProvider } from '../context/WalletContext.jsx';
import { HistoryIcon, HomeIcon, LogoutIcon, SendIcon, WalletIcon } from './Icons.jsx';
import TopUpDialog from './TopUpDialog.jsx';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Ringkasan', Icon: HomeIcon },
  { to: '/transfer', label: 'Transfer', Icon: SendIcon },
  { to: '/transactions', label: 'Riwayat', Icon: HistoryIcon },
];

function sidebarLinkClass({ isActive }) {
  return `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
    isActive ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;
}

function bottomLinkClass({ isActive }) {
  return `flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium ${
    isActive ? 'text-brand-600' : 'text-slate-500'
  }`;
}

/** App shell for logged-in pages: sidebar on desktop, bottom navigation on phones. */
export default function AppLayout() {
  const { user, logout } = useAuth();
  const initial = user.username.charAt(0).toUpperCase();

  return (
    <WalletProvider>
      <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white md:sticky md:top-0 md:flex md:h-screen md:flex-col md:gap-6 md:p-4">
          <div className="flex items-center gap-2 px-2 pt-1">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white">
              <WalletIcon />
            </span>
            <span className="font-bold text-slate-900">Mini Wallet</span>
          </div>
          <nav className="flex flex-col gap-1" aria-label="Menu utama">
            {NAV_ITEMS.map(({ to, label, Icon }) => (
              <NavLink key={to} to={to} className={sidebarLinkClass}>
                <Icon />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-col pb-20 md:pb-0">
          <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-8">
            <span className="flex items-center gap-2 font-bold text-slate-900 md:invisible">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
                <WalletIcon className="h-4 w-4" />
              </span>
              Mini Wallet
            </span>
            <div className="flex items-center gap-3">
              <span
                className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 font-semibold text-brand-700"
                aria-hidden="true"
              >
                {initial}
              </span>
              <div className="hidden text-sm leading-tight sm:block">
                <div className="font-semibold text-slate-900">{user.username}</div>
                <div className="text-slate-500">{user.email}</div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <LogoutIcon className="h-4 w-4" />
                Keluar
              </button>
            </div>
          </header>

          <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-8">
            <Outlet />
          </main>
        </div>

        <nav
          className="fixed inset-x-0 bottom-0 z-10 flex border-t border-slate-200 bg-white md:hidden"
          aria-label="Menu utama"
        >
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className={bottomLinkClass}>
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
      <TopUpDialog />
    </WalletProvider>
  );
}
