import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    error: 'Las suscripciones se formalizan individualmente por entidad fiscal.',
    code: 'subscription_cart_disabled',
  }, { status: 410 });
}
