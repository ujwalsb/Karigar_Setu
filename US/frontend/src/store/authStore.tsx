import React, { createContext, useContext, useReducer, useEffect } from 'react'
import type { User, AuthState } from '@/types'
import { authApi } from '@/api/auth'

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User }
  | { type: 'CLEAR_USER' }
  | { type: 'UPDATE_USER'; payload: Partial<User> }

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: true, isLoading: false }
    case 'CLEAR_USER':
      return { user: null, isAuthenticated: false, isLoading: false }
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      }
    default:
      return state
  }
}

interface AuthContextValue extends AuthState {
  login: (user: User) => void
  logout: () => Promise<void>
  updateUser: (data: Partial<User>) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })

  useEffect(() => {
    // Try to get current user on mount
    authApi
      .getMe()
      .then((res: any) => {
        const u = res.data?.data?.user || res.data?.data
        if (u && (u.id || u.email)) {
          dispatch({ type: 'SET_USER', payload: u })
        } else {
          dispatch({ type: 'CLEAR_USER' })
        }
      })
      .catch(() => {
        dispatch({ type: 'CLEAR_USER' })
      })
  }, [])

  const login = (user: any) => {
    if (user.token) {
      localStorage.setItem('us_token', user.token)
    }
    dispatch({ type: 'SET_USER', payload: user })
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('us_token')
      dispatch({ type: 'CLEAR_USER' })
      window.location.href = '/login'
    }
  }

  const updateUser = (data: Partial<User>) => {
    dispatch({ type: 'UPDATE_USER', payload: data })
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

