import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import type { WorkspaceArea } from './WorkspaceFrame';

export interface WorkspaceBrandProps {
  area: WorkspaceArea;
  collapsed?: boolean;
  className?: string;
}

/** One branded header used by both workspaces; never encodes authorization. */
export function WorkspaceBrand({ area, collapsed = false, className = '' }: WorkspaceBrandProps) {
  const isAdmin = area === 'admin';
  return (
    <Link
      href={isAdmin ? '/admin' : '/dashboard'}
      aria-label={isAdmin ? 'EXPERT, inicio de administración' : 'EXPERT, inicio de mi espacio'}
      title={collapsed ? 'EXPERT' : undefined}
      className={`flex min-w-0 items-center gap-2.5 rounded-lg text-white transition hover:text-[#f1d385] ${className}`}
    >
      <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--workspace-accent)] text-[var(--workspace-sidebar)]">
        <ShieldCheck className="h-[17px] w-[17px]" />
      </span>
      {!collapsed && (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[11px] font-bold uppercase tracking-[0.19em] text-[var(--workspace-accent)]">EXPERT</span>
          <span className="truncate text-[10px] text-white/55">{isAdmin ? 'Administración' : 'Mi espacio de trabajo'}</span>
        </span>
      )}
    </Link>
  );
}
