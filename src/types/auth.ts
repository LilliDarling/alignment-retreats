import { User, Session } from '@supabase/supabase-js';

export interface OnboardingMetadata {
  profile?: { location: string; description: string; availability: string; coopInterest?: boolean };
  host?: { expertiseAreas: string[]; minRate: number; maxRate: number };
  cohost?: { skills: string[]; availability: string; hourlyRate: number; minRate: number; maxRate: number };
  staff?: { serviceType: string; experienceYears: number; dayRate: number; availability: string; portfolioUrl: string };
  landowner?: {
    propertyName: string;
    propertyType: string;
    capacity: number;
    location: string;
    basePrice: number | null;
    minRate: number | null;
    maxRate: number | null;
    description: string;
    amenities: string[];
    contactName: string;
    contactEmail: string;
    instagramHandle: string;
    tiktokHandle: string;
    contentStatus: string;
    existingContentLink: string;
    contentDescription: string;
    interestedInResidency: boolean;
    residencyAvailableDates: string;
    propertyFeatures: string[];
  };
}

export type AppRole = 'host' | 'cohost' | 'landowner' | 'staff' | 'attendee' | 'admin';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRoles: AppRole[];
  loading: boolean;
  signUp: (email: string, password: string, name: string, userTypes: AppRole[], onboardingData?: OnboardingMetadata) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string, redirectTo?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
}


export interface EmailVerificationPendingProps {
  email: string;
  onBack?: () => void;
}
