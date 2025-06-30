import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, profileData: Partial<Profile>) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  debugInfo: {
    authUser: User | null
    profileData: Profile | null
    hasProfile: boolean
    authId: string | null
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Debug info to help troubleshoot
  const debugInfo = {
    authUser: user,
    profileData: profile,
    hasProfile: !!profile,
    authId: user?.id || null
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      setUser(session?.user || null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    }).catch((error) => {
      console.error('❌ Error getting initial session:', error)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      // Add a timeout to prevent infinite loading (increased to 30 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 30000)
      })
      
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any

      if (error) {
        console.error('❌ Error fetching profile:', error)
        
        // If profile doesn't exist, this might be a newly registered user
        if (error.code === 'PGRST116') {
          // Get user info from auth
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            await createMissingProfile(user)
          }
        }
        setProfile(null)
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('❌ Error in fetchProfile:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const createMissingProfile = async (user: User) => {
    try {
      
      // Create a basic profile for existing auth users
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          full_name: user.email?.split('@')[0] || 'User', // Use email prefix as name
          role: 'employee', // Default role
          department: 'General', // Default department
          job_title: 'Employee', // Default job title
          location: 'Office', // Default location
          joining_date: new Date().toISOString().split('T')[0],
          is_active: true
        })

      if (error) {
        console.error('❌ Error creating missing profile:', error)
      } else {
        // Fetch the newly created profile
        await fetchProfile(user.id)
      }
    } catch (error) {
      console.error('❌ Error in createMissingProfile:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      
      if (error) {
        console.error('❌ Sign in error:', error)
        setLoading(false)
      }
      
      return { error }
    } catch (error) {
      console.error('❌ Sign in exception:', error)
      setLoading(false)
      return { error }
    }
  }

  const signUp = async (email: string, password: string, profileData: Partial<Profile>) => {
    try {
      
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      

      if (!error && data.user) {
        
        
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email,
            ...profileData,
          })

        if (profileError) {
          console.error('❌ Error creating profile:', profileError)
          return { error: profileError }
        } else {
          
        }
      }

      return { error }
    } catch (error) {
      console.error('❌ Sign up exception:', error)
      return { error }
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      
      await supabase.auth.signOut()
      setProfile(null)
    } catch (error) {
      console.error('❌ Sign out error:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    debugInfo,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}