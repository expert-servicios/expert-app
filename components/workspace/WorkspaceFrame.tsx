import type { ReactNode } from 'react';

/**
 * Shared presentational frame for the two EXPERT Workspace surfaces.
 *
 * Deliberately does not own auth, permissions, API calls or company selection.
 * Admin and Client retain their distinct server-side route guards and menus.
 */
export type WorkspaceArea = 'admin' | 'client';

export interface WorkspaceFrameProps {
  area: WorkspaceArea;
  navigation: ReactNode;
  mobileNavigation: ReactNode;
  children: ReactNode;
  topContent?: ReactNode;
  rightPanel?: ReactNode;
  overlays?: ReactNode;
}

export function WorkspaceFrame({
  area, navigation, mobileNavigation, children, topContent, rightPanel, overlays,
}: WorkspaceFrameProps) {
  return (
    <div data-workspace-area={area} className="expert-workspace flex min-h-screen min-w-0 bg-[var(--workspace-bg)] text-[var(--workspace-ink)]">
      {navigation}
      <div className="flex min-w-0 flex-1 flex-col pt-[53px] pb-20 lg:pt-0 lg:pb-0">
        {topContent}
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
      {rightPanel}
      {mobileNavigation}
      {overlays}
    </div>
  );
}
