const HOLDED_V2_BASE = 'https://api.holded.com/api/v2';

export interface HoldedLaborPermissions {
  laborEmployeesRead: boolean;
  laborPayrollsRead: boolean;
  laborEmployeesWrite: false;
  laborPayrollsWrite: false;
}

async function probeRead(apiKey: string, path: string): Promise<boolean> {
  try {
    const response = await fetch(`${HOLDED_V2_BASE}${path}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(20_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * HLAB-2: detect only read capabilities. Write capabilities are deliberately
 * hard-coded to false until supervised writes are introduced in HLAB-5.
 */
export async function detectHoldedLaborPermissions(rawApiKey: string): Promise<HoldedLaborPermissions> {
  const apiKey = rawApiKey.trim();
  if (!apiKey) {
    return {
      laborEmployeesRead: false,
      laborPayrollsRead: false,
      laborEmployeesWrite: false,
      laborPayrollsWrite: false,
    };
  }

  const [laborEmployeesRead, laborPayrollsRead] = await Promise.all([
    probeRead(apiKey, '/employees?limit=1'),
    probeRead(apiKey, '/payslips?limit=1'),
  ]);

  return {
    laborEmployeesRead,
    laborPayrollsRead,
    laborEmployeesWrite: false,
    laborPayrollsWrite: false,
  };
}
