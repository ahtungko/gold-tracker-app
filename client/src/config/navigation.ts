import { Home as HomeIcon, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  path: string;
  labelKey: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { path: "/", labelKey: "prices", icon: HomeIcon },
  { path: "/tracker", labelKey: "tracker", icon: TrendingUp },
];
