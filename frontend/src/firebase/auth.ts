// Demo mode - using demo authentication
import { demoAuth, demoUser } from './demo-config';

// Type definitions
type User = typeof demoUser;

export const signIn = async (email: string, password: string) => {
  return await demoAuth.signIn(email, password);
};

export const signUp = async (email: string, password: string, displayName?: string) => {
  return await demoAuth.signUp(email, password, displayName);
};

export const logout = async () => {
  return await demoAuth.logout();
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return demoAuth.onAuthChange(callback);
};

export const getCurrentUser = () => {
  return demoAuth.getCurrentUser();
};
