import { NextResponse } from 'next/server';
import { WorkError } from './work-auth';

export function workErrorResponse(error: unknown) {
  return NextResponse.json({ error: error instanceof WorkError ? error.code : 'work_unavailable' },
    { status: error instanceof WorkError ? error.status : 503, headers: { 'Cache-Control': 'no-store' } });
}
export function workRpcError(error: { message: string }) {
  const code = error.message.match(/\bwork_[a-z_]+\b/)?.[0];
  return new WorkError(code ?? 'work_unavailable', code ? 409 : 503);
}
