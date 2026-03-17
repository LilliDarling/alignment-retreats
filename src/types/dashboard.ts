import { AppRole } from "./auth";

export interface DashboardProfile {
  name: string | null;
  bio: string | null;
  profile_photo: string | null;
  is_coop_member: boolean;
  onboarding_completed: Record<string, boolean> | null;
  profile_completed: boolean;
}

export interface HostRetreat {
  id: string;
  slug: string;
  title: string;
  status: string;
  retreat_type: string | null;
  start_date: string | null;
  end_date: string | null;
  max_attendees: number | null;
  price_per_person: number | null;
  main_image: string | null;
  custom_venue_name: string | null;
  created_at: string;
}

export interface DashboardProperty {
  id: string;
  name: string;
  location: string | null;
  property_type: string;
  status: string | null;
  photos: string[];
}

export interface DashboardBooking {
  id: string;
  booking_date: string;
  retreat_title: string | null;
  retreat_start: string | null;
  retreat_end: string | null;
}

export interface CohostCollaboration {
  id: string;
  role: string;
  fee_amount: number;
  fee_type: string;
  agreed: boolean;
  agreed_at: string | null;
  created_at: string;
  retreat_id: string;
  retreat_slug: string;
  retreat_title: string;
  retreat_start: string | null;
  retreat_end: string | null;
  retreat_status: string;
  retreat_location: string | null;
}

export interface DashboardData {
  profile: DashboardProfile;
  roles: AppRole[];
  hostRetreats: HostRetreat[];
  properties: DashboardProperty[];
  bookings: DashboardBooking[];
  cohostCollaborations: CohostCollaboration[];
}