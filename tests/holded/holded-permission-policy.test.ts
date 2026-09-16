import { describe, expect, it } from 'vitest';
import {
  createEmptyHoldedPermissions,
  intersectHoldedReadPermissions,
  normalizeDetectedHoldedPermissions,
} from '@/lib/integrations/holded/holded-permissions';

describe('Holded effective permission policy', () => {
  it('never enables a capability that Holded did not detect', () => {
    const detected = createEmptyHoldedPermissions();
    detected.salesInvoices = true;

    const requested = createEmptyHoldedPermissions();
    requested.salesInvoices = true;
    requested.laborEmployeesRead = true;

    const effective = intersectHoldedReadPermissions(detected, requested);
    expect(effective.salesInvoices).toBe(true);
    expect(effective.laborEmployeesRead).toBe(false);
  });

  it('requires explicit consent for detected labor reads', () => {
    const detected = createEmptyHoldedPermissions();
    detected.laborEmployeesRead = true;
    detected.laborPayrollsRead = true;

    const effective = intersectHoldedReadPermissions(detected, createEmptyHoldedPermissions());
    expect(effective.laborEmployeesRead).toBe(false);
    expect(effective.laborPayrollsRead).toBe(false);
  });

  it('drops a previously enabled read when the current key no longer exposes it', () => {
    const previous = createEmptyHoldedPermissions();
    previous.laborPayrollsRead = true;

    const currentDetected = createEmptyHoldedPermissions();
    const effective = intersectHoldedReadPermissions(currentDetected, previous);
    expect(effective.laborPayrollsRead).toBe(false);
  });

  it('forces every write capability off during normalization and intersection', () => {
    const detected = normalizeDetectedHoldedPermissions({
      salesInvoices: true,
      writeInbox: true,
      laborEmployeesWrite: true,
      laborPayrollsWrite: true,
    });
    expect(detected.writeInbox).toBe(false);
    expect(detected.laborEmployeesWrite).toBe(false);
    expect(detected.laborPayrollsWrite).toBe(false);

    const effective = intersectHoldedReadPermissions(detected, detected);
    expect(effective.writeInbox).toBe(false);
    expect(effective.laborEmployeesWrite).toBe(false);
    expect(effective.laborPayrollsWrite).toBe(false);
  });
});
