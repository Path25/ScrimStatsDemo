/** Matches the role enum enforced by the live `tenant_users` table. */
export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface UserProfile {
    id: string;
    user_id: string;
    tenant_id: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    riot_ign: string | null;
    game_role: 'top' | 'jungle' | 'mid' | 'adc' | 'support' | 'coach' | 'analyst' | 'manager' | null;
    created_at: string;
    updated_at: string;
}
