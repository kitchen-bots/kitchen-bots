export function getPortalUrl(configuredUrl: string | undefined): string {
  const portalUrl = configuredUrl?.trim();
  return portalUrl || '/login';
}
