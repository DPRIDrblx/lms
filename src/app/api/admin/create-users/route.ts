import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { users } = await request.json();

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: 'Invalid user data provided' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error: Service role key is missing.' },
        { status: 500 }
      );
    }

    // Initialize Supabase client with the service role key to bypass RLS and auth restrictions
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const results = [];
    const errors = [];

    for (const user of users) {
      const { email, password, full_name, role, class_id } = user;

      // Create the user in Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: { full_name, role }
      });

      if (authError) {
        errors.push({ email, error: authError.message });
        continue;
      }

      // We need to wait a tiny bit to ensure the trigger creates the profile, or we can just update the profile
      // But wait! If the trigger creates the profile, we might encounter a race condition if we update too fast.
      // Actually, we can update the profile directly right after.
      if (authData.user) {
        const updateData: any = {
          full_name,
          role,
          force_password_change: true
        };
        
        if (class_id && (role === 'student' || role === 'parent')) {
          updateData.class_id = class_id;
        }

        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update(updateData)
          .eq('id', authData.user.id);

        if (profileError) {
          errors.push({ email, error: 'Auth created but profile update failed: ' + profileError.message });
        } else {
          results.push({ email, id: authData.user.id });
        }
      }
    }

    return NextResponse.json({
      success: true,
      created: results.length,
      failed: errors.length,
      errors
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
