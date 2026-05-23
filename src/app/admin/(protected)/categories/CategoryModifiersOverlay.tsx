"use client";

import { AdminPanelOverlay } from "@/components/admin/AdminPanelOverlay";
import {
  CategoryModifiersPanel,
  type CategoryModifierGroupWithOptions,
} from "./CategoryModifiersPanel";

export function CategoryModifiersOverlay({
  open,
  onClose,
  categoryName,
  categoryId,
  groups,
}: {
  open: boolean;
  onClose: () => void;
  categoryName: string;
  categoryId: string;
  groups: CategoryModifierGroupWithOptions[];
}) {
  return (
    <AdminPanelOverlay
      open={open}
      onClose={onClose}
      title={`Extra opties · ${categoryName}`}
      description="Gelden voor elk product in deze categorie"
    >
      <CategoryModifiersPanel categoryId={categoryId} groups={groups} />
    </AdminPanelOverlay>
  );
}
