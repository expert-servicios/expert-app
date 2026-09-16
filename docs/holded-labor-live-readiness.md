# HLAB live smoke-test readiness

## Scope

This gate prepares KIA Holded Labor for a real company with eleven employees once the company has an active Holded integration in EXPERT.

It is intentionally read-only. No employee, contract, payroll, salary record, accounting record, or Holded configuration is modified by this procedure.

## Preconditions

Before any live test:

1. The company exists in EXPERT and the active KIA context resolves to that exact `company_id`.
2. A single active Holded `client_integrations` row exists for that company.
3. The secret is present only in `client_integration_secrets` and resolves through the canonical auth layer.
4. `permissions_enabled.laborEmployeesRead === true`.
5. `permissions_enabled.laborPayrollsRead === true`.
6. Labor write permissions remain false.
7. No fallback by `client_id`, global EXPERT credential, or MCP bridge is permitted.
8. The test period is explicitly selected before reading payrolls.

If any precondition fails, stop the live test. Do not repair production data automatically.

## Live test sequence

### A. Company boundary

- Resolve the authorized company from KIA context.
- Resolve the Holded integration server-side by `company_id` only.
- Confirm active/read-only state and effective labor permissions.

### B. Employee inventory

- Call the read-only employee list.
- Expect eleven employee records for the agreed test population.
- Do not compare or log personal identifiers in CI, source control, or application logs.
- Match live employees to the internal control sheet only in the supervised session.

### C. Per-employee chain

For each employee alias W01-W11, execute:

1. employee read;
2. active contract read;
3. schedule/hours and working-days read;
4. salary, payment periodicity and extra-payment read;
5. calculated payslips read for the selected period;
6. earnings and deductions inspection;
7. contribution-bases inspection;
8. IRPF-line evidence inspection;
9. payment-state inspection;
10. salary-records read as a separate resource;
11. `run_labor_payroll_diagnostics`.

Do not substitute salary-records for payslips and do not merge them in the diagnostic result.

## Expected diagnostic behavior

- Missing IRPF evidence is a warning and never means IRPF = 0.
- Missing contribution bases requires professional review.
- Missing active contract or failed payroll read returns insufficient data.
- Draft payroll is explicitly marked non-final.
- Pending payment is informational and separate from payroll-calculation quality.
- Malformed optional arrays are normalized to empty arrays rather than crashing the diagnostic.
- No diagnostic result is a legal payroll recalculation from first principles.

## Change-detection checks

The live session must explicitly compare the current Holded state with the internal control sheet for:

- contract type;
- active/start dates and seniority date;
- schedule hours and mode;
- professional category/job title;
- salary and extra-payment structure;
- calculated payroll presence for the selected period;
- contribution bases;
- IRPF evidence;
- separate salary-record existence.

Any mismatch is recorded for manual review. Historical financial or payroll records are never rewritten automatically.

## Abort conditions

Stop immediately if:

- the resolved integration belongs to another company;
- more than one active Holded integration creates ambiguity;
- labor read permissions are absent;
- a write capability is unexpectedly enabled or invoked;
- the employee count or identity matching is ambiguous;
- Holded returns repeated 401/403/429 responses;
- a payroll/salary-record duplicate is suspected;
- the diagnostic attempts to infer a missing legal value as zero;
- any secret or personal identifier appears in logs or source-control output.

## Evidence to retain after the supervised live test

Retain only the minimum necessary evidence:

- timestamp;
- company internal ID;
- integration internal ID if operationally needed;
- tool name and read-only result status;
- employee alias W01-W11;
- diagnostic status and finding codes;
- manual-review notes;
- no API keys, NIE/NSS, addresses, or raw payroll PDFs in repository history.

## Release gate

HLAB live readiness is considered complete only when:

- all eleven employee aliases complete the read chain;
- company isolation is demonstrated;
- payslips and salary-records remain separated;
- malformed optional payloads fail safely;
- CI typecheck, lint and tests pass;
- both Vercel projects pass;
- PR review has no unresolved P1/P2 findings;
- no DDL or production mutation was required.
