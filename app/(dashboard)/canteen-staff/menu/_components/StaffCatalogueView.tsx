"use client";

import { CatalogueGrid } from "@/components/CatalogueGrid";
import type { MenuItem } from "@/types/canteenMenuTypes";

export function StaffCatalogueView({ menuItems }: { menuItems: MenuItem[] }) {
  return <CatalogueGrid menuItems={menuItems} />;
}
