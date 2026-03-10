import type { LucideIcon } from "lucide-react";
import {
  UtensilsCrossed,
  Bed,
  Car,
  Sparkles,
  TreePine,
  BookOpen,
  Phone,
  Users,
  Check,
} from "lucide-react";

export const categoryHeroColors: Record<string, string> = {
  "Leadership & Spiritual": "#1A3D25",
  "Spiritual & Mindfulness": "#2A4A3A",
  "Plant Medicine & Healing": "#1B3A20",
  "Yoga & Adventure": "#3D2E1A",
  "Breathwork & Energy": "#4A2618",
  Retreat: "#1A3D25",
};

export const ROLE_LABELS: Record<string, string> = {
  host: "Retreat Host",
  cohost: "Co-Host",
  chef: "Chef/Cook",
  photographer: "Photographer",
  videographer: "Videographer",
  yoga_instructor: "Yoga Instructor",
  meditation_guide: "Meditation Guide",
  facilitator: "Workshop Facilitator",
  massage_therapist: "Massage Therapist",
  sound_healer: "Sound Healer",
  attendee: "Retreat Attendee",
};

export function getIncludedIcon(item: string): LucideIcon {
  const lower = item.toLowerCase();
  if (
    lower.includes("meal") ||
    lower.includes("food") ||
    lower.includes("breakfast") ||
    lower.includes("lunch") ||
    lower.includes("dinner") ||
    lower.includes("dieta")
  )
    return UtensilsCrossed;
  if (
    lower.includes("accommodat") ||
    lower.includes("villa") ||
    lower.includes("lodging") ||
    lower.includes("room") ||
    lower.includes("boutique")
  )
    return Bed;
  if (
    lower.includes("transport") ||
    lower.includes("transfer") ||
    lower.includes("airport")
  )
    return Car;
  if (
    lower.includes("yoga") ||
    lower.includes("session") ||
    lower.includes("breathwork") ||
    lower.includes("ceremony") ||
    lower.includes("meditation") ||
    lower.includes("healing")
  )
    return Sparkles;
  if (
    lower.includes("nature") ||
    lower.includes("hike") ||
    lower.includes("walk") ||
    lower.includes("excursion") ||
    lower.includes("tour") ||
    lower.includes("cycling") ||
    lower.includes("vortex")
  )
    return TreePine;
  if (
    lower.includes("journal") ||
    lower.includes("kit") ||
    lower.includes("material") ||
    lower.includes("roadmap")
  )
    return BookOpen;
  if (
    lower.includes("integration") ||
    lower.includes("support") ||
    lower.includes("call") ||
    lower.includes("post-retreat")
  )
    return Phone;
  if (lower.includes("circle") || lower.includes("community"))
    return Users;
  return Check;
}
