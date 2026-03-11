import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOwnProperty } from "@/lib/queries/retreats";
import VenueForm from "@/components/venues/VenueForm";
import type { VenueFormData } from "@/lib/constants/venue";

interface EditVenuePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EditVenuePageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { title: "Edit Property" };
  const property = await getOwnProperty(slug, user.id);
  if (!property) return { title: "Property Not Found" };
  return { title: `Edit: ${property.name} | Alignment Retreats` };
}

export default async function EditVenuePage({ params }: EditVenuePageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { slug } = await params;
  const property = await getOwnProperty(slug, user.id);
  if (!property) notFound();

  const initialData: VenueFormData & { status: string } = {
    name: property.name,
    property_type: (property.property_type as VenueFormData["property_type"]) || "",
    description: property.description || "",
    location: property.location || "",
    capacity: property.capacity,
    amenities: property.amenities,
    property_features: property.property_features,
    photos: property.photos,
    videos: property.videos,
    contact_name: property.contact_name || "",
    contact_email: property.contact_email || "",
    instagram_handle: property.instagram_handle || "",
    tiktok_handle: property.tiktok_handle || "",
    status: property.status || "draft",
  };

  return (
    <VenueForm mode="edit" propertyId={property.id} initialData={initialData} />
  );
}
