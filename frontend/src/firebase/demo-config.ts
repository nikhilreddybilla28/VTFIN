// Demo Firebase Configuration for FinQuest
// This allows the app to run without requiring Firebase setup

export const demoFirebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "finquest-demo.firebaseapp.com",
  projectId: "finquest-demo",
  storageBucket: "finquest-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id"
};

// Demo user data
export const demoUser = {
  uid: "demo-user-123",
  email: "demo@finquest.app",
  displayName: "Demo User",
  photoURL: null
};

// Demo authentication functions
export const demoAuth = {
  signIn: async (email: string, password: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email === "demo@finquest.app" && password === "demo123") {
      return { user: demoUser, error: null };
    } else {
      return { user: null, error: "Invalid credentials. Use demo@finquest.app / demo123" };
    }
  },
  
  signUp: async (email: string, password: string, displayName?: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { 
      user: { ...demoUser, email, displayName: displayName || "Demo User" }, 
      error: null 
    };
  },
  
  logout: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { error: null };
  },
  
  onAuthChange: (callback: (user: any) => void) => {
    // Simulate authentication state
    setTimeout(() => {
      callback(demoUser);
    }, 1000);
    
    return () => {}; // unsubscribe function
  },
  
  getCurrentUser: () => demoUser
};

