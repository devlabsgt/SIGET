"use client";

import ImageUploader from "./ImageUploader";
import { updateOrganizacionLogo } from "@/components/(SIGET)/observatorio/forms/lib/actions";

interface OrgLogoCellProps {
  orgId: string;
  logoPath: string | null;
  onUpdated: () => void | Promise<void>;
  compactClassName?: string;
}

export default function OrgLogoCell({ orgId, logoPath, onUpdated, compactClassName }: OrgLogoCellProps) {
  return (
    <ImageUploader
      compact
      compactClassName={compactClassName}
      currentImagePath={logoPath}
      aspectLabel="Logo · proporción libre"
      onUploadSuccess={async (newPath) => {
        await updateOrganizacionLogo(orgId, newPath);
        await onUpdated();
      }}
      onDeleteSuccess={async () => {
        await updateOrganizacionLogo(orgId, null);
        await onUpdated();
      }}
    />
  );
}
