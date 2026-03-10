import { VenuePreview } from "@/lib/queries/retreats";
import { Retreat } from "@/lib/types";

export interface NavbarUser {
  email: string;
  fullName: string | null;
  roles: string[];
  avatarUrl: string | null;
  isCoopMember: boolean;
}

export interface NavbarProps {
  user?: NavbarUser | null;
  featuredRetreats?: Retreat[];
  featuredVenues?: VenuePreview[];
  categories?: string[];
}

export interface PageHeroProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  compact?: boolean;
  children?: React.ReactNode;
}

export interface UserMenuProps {
  user: {
    email: string;
    fullName: string | null;
    roles: string[];
    avatarUrl: string | null;
    isCoopMember: boolean;
  };
  scrolled: boolean;
}