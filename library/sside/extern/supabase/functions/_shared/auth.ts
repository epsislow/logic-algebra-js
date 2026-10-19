/** Secret dedicat cron (NU anon / service_role Supabase). */
export function assertCronSecret(req: Request): Response | null {
  const expected = Deno.env.get('CRON_SECRET')?.trim();
  if (!expected) {
    return new Response(
      JSON.stringify({ ok: false, err: 'CRON_SECRET lipsește pe Edge Function' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
  const auth = req.headers.get('Authorization') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const header = req.headers.get('x-cron-secret')?.trim() || '';
  const got = bearer || header;
  if (!got || got !== expected) {
    return new Response(JSON.stringify({ ok: false, err: 'Neautorizat' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return null;
}
