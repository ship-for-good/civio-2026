import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, AuthResponse } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase.js'

interface AuthContextValue {
  session: Session | null | undefined
  displayName: string
  signInWithPassword: (email: string, password: string) => Promise<AuthResponse>
  signUp: (email: string, password: string, name?: string) => Promise<AuthResponse>
  signOut: () => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const displayName = session?.user?.user_metadata?.full_name ?? session?.user?.email ?? ''

  const signInWithPassword = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password })

  const signUp = (email: string, password: string, name?: string) =>
    supabase.auth.signUp({ email, password, options: name ? { data: { full_name: name } } : undefined })

  const signOut = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ session, displayName, signInWithPassword, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext) as AuthContextValue
}
