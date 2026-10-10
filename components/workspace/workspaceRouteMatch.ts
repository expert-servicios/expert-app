/** Avoid prefix collisions such as /admin/kia and /admin/kia-health. */
export function isWorkspaceRouteActive(pathname: string, href: string, exact = false): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
