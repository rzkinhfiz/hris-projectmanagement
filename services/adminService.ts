'use server';

import { createClient } from '@supabase/supabase-js';
import type { UserRole } from '@/types';
import { createAuditLog } from './auditService';

interface AdminCreateUserPayload {
  email: string;
  fullName: string;
  phoneNumber?: string;
  password?: string;
  role: UserRole;
}

export async function adminCreateUser(payload: AdminCreateUserPayload) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase Server configuration is missing.');
    }

    // Initialize Admin Client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const createParams: any = {
      email: payload.email,
      email_confirm: true,
      user_metadata: {
        full_name: payload.fullName
      }
    };

    if (payload.password) {
      createParams.password = payload.password;
    }

    // 1. Create User in Auth system
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser(createParams);

    if (authError) {
      throw new Error(`Auth Error: ${authError.message}`);
    }

    const userId = authData.user.id;

    // 2. Upsert Profile
    // We update the profile that might have been created by a trigger, 
    // or insert it if no trigger exists.
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        full_name: payload.fullName,
        phone_number: payload.phoneNumber || null,
        role: payload.role,
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      // Rollback is complex in Supabase, but we can attempt to delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(`Profile Error: ${profileError.message}`);
    }

    // 3. Audit Log
    // Since this is a server action, we might not easily have the current user's ID
    // without reading cookies. But we can tag it [ADMIN_ACTION].
    await supabaseAdmin.from('audit_logs').insert({
      entity: 'User Management',
      entity_id: userId,
      action: 'ADMIN_CREATE_USER',
      performed_by: null, // We could pass admin ID if we want, but null is fine for system action
      details: JSON.stringify({
        description: `[ADMIN_ACTION] Akun baru ${payload.email} dengan role ${payload.role} telah dibuat.`,
        email: payload.email,
        role: payload.role
      })
    });

    return { success: true, data: authData.user };
  } catch (error: any) {
    console.error('adminCreateUser failed:', error);
    return { success: false, error: error.message || 'Failed to create user' };
  }
}

interface AdminUpdateUserPayload {
  fullName?: string;
  phoneNumber?: string;
  role?: UserRole;
}

export async function adminUpdateUser(userId: string, payload: AdminUpdateUserPayload) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase Server configuration is missing.');
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const updateData: any = { updated_at: new Date().toISOString() };
    if (payload.fullName !== undefined) updateData.full_name = payload.fullName;
    if (payload.phoneNumber !== undefined) updateData.phone_number = payload.phoneNumber;
    if (payload.role !== undefined) updateData.role = payload.role;

    // Update Profile
    const { data, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (profileError) {
      throw new Error(`Profile Error: ${profileError.message}`);
    }

    // Audit Log
    await supabaseAdmin.from('audit_logs').insert({
      entity: 'User Management',
      entity_id: userId,
      action: 'ADMIN_UPDATE_USER',
      performed_by: null, 
      details: JSON.stringify({
        description: `[ADMIN_ACTION] Profil user telah diperbarui.`,
        updated_fields: Object.keys(payload).join(', ')
      })
    });

    return { success: true, data };
  } catch (error: any) {
    console.error('adminUpdateUser failed:', error);
    return { success: false, error: error.message || 'Failed to update user' };
  }
}

export async function checkUserActiveAssignments(userId: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase Server configuration is missing.');
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const [projectsRes, tasksRes] = await Promise.all([
      supabaseAdmin.from('projects').select('id, name').eq('pm_id', userId),
      supabaseAdmin.from('tasks').select('id, name').eq('owner_id', userId).in('status', ['To do', 'In progress'])
    ]);

    return {
      success: true,
      activeProjects: projectsRes.data || [],
      activeTasks: tasksRes.data || []
    };
  } catch (error: any) {
    console.error('checkUserActiveAssignments failed:', error);
    return { success: false, error: error.message || 'Failed to check user assignments' };
  }
}

export async function adminTransferAndDeactivateUser(oldUserId: string, newUserId: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase Server configuration is missing.');
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 1. Transfer projects
    const { error: projError } = await supabaseAdmin.from('projects')
      .update({ pm_id: newUserId })
      .eq('pm_id', oldUserId);
      
    if (projError) throw new Error(`Transfer Projects Error: ${projError.message}`);

    // 2. Transfer tasks
    const { error: taskError } = await supabaseAdmin.from('tasks')
      .update({ owner_id: newUserId })
      .eq('owner_id', oldUserId)
      .in('status', ['To do', 'In progress']);

    if (taskError) throw new Error(`Transfer Tasks Error: ${taskError.message}`);

    // 3. Perform Deactivation
    return await adminDeleteUser(oldUserId);
  } catch (error: any) {
    console.error('adminTransferAndDeactivateUser failed:', error);
    return { success: false, error: error.message || 'Failed to transfer and deactivate user' };
  }
}

export async function adminDeleteUser(userId: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase Server configuration is missing.');
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      throw new Error(`Auth Error: ${authError.message}`);
    }

    // Soft delete profile instead of hard delete
    await supabaseAdmin.from('profiles').update({ status: 'INACTIVE' }).eq('id', userId);

    await supabaseAdmin.from('audit_logs').insert({
      entity: 'User Management',
      entity_id: userId,
      action: 'ADMIN_DELETE_USER',
      performed_by: null, 
      details: JSON.stringify({
        description: `[ADMIN_ACTION] Admin menonaktifkan akun user dan mencabut akses loginnya.`
      })
    });

    return { success: true };
  } catch (error: any) {
    console.error('adminDeleteUser failed:', error);
    return { success: false, error: error.message || 'Failed to delete user' };
  }
}
