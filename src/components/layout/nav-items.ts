import {
  LayoutDashboard,
  Library,
  ListOrdered,
  FileText,
  Zap,
  Clock,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Full navigation — used by the desktop sidebar and the mobile "More" drawer. */
export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: LayoutDashboard },
  { label: "Vaults", href: "/vaults", icon: Library },
  { label: "Queue", href: "/queue", icon: ListOrdered },
  { label: "Notes", href: "/notes", icon: FileText },
  { label: "Actions", href: "/actions", icon: Zap },
  { label: "History", href: "/history", icon: Clock },
  { label: "Stats", href: "/stats", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

/** Primary tabs shown directly in the mobile bottom nav (the 5th is "More"). */
export const PRIMARY_MOBILE_HREFS = ["/", "/vaults", "/queue", "/notes"];

/** Determine whether a nav href is the active route. */
export function isActiveHref(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
