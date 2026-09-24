import { NextResponse } from 'next/server';
import { WorkError } from './work-auth';

export function workErrorResponse(error: unknown) {
  return NextResponse.json({ error: error instanceof WorkError ? error.code : 'work_unavailable' },
    { status: error instanceof WorkError ? error.status : 503, headers: { 'Cache-Control': 'no-store' } });
}

export function workRpcError(error: { message: string }) {
  const code = error.message.match(/\bwork_[a-z_]+\b/)?.[0];
  if (!code) return new WorkError('work_unavailable', 503);

  const status = code === 'work_unauthorized'
    ? 401
    : ['work_forbidden', 'work_task_not_authorized'].includes(code)
      ? 403
      : 409;
  return new WorkError(code, status);
}
