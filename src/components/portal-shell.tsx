"use client";

import {
  BadgeIndianRupee,
  BookOpenCheck,
  Cake,
  CalendarDays,
  ChevronLeft,
  CircleUserRound,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  Home,
  IdCard,
  LogOut,
  Menu,
  Settings,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { UserRole } from "@/db/schema";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";

const iconMap = {
  home: Home,
  students: GraduationCap,
  tutors: UsersRound,
  batches: CalendarDays,
  attendance: ClipboardCheck,
  fees: BadgeIndianRupee,
  cards: IdCard,
  birthdays: Cake,
  profile: CircleUserRound,
  settings: Settings,
  schedule: BookOpenCheck,
  receipts: CreditCard,
};
type IconName = keyof typeof iconMap;
type Item = { label: string; href: string; icon: IconName; mobile?: boolean };

const navigation: Record<UserRole, Item[]> = {
  admin: [
    { label: "Home", href: "/admin", icon: "home", mobile: true },
    {
      label: "Students",
      href: "/admin/students",
      icon: "students",
      mobile: true,
    },
    { label: "Tutors", href: "/admin/tutors", icon: "tutors" },
    { label: "Batches", href: "/admin/batches", icon: "batches" },
    {
      label: "Attendance",
      href: "/admin/attendance",
      icon: "attendance",
      mobile: true,
    },
    { label: "Fees", href: "/admin/fees", icon: "fees", mobile: true },
    { label: "ID cards", href: "/admin/id-cards", icon: "cards" },
    { label: "Birthdays", href: "/admin/birthdays", icon: "birthdays" },
    { label: "Settings", href: "/admin/settings", icon: "settings" },
  ],
  tutor: [
    { label: "Home", href: "/tutor", icon: "home", mobile: true },
    { label: "Batches", href: "/tutor/batches", icon: "batches", mobile: true },
    {
      label: "Attendance",
      href: "/tutor/attendance",
      icon: "attendance",
      mobile: true,
    },
    {
      label: "Students",
      href: "/tutor/students",
      icon: "students",
      mobile: true,
    },
  ],
  student: [
    { label: "Home", href: "/student", icon: "home", mobile: true },
    {
      label: "Attendance",
      href: "/student/attendance",
      icon: "attendance",
      mobile: true,
    },
    { label: "Fees", href: "/student/fees", icon: "fees", mobile: true },
    {
      label: "Profile",
      href: "/student/profile",
      icon: "profile",
      mobile: true,
    },
    { label: "Schedule", href: "/student/schedule", icon: "schedule" },
    { label: "ID card", href: "/student/id-card", icon: "cards" },
  ],
};

function getCookie(name: string) {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
}

export function PortalShell({
  portalRole,
  email,
  expiresAt,
  children,
}: {
  portalRole: UserRole;
  email: string;
  expiresAt: string;
  children: ReactNode;
}) {
  const role = portalRole;
  const path = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  useEffect(
    () => setCollapsed(localStorage.getItem("psc-sidebar") === "collapsed"),
    [],
  );
  const items = navigation[role];
  const mobile = useMemo(() => items.filter((item) => item.mobile), [items]);
  const active = (href: string) =>
    path === href || (href !== `/${role}` && path.startsWith(`${href}/`));
  function toggleSidebar() {
    setCollapsed((value) => {
      const next = !value;
      localStorage.setItem("psc-sidebar", next ? "collapsed" : "expanded");
      return next;
    });
  }
  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "x-csrf-token": decodeURIComponent(getCookie("psc_csrf") ?? ""),
      },
    });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="portal">
      <SessionExpiryWarning expiresAt={expiresAt} />
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <div className="sidebar-head">
          <Brand compact={collapsed} />
          <button
            type="button"
            className="btn btn-ghost icon-btn"
            onClick={toggleSidebar}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        <nav className="sidebar-nav" aria-label={`${role} navigation`}>
          {items.map((item) => {
            const Icon = iconMap[item.icon];
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${active(item.href) ? "active" : ""}`}
              >
                <Icon size={19} />
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="avatar">{role.slice(0, 2).toUpperCase()}</span>
            <div className="sidebar-user-copy">
              <b>
                {role[0]?.toUpperCase()}
                {role.slice(1)}
              </b>
              <span>{email}</span>
            </div>
          </div>
          <button className="sidebar-link" type="button" onClick={logout}>
            <LogOut size={18} />
            <span className="nav-label">Sign out</span>
          </button>
        </div>
      </aside>
      <div className={`portal-content ${collapsed ? "collapsed" : ""}`}>
        <header className="portal-topbar">
          <div>
            <span className="eyebrow">{role} portal</span>
          </div>
          <ThemeToggle />
        </header>
        <main className="portal-main">{children}</main>
      </div>
      <nav
        className="mobile-nav"
        style={{ "--mobile-items": mobile.length } as CSSProperties}
        aria-label={`${role} mobile navigation`}
      >
        {mobile.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-link ${active(item.href) ? "active" : ""}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function SessionExpiryWarning({ expiresAt }: { expiresAt: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const update = () => {
      const remaining = new Date(expiresAt).getTime() - Date.now();
      setShow(remaining > 0 && remaining <= 5 * 60 * 1000);
    };
    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);
  return show ? (
    <output className="session-warning" aria-live="polite">
      Your session expires in less than five minutes. Save any changes and sign
      in again.
    </output>
  ) : null;
}
