"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Plus, X, ImageIcon, Film } from "lucide-react";
import { uploadPortfolioMedia, deleteStorageFile, validateFile, getMediaType } from "@/lib/utils/upload";
import { updatePortfolio } from "@/lib/actions/profile";
import type { EditableProfile } from "@/types/profile";

interface PortfolioFormProps {
  profile: EditableProfile;
  onSaved?: () => void;
  onCancel?: () => void;
}

export default function PortfolioForm({ profile, onSaved, onCancel }: PortfolioFormProps) {
  const [photos, setPhotos] = useState<string[]>(profile.portfolio_photos || []);
  const [videos, setVideos] = useState<string[]>(profile.portfolio_videos || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    setError(null);

    for (const file of Array.from(files)) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        continue;
      }

      const result = await uploadPortfolioMedia(profile.id, file);
      if ("error" in result) {
        setError(result.error);
      } else if (result.type === "image") {
        setPhotos((prev) => [...prev, result.url]);
      } else {
        setVideos((prev) => [...prev, result.url]);
      }
    }

    setUploading(false);
  };

  const removePhoto = async (url: string) => {
    setPhotos((prev) => prev.filter((p) => p !== url));
    await deleteStorageFile("portfolio-media", url);
  };

  const removeVideo = async (url: string) => {
    setVideos((prev) => prev.filter((v) => v !== url));
    await deleteStorageFile("portfolio-media", url);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const result = await updatePortfolio({
      portfolio_photos: photos,
      portfolio_videos: videos,
    });
    if (result.error) {
      setError(result.error);
    } else {
      onSaved?.();
    }
    setSaving(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/30 transition-colors"
      >
        <div className="flex justify-center gap-3 mb-3 text-muted-foreground">
          <ImageIcon className="w-6 h-6" />
          <Film className="w-6 h-6" />
        </div>
        <p className="text-sm text-muted-foreground mb-1">
          Drag & drop photos or videos here, or
        </p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
        >
          {uploading ? "Uploading..." : "browse files"}
        </button>
        <p className="text-xs text-muted-foreground mt-2">
          JPEG, PNG, WebP, GIF, MP4, WebM, MOV. Max 50MB per file.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Uploading...
        </div>
      )}

      {/* Photos Grid */}
      {photos.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Photos ({photos.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((url) => (
              <div key={url} className="relative aspect-square rounded-xl overflow-hidden bg-muted group">
                <Image src={url} alt="Portfolio" fill className="object-cover" sizes="200px" />
                <button
                  type="button"
                  onClick={() => removePhoto(url)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Videos List */}
      {videos.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Film className="w-4 h-4" />
            Videos ({videos.length})
          </h4>
          <div className="space-y-3">
            {videos.map((url) => (
              <div key={url} className="relative rounded-xl overflow-hidden bg-muted group">
                <video
                  src={url}
                  className="w-full aspect-video object-cover"
                  controls
                  playsInline
                  muted
                />
                <button
                  type="button"
                  onClick={() => removeVideo(url)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {photos.length === 0 && videos.length === 0 && !uploading && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No portfolio media yet. Upload photos and videos to showcase your work.
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || uploading}
          className="px-6 py-2.5 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
