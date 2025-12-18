import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, RegisterCredentials } from '@/types';
import api from '@/lib/api';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  completeOnboarding: (data: Partial<User>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to map Backend User to Frontend User
  const mapBackendUser = (backendUser: any): User => ({
    id: backendUser.id,
    email: backendUser.email,
    name: backendUser.fullName || backendUser.name || 'User',
    role: backendUser.isAdmin ? 'admin' : (backendUser.isSeller ? 'seller' : 'buyer'),
    createdAt: new Date(backendUser.createdAt),
    preferredLanguage: backendUser.preferredLanguage || 'en',
    university: backendUser.university?.name,
    universityId: backendUser.university?.id || backendUser.universityId,
    degree: backendUser.degree,
    semester: backendUser.semester,
    is_seller: backendUser.role === 'seller' || backendUser.isSeller || false,
    // Add other fields as needed
  });

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/auth/me');
      if (data.success) {
        // Backend returns user without token in /me usually, 
        // we need to keep the token from localStorage if we are just refreshing
        const storedUser = localStorage.getItem('notesmarket_user');
        const token = storedUser ? JSON.parse(storedUser).token : null;

        const backendData = data.data; // backend returns user object
        const mappedUser = mapBackendUser(backendData);

        const userToStore = { ...mappedUser, token };

        setUser(mappedUser);
        localStorage.setItem('notesmarket_user', JSON.stringify(userToStore));
      }
    } catch (error) {
      console.error('Profile fetch failed:', error);
      // Don't logout immediately on fail (might be network), unless 401 (handled by interceptor)
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const storedUserStr = localStorage.getItem('notesmarket_user');
    if (storedUserStr) {
      try {
        const parsed = JSON.parse(storedUserStr);
        // We set the user part to state (ignoring the token property for type safety, 
        // though runtime it's there)
        setUser(parsed as User);
        // fetchProfile(); // Optional: validate on load
      } catch (e) {
        localStorage.removeItem('notesmarket_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/login', credentials);
      if (data.success) {
        const { accessToken: token, user: backendUser } = data.data;
        const mappedUser = mapBackendUser(backendUser);

        const userToStore = { ...mappedUser, token };

        setUser(mappedUser);
        localStorage.setItem('notesmarket_user', JSON.stringify(userToStore));
        toast.success(`Welcome back, ${mappedUser.name}!`);
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Login failed';
      toast.error(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    try {
      // Build payload - only include optional fields if they exist
      const payload: any = {
        email: credentials.email,
        password: credentials.password,
        name: credentials.name
      };

      // Add optional onboarding fields if provided
      if (credentials.degree) payload.degree = credentials.degree;
      if (credentials.collegeName) payload.collegeName = credentials.collegeName;
      if (credentials.currentSemester) payload.currentSemester = credentials.currentSemester;

      const { data } = await api.post('/auth/register', payload);

      if (data.success) {
        const { accessToken: token, user: backendUser } = data.data;
        const mappedUser = mapBackendUser(backendUser);
        const userToStore = { ...mappedUser, token };

        setUser(mappedUser);
        localStorage.setItem('notesmarket_user', JSON.stringify(userToStore));
        toast.success('Account created successfully!');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Signup failed';
      toast.error(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('notesmarket_user');
    toast.info('Logged out successfully');
  };

  const updateProfile = async (data: Partial<User>) => {
    if (user) {
      // Optimistic update
      const updated = { ...user, ...data };
      setUser(updated);

      // Update storage (keeping token)
      const stored = localStorage.getItem('notesmarket_user');
      const token = stored ? JSON.parse(stored).token : null;
      localStorage.setItem('notesmarket_user', JSON.stringify({ ...updated, token }));

      try {
        await api.put('/auth/profile', data);
        toast.success('Profile updated successfully');
      } catch (error) {
        toast.error('Failed to save profile changes');
      }
    }
  };

  const completeOnboarding = async (data: Partial<User>) => {
    await updateProfile(data);
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
        completeOnboarding,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
