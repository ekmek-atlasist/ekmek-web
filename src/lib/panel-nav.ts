import {
  Briefcase,
  Building2,
  LayoutDashboard,
  MessageSquare,
  Users,
  type LucideIcon,
} from "lucide-react";

export type PanelNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact: boolean;
};

export const PANEL_NAV_ITEMS: PanelNavItem[] = [
  { href: "/isveren/panel", label: "Özet", icon: LayoutDashboard, exact: true },
  {
    href: "/isveren/panel/ilanlar",
    label: "İlanlarım",
    icon: Briefcase,
    exact: false,
  },
  {
    href: "/isveren/panel/basvurular",
    label: "Başvurular",
    icon: Users,
    exact: false,
  },
  {
    href: "/isveren/panel/mesajlar",
    label: "Mesajlar",
    icon: MessageSquare,
    exact: false,
  },
  {
    href: "/isveren/panel/profil",
    label: "Profilim",
    icon: Building2,
    exact: false,
  },
];

export function isPanelNavActive(
  pathname: string,
  href: string,
  exact: boolean,
): boolean {
  if (exact) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
