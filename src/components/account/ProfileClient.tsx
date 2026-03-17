"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  MapPin,
  Briefcase,
  Award,
  Languages,
  Globe,
  Instagram,
  Pencil,
  Heart,
  DollarSign,
  ImageIcon,
  ArrowLeft,
  Plane,
  Camera,
  X,
  Eye,
} from "lucide-react";
import BasicInfoForm from "@/components/account/sections/BasicInfoForm";
import ProfessionalForm from "@/components/account/sections/ProfessionalForm";
import AboutForm from "@/components/account/sections/AboutForm";
import SocialLinksForm from "@/components/account/sections/SocialLinksForm";
import RatesForm from "@/components/account/sections/RatesForm";
import PortfolioForm from "@/components/account/sections/PortfolioForm";
import { uploadProfilePhoto } from "@/lib/utils/upload";
import { updateBasicInfo } from "@/lib/actions/profile";
import type { EditableProfile } from "@/types/profile";

type Section = "basic" | "professional" | "about" | "social" | "rates" | "portfolio" | null;

interface ProfileClientProps {
  profile: EditableProfile;
}

export default function ProfileClient({ profile: initialProfile }: ProfileClientProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [editingSection, setEditingSection] = useState<Section>(null);
  const [uploading, setUploading] = useState<"cover" | "avatar" | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleSaved = () => {
    setEditingSection(null);
    window.location.reload();
  };

  const handleCancel = () => {
    setEditingSection(null);
  };

  const handleCoverUpload = async (file: File) => {
    setUploading("cover");
    const result = await uploadProfilePhoto(profile.id, file);
    if (!("error" in result)) {
      setProfile((p) => ({ ...p, cover_photo: result.url }));
      await updateBasicInfo({
        name: profile.name || "",
        bio: profile.bio,
        location: profile.location,
        profile_photo: profile.profile_photo,
        cover_photo: result.url,
      });
    }
    setUploading(null);
  };

  const handleAvatarUpload = async (file: File) => {
    setUploading("avatar");
    const result = await uploadProfilePhoto(profile.id, file);
    if (!("error" in result)) {
      setProfile((p) => ({ ...p, profile_photo: result.url }));
      await updateBasicInfo({
        name: profile.name || "",
        bio: profile.bio,
        location: profile.location,
        profile_photo: result.url,
        cover_photo: profile.cover_photo,
      });
    }
    setUploading(null);
  };

  const handleRemoveCover = async () => {
    setProfile((p) => ({ ...p, cover_photo: null }));
    await updateBasicInfo({
      name: profile.name || "",
      bio: profile.bio,
      location: profile.location,
      profile_photo: profile.profile_photo,
      cover_photo: null,
    });
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-2xl font-display text-foreground">My Profile</h1>
        </div>
        <Link
          href={`/profile/${profile.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          <Eye className="w-4 h-4" />
          View Public Profile
        </Link>
      </div>

      {/* Cover + Avatar Header — directly editable */}
      <div className="relative mb-16">
        {/* Cover photo */}
        <div
          className="relative h-48 sm:h-56 rounded-[16px] overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-muted cursor-pointer group"
          onClick={() => coverInputRef.current?.click()}
        >
          {profile.cover_photo ? (
            <>
              <Image src={profile.cover_photo} alt="Cover" fill className="object-cover" sizes="100vw" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleRemoveCover(); }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors z-10 opacity-0 group-hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : null}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-4 h-4" />
              {profile.cover_photo ? "Change cover" : "Add cover photo"}
            </div>
          </div>
          {uploading === "cover" && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0])}
        />

        {/* Avatar */}
        <div className="absolute -bottom-12 left-6 z-10">
          <div
            className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-white bg-muted shadow-lg cursor-pointer group"
            onClick={() => avatarInputRef.current?.click()}
          >
            {profile.profile_photo ? (
              <Image
                src={profile.profile_photo}
                alt={profile.name || "Profile"}
                width={112}
                height={112}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-2xl font-bold">
                {profile.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors rounded-full">
              <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {uploading === "avatar" && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content — left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <ProfileSection
            title="Basic Info"
            icon={<User className="w-4 h-4" />}
            onEdit={() => setEditingSection("basic")}
            editing={editingSection === "basic"}
          >
            {editingSection === "basic" ? (
              <BasicInfoForm profile={profile} onSaved={handleSaved} onCancel={handleCancel} />
            ) : (
              <div className="space-y-2">
                <p className="text-lg font-display text-foreground">{profile.name || "No name set"}</p>
                {profile.location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> {profile.location}
                  </p>
                )}
                {profile.bio ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{profile.bio}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No bio yet</p>
                )}
              </div>
            )}
          </ProfileSection>

          {/* About */}
          <ProfileSection
            title="About & Availability"
            icon={<Heart className="w-4 h-4" />}
            onEdit={() => setEditingSection("about")}
            editing={editingSection === "about"}
          >
            {editingSection === "about" ? (
              <AboutForm profile={profile} onSaved={handleSaved} onCancel={handleCancel} />
            ) : (
              <div className="space-y-3">
                {profile.what_i_offer && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">What I Offer</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{profile.what_i_offer}</p>
                  </div>
                )}
                {profile.what_im_looking_for && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Looking For</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{profile.what_im_looking_for}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {profile.availability_status && (
                    <span className="px-2.5 py-1 bg-primary/5 text-primary text-xs font-medium rounded-full capitalize">
                      {profile.availability_status.replace(/_/g, " ")}
                    </span>
                  )}
                  {profile.travel_willing && (
                    <span className="flex items-center gap-1 text-xs">
                      <Plane className="w-3.5 h-3.5" /> Willing to travel
                    </span>
                  )}
                </div>
                {!profile.what_i_offer && !profile.what_im_looking_for && !profile.availability_status && (
                  <p className="text-sm text-muted-foreground italic">Not filled in yet</p>
                )}
              </div>
            )}
          </ProfileSection>

          {/* Professional */}
          <ProfileSection
            title="Professional"
            icon={<Briefcase className="w-4 h-4" />}
            onEdit={() => setEditingSection("professional")}
            editing={editingSection === "professional"}
          >
            {editingSection === "professional" ? (
              <ProfessionalForm profile={profile} onSaved={handleSaved} onCancel={handleCancel} />
            ) : (
              <div className="space-y-3">
                {profile.expertise_areas && profile.expertise_areas.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Expertise</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.expertise_areas.map((area) => (
                        <span key={area} className="px-2.5 py-1 bg-primary/5 text-primary text-xs font-medium rounded-full">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {profile.certifications && profile.certifications.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" /> Certifications
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.certifications.map((cert) => (
                        <span key={cert} className="px-2.5 py-1 border border-border text-muted-foreground text-xs rounded-full">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {profile.languages && profile.languages.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                      <Languages className="w-3.5 h-3.5" /> Languages
                    </p>
                    <p className="text-sm text-muted-foreground">{profile.languages.join(", ")}</p>
                  </div>
                )}
                {profile.years_experience != null && (
                  <p className="text-sm text-muted-foreground">
                    {profile.years_experience}+ years of experience
                  </p>
                )}
                {!profile.expertise_areas?.length && !profile.certifications?.length && !profile.languages?.length && profile.years_experience == null && (
                  <p className="text-sm text-muted-foreground italic">Not filled in yet</p>
                )}
              </div>
            )}
          </ProfileSection>

          {/* Portfolio */}
          <ProfileSection
            title="Portfolio"
            icon={<ImageIcon className="w-4 h-4" />}
            onEdit={() => setEditingSection("portfolio")}
            editing={editingSection === "portfolio"}
          >
            {editingSection === "portfolio" ? (
              <PortfolioForm profile={profile} onSaved={handleSaved} onCancel={handleCancel} />
            ) : (
              <div>
                {(profile.portfolio_photos?.length || 0) + (profile.portfolio_videos?.length || 0) > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {(profile.portfolio_photos || []).map((url) => (
                      <div key={url} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                        <Image src={url} alt="Portfolio" fill className="object-cover" sizes="150px" />
                      </div>
                    ))}
                    {(profile.portfolio_videos || []).map((url) => (
                      <div key={url} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                        <video src={url} className="w-full h-full object-cover" muted playsInline />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                            <div className="w-0 h-0 border-l-[8px] border-l-white border-y-[5px] border-y-transparent ml-0.5" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No portfolio media yet</p>
                )}
              </div>
            )}
          </ProfileSection>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Social Links */}
          <ProfileSection
            title="Social & Links"
            icon={<Globe className="w-4 h-4" />}
            onEdit={() => setEditingSection("social")}
            editing={editingSection === "social"}
          >
            {editingSection === "social" ? (
              <SocialLinksForm profile={profile} onSaved={handleSaved} onCancel={handleCancel} />
            ) : (
              <div className="flex flex-col gap-2">
                {profile.instagram_handle && (
                  <a
                    href={`https://instagram.com/${profile.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Instagram className="w-4 h-4" />
                    @{profile.instagram_handle}
                  </a>
                )}
                {profile.tiktok_handle && (
                  <a
                    href={`https://tiktok.com/@${profile.tiktok_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    @{profile.tiktok_handle}
                  </a>
                )}
                {profile.website_url && (
                  <a
                    href={profile.website_url.match(/^https?:\/\//) ? profile.website_url : `https://${profile.website_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    Website
                  </a>
                )}
                {!profile.instagram_handle && !profile.tiktok_handle && !profile.website_url && (
                  <p className="text-sm text-muted-foreground italic">No links added yet</p>
                )}
              </div>
            )}
          </ProfileSection>

          {/* Rates */}
          <ProfileSection
            title="Rates"
            icon={<DollarSign className="w-4 h-4" />}
            onEdit={() => setEditingSection("rates")}
            editing={editingSection === "rates"}
          >
            {editingSection === "rates" ? (
              <RatesForm profile={profile} onSaved={handleSaved} onCancel={handleCancel} />
            ) : (
              <div className="space-y-3">
                {profile.rate != null ? (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Per Person</p>
                    <p className="text-foreground font-semibold">
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: profile.rate_currency || "USD" }).format(profile.rate)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No rate set</p>
                )}
              </div>
            )}
          </ProfileSection>
        </div>
      </div>
    </main>
  );
}

function ProfileSection({
  title,
  icon,
  onEdit,
  editing,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  onEdit: () => void;
  editing: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-[16px] border border-border p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          {icon}
          {title}
        </h2>
        {!editing && (
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
