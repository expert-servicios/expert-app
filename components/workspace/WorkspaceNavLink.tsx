import Link from 'next/link';
import type { ElementType, ReactNode } from 'react';

export interface WorkspaceNavLinkProps {
  href: string;
  label: string;
  icon: ElementType;
  active: boolean;
  compact?: boolean;
  onClick?: () => void;
  suffix?: ReactNode;
}

/** Common Kiranism-inspired navigation primitive, with independent link sets. */
export function WorkspaceNavLink({ href, label, icon: Icon, active, compact = false, onClick, suffix }: WorkspaceNavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      title={compact ? label : undefined}
      aria-current={active ? 'page' : undefined}
      className={`workspace-nav-item flex min-h-[36px] items-center rounded-lg px-3 py-2 text-sm transition-colors ${compact ? 'justify-center' : 'gap-2.5'} ${active ? 'workspace-nav-item-active font-semibold' : 'text-white/65 hover:bg-white/7 hover:text-white'}`}
    >
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
      {!compact && <span className="min-w-0 flex-1 truncate">{label}</span>}
      {!compact && suffix}
    </Link>
  );
}
