import { NavLink } from 'react-router';
import { useState, type ReactNode } from 'react';

import { platform } from '../composition';
import { enableNotifications } from '../lib/appActions';
import { useAppStore } from '../store/useAppStore';
import { Button } from './Button';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors',
    isActive
      ? 'bg-rose-600 text-white'
      : 'text-slate-700 hover:bg-slate-200/70 dark:text-slate-200 dark:hover:bg-slate-800',
  ].join(' ');

export function AppShell({ children }: { children: ReactNode }) {
  const permission = useAppStore((state) => state.notificationPermission);
  const [permissionBusy, setPermissionBusy] = useState(false);
  const [permissionHint, setPermissionHint] = useState<string | null>(null);

  async function handleEnableNotifications() {
    setPermissionBusy(true);
    setPermissionHint(null);
    try {
      const granted = await enableNotifications();
      if (granted) {
        const shown = await platform.notifications.notifyNow(
          'Pillify',
          'Notificações ativadas. Os lembretes vão aparecer com a aba aberta.',
        );
        setPermissionHint(
          shown
            ? 'Permissão concedida. Você deve ter visto um aviso de teste.'
            : 'Permissão concedida.',
        );
      } else {
        setPermissionHint(
          'Permissão negada ou bloqueada. Libere notificações nas configurações do navegador para este site.',
        );
      }
    } finally {
      setPermissionBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {!platform.isNotificationReliable ? (
        <div
          role="status"
          className="border-b border-amber-300/80 bg-amber-100 px-4 py-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
        >
          Notificações do navegador só funcionam com a aba aberta. A validação real dos
          lembretes será no APK Android (Fase 3).
        </div>
      ) : null}

      {permission !== 'granted' ? (
        <div className="space-y-3 border-b border-sky-300/80 bg-sky-100 px-4 py-3 text-sm text-sky-950 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100">
          <p>
            {permission === 'denied'
              ? 'As notificações estão bloqueadas para este site.'
              : 'Ative as notificações para receber o lembrete com a aba aberta.'}
          </p>
          {permission !== 'denied' ? (
            <Button
              onClick={() => void handleEnableNotifications()}
              disabled={permissionBusy}
              className="min-h-11"
            >
              {permissionBusy ? 'Solicitando…' : 'Ativar notificações'}
            </Button>
          ) : null}
          {permissionHint ? <p>{permissionHint}</p> : null}
        </div>
      ) : null}

      <header className="flex items-center justify-between px-4 py-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-rose-600 uppercase">Pillify</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Lembrete de remédios</p>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28">{children}</main>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95"
      >
        <div className="mx-auto flex max-w-lg items-center justify-around gap-2 px-3 py-2">
          <NavLink to="/" end className={linkClass}>
            Hoje
          </NavLink>
          <NavLink to="/history" className={linkClass}>
            Histórico
          </NavLink>
          <NavLink to="/setup" className={linkClass}>
            Config
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
