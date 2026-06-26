import { create } from 'zustand';

export interface IAddress {
  _id?: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  isDefault: boolean;
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin' | 'delivery';
  phone?: string;
  profileImage?: string;
  isVerified: boolean;
  addresses?: IAddress[];
}

interface AuthState {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: IUser, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<IUser>) => void;
  setAddresses: (addresses: IAddress[]) => void;
}

// SSR safe localStorage reading
const getInitialState = () => {
  if (typeof window === 'undefined') {
    return { user: null, token: null, isAuthenticated: false };
  }
  
  try {
    const token = localStorage.getItem('fk_token');
    const userStr = localStorage.getItem('fk_user');
    const user = userStr ? JSON.parse(userStr) : null;
    return {
      user,
      token,
      isAuthenticated: !!token && !!user
    };
  } catch {
    return { user: null, token: null, isAuthenticated: false };
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  ...getInitialState(),
  
  login: (user, token) => {
    localStorage.setItem('fk_token', token);
    localStorage.setItem('fk_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('fk_token');
    localStorage.removeItem('fk_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (updates) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, ...updates };
      localStorage.setItem('fk_user', JSON.stringify(updatedUser));
      return { user: updatedUser };
    });
  },

  setAddresses: (addresses) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, addresses };
      localStorage.setItem('fk_user', JSON.stringify(updatedUser));
      return { user: updatedUser };
    });
  }
}));
