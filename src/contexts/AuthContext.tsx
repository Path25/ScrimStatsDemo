import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User, AuthError, AuthChangeEvent } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  ign: string | null;
  full_name: string | null;
  created_at?: string;
  updated_at?: string;
}

export type AppRole = 'admin' | 'coach' | 'player';

export interface UserRole {
  role: AppRole;
  id?: string;
  user_id?: string;
  created_at?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignUpCredentials {
  email: string;
  password: string;
  data?: { full_name?: string; ign?: string | null };
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: UserRole[];
  authLoading: boolean;
  profileLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ error: AuthError | null }>;
  signUp: (credentials: SignUpCredentials) => Promise<{ error: AuthError | null; data: { user: User | null; session: Session | null; } }>;
  logout: () => Promise<{ error: AuthError | null }>;
  isAdmin: boolean;
  isCoach: boolean;
  isPlayer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchUserProfileAndRoles = useCallback(async (userId: string | null) => {
    if (!userId) {
      setProfile(null);
      setRoles([]);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error("Auth (Supabase): Error fetching profile:", profileError.message);
      } else if (profileData) {
        setProfile(profileData as Profile);

        // Update last_login_at when profile is successfully fetched
        await supabase
          .from('profiles')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', userId);
      } else {
        setProfile(null);
      }

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) {
        console.error("Auth (Supabase): Error fetching roles:", rolesError.message);
      } else if (rolesData) {
        setRoles(rolesData as UserRole[]);
      } else {
        setRoles([]);
      }
    } catch (e: any) {
      console.error("Auth (Supabase): Unexpected error fetching profile/roles:", e.message);
      setProfile(null);
      setRoles([]);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Effect 1: Initial Authentication State Check (runs once)
  useEffect(() => {
    setAuthLoading(true);

    const initializeSession = async () => {
      let currentSessionUser: User | null = null;
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("AuthProvider EFFECT (InitialLoad): Error in getSession:", sessionError.message);
        }

        setSession(currentSession);
        currentSessionUser = currentSession?.user ?? null;
        setUser(currentSessionUser);

        setUser(currentSessionUser);

        setAuthLoading(false); // MODIFIED: Set authLoading false here

        if (currentSessionUser) {
          // Call fetchUserProfileAndRoles, but don't necessarily await it here
          // as authLoading is already false. Let profileLoading handle its state.
          fetchUserProfileAndRoles(currentSessionUser.id);
        } else {
          // Ensure profile/roles/profileLoading are reset if no user
          fetchUserProfileAndRoles(null); // This will set profile/roles to null and profileLoading to false
        }
      } catch (error: any) {
        console.error("AuthProvider EFFECT (InitialLoad): Error during initial auth setup:", error.message);
        setSession(null);
        setUser(null);
        fetchUserProfileAndRoles(null); // Reset profile state
        setAuthLoading(false); // Ensure authLoading is false even on error
      }
      // Removed finally block for setAuthLoading(false) as it's handled earlier or in catch.
    };

    initializeSession();
  }, [fetchUserProfileAndRoles]); // fetchUserProfileAndRoles is stable

  // Effect 2: Auth State Change Listener (runs once to subscribe)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, newSession: Session | null) => {
      setSession(newSession);
      const newUser = newSession?.user ?? null;
      setUser(newUser);

      if (event === 'SIGNED_OUT') {
        fetchUserProfileAndRoles(null);
      } else if (newUser) {
        fetchUserProfileAndRoles(newUser.id);
      } else if (!newUser) {
        fetchUserProfileAndRoles(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchUserProfileAndRoles]);



  const login = useCallback(async (credentials: LoginCredentials) => {
    setAuthLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword(credentials);
    // onAuthStateChange will handle fetching profile/roles.
    // Set authLoading to false after the operation. If there's an error,
    // it will be caught by onAuthStateChange as well if session becomes null.
    // If successful, onAuthStateChange gets SIGNED_IN.
    setAuthLoading(false);
    if (error) {
      console.error("Auth (Supabase): Login error:", error.message);
      return { error };
    }
    return { error: null };
  }, []);

  const signUp = useCallback(async (credentials: SignUpCredentials) => {
    setAuthLoading(true);
    const { email, password, data: optionsData } = credentials;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: optionsData
      }
    });
    setAuthLoading(false);
    if (error) {
      console.error("Auth (Supabase): SignUp error:", error.message);
      return { error, data: { user: null, session: null } };
    }
    return { error: null, data: { user: data.user, session: data.session } };
  }, []);

  const logout = useCallback(async () => {
    setAuthLoading(true);
    const { error } = await supabase.auth.signOut();
    // onAuthStateChange with 'SIGNED_OUT' event will clear user, session, profile, roles
    // and also set profileLoading to false (via fetchUserProfileAndRoles(null)).
    setAuthLoading(false);
    if (error) {
      console.error("Auth (Supabase): Logout error:", error.message);
    }
    return { error };
  }, []);

  const isAdmin = useMemo(() => roles.some(r => r.role === 'admin'), [roles]);
  const isCoach = useMemo(() => roles.some(r => r.role === 'coach'), [roles]);
  const isPlayer = useMemo(() => roles.some(r => r.role === 'player'), [roles]);

  const authContextValue = useMemo(() => ({
    session,
    user,
    profile,
    roles,
    authLoading,
    profileLoading,
    login,
    signUp,
    logout,
    isAdmin,
    isCoach,
    isPlayer,
  }), [
    session, user, profile, roles, authLoading, profileLoading,
    login, signUp, logout,
    isAdmin, isCoach, isPlayer
  ]);



  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
