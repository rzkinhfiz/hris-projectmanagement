import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type SeedUser = { email: string; password: string; role: 'pmo' | 'project_manager' | 'project_team' }

export async function POST(req: Request) {
  try {
    const body = await req.json() as { users?: SeedUser[] }
    const users = body.users ?? []


    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const seedApiKey = process.env.SEED_API_KEY

    // Safety: allow only in development or when correct SEED_API_KEY header provided
    const headerSeedKey = (req.headers.get('x-seed-key') ?? '')
    if (process.env.NODE_ENV !== 'development' && (!seedApiKey || headerSeedKey !== seedApiKey)) {
      return NextResponse.json({ error: 'Seed endpoint disabled in this environment' }, { status: 403 })
    }

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL' }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey)

    const results: Array<{ email: string; success: boolean; message?: string }> = []

    for (const user of users) {
      // Create user via admin API and set email confirmed
      const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      } as any)

      if (createError) {
        // If user already exists, try to fetch the user by email
        const existing = await supabaseAdmin.auth.admin.listUsers({})
        // `existing.data` can be { users: [...] } or an array directly depending on SDK/response
        const usersArray: any[] = Array.isArray(existing.data)
          ? existing.data
          : (existing.data && Array.isArray((existing.data as any).users) ? (existing.data as any).users : []);

        const found = usersArray.find((u: any) => u.email === user.email);

        if (found) {
          // Update profiles table role if possible
          await supabaseAdmin
            .from('profiles')
            .update({ role: user.role })
            .eq('id', found.id)

          results.push({ email: user.email, success: true, message: 'Already existed; role updated' })
          continue
        }

        results.push({ email: user.email, success: false, message: createError.message })
        continue
      }

      // Insert or update profile role
      // `createdUser` may be the user object or a wrapper; normalize
      const created = (createdUser as any)?.user ?? createdUser;
      const userId = created?.id ?? null;
      if (userId) {
        await supabaseAdmin
          .from('profiles')
          .upsert({ id: userId, role: user.role })
          .select()
      }

      results.push({ email: user.email, success: true })
    }

    return NextResponse.json({ results })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
