"use client";

import {
  BadgeIndianRupee,
  BookOpenCheck,
  Cake,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  Home,
  IdCard,
  LoaderCircle,
  LogOut,
  Menu,
  Settings,
  UsersRound,
  X,
} from "lucide-react";
import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
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
type Item = {
  label: string;
  href: string;
  icon: IconName;
  primaryOnMobile?: boolean;
};

const navigation: Record<UserRole, Item[]> = {
  admin: [
    {
      label: "Home",
      href: "/admin",
      icon: "home",
      primaryOnMobile: true,
    },
    {
      label: "Students",
      href: "/admin/students",
      icon: "students",
      primaryOnMobile: true,
    },
    { label: "Tutors", href: "/admin/tutors", icon: "tutors" },
    { label: "Batches", href: "/admin/batches", icon: "batches" },
    {
      label: "Attendance",
      href: "/admin/attendance",
      icon: "attendance",
      primaryOnMobile: true,
    },
    {
      label: "Fees",
      href: "/admin/fees",
      icon: "fees",
      primaryOnMobile: true,
    },
    { label: "ID cards", href: "/admin/id-cards", icon: "cards" },
    { label: "Birthdays", href: "/admin/birthdays", icon: "birthdays" },
    { label: "Settings", href: "/admin/settings", icon: "settings" },
  ],
  tutor: [
    {
      label: "Home",
      href: "/tutor",
      icon: "home",
      primaryOnMobile: true,
    },
    {
      label: "Batches",
      href: "/tutor/batches",
      icon: "batches",
      primaryOnMobile: true,
    },
    {
      label: "Attendance",
      href: "/tutor/attendance",
      icon: "attendance",
      primaryOnMobile: true,
    },
    {
      label: "Students",
      href: "/tutor/students",
      icon: "students",
      primaryOnMobile: true,
    },
  ],
  student: [
    {
      label: "Home",
      href: "/student",
      icon: "home",
      primaryOnMobile: true,
    },
    {
      label: "Attendance",
      href: "/student/attendance",
      icon: "attendance",
      primaryOnMobile: true,
    },
    {
      label: "Fees",
      href: "/student/fees",
      icon: "fees",
      primaryOnMobile: true,
    },
    {
      label: "Profile",
      href: "/student/profile",
      icon: "profile",
      primaryOnMobile: true,
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
  const [signingOut, setSigningOut] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const mobileMoreDialog = useRef<HTMLDialogElement>(null);
  const mobileMoreTrigger = useRef<HTMLButtonElement>(null);
  useEffect(
    () => setCollapsed(localStorage.getItem("psc-sidebar") === "collapsed"),
    [],
  );
  const items = navigation[role];
  const primaryMobileItems = useMemo(
    () => items.filter((item) => item.primaryOnMobile),
    [items],
  );
  const overflowMobileItems = useMemo(
    () => items.filter((item) => !item.primaryOnMobile),
    [items],
  );
  const active = (href: string) =>
    path === href || (href !== `/${role}` && path.startsWith(`${href}/`));
  const overflowActive = overflowMobileItems.some((item) => active(item.href));

  useEffect(() => {
    const dialog = mobileMoreDialog.current;
    if (!dialog) return;
    if (mobileMoreOpen && !dialog.open) dialog.showModal();
    if (!mobileMoreOpen && dialog.open) dialog.close();
  }, [mobileMoreOpen]);

  useEffect(() => {
    if (path) setMobileMoreOpen(false);
  }, [path]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 901px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setMobileMoreOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  function toggleSidebar() {
    setCollapsed((value) => {
      const next = !value;
      localStorage.setItem("psc-sidebar", next ? "collapsed" : "expanded");
      return next;
    });
  }
  async function logout() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "x-csrf-token": decodeURIComponent(getCookie("psc_csrf") ?? ""),
        },
      });
      setMobileMoreOpen(false);
      router.replace("/login");
      router.refresh();
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <div className="portal">
      <SessionExpiryWarning expiresAt={expiresAt} />
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <div className="sidebar-head">
          <Brand compact={collapsed} />
          <button
            type="button"
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
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
                aria-current={active(item.href) ? "page" : undefined}
              >
                <Icon size={19} />
                <span className="nav-label">{item.label}</span>
                <NavigationPendingIndicator />
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
          <button
            className="sidebar-link"
            type="button"
            onClick={logout}
            disabled={signingOut}
          >
            {signingOut ? (
              <LoaderCircle className="animate-spin" size={18} />
            ) : (
              <LogOut size={18} />
            )}
            <span className="nav-label">
              {signingOut ? "Signing out…" : "Sign out"}
            </span>
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
      <nav className="mobile-nav" aria-label={`${role} mobile navigation`}>
        {primaryMobileItems.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-link ${active(item.href) ? "active" : ""}`}
              aria-current={active(item.href) ? "page" : undefined}
            >
              <Icon size={20} />
              <span>{item.label}</span>
              <NavigationPendingIndicator />
            </Link>
          );
        })}
        <button
          ref={mobileMoreTrigger}
          className={`mobile-link ${mobileMoreOpen || overflowActive ? "active" : ""}`}
          type="button"
          onClick={() => setMobileMoreOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={mobileMoreOpen}
          aria-controls={`mobile-more-${role}`}
        >
          <Menu size={20} />
          <span>More</span>
        </button>
      </nav>
      <dialog
        ref={mobileMoreDialog}
        className="mobile-more-dialog"
        id={`mobile-more-${role}`}
        aria-labelledby={`mobile-more-title-${role}`}
        onCancel={() => setMobileMoreOpen(false)}
        onClose={() => {
          setMobileMoreOpen(false);
          mobileMoreTrigger.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setMobileMoreOpen(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") setMobileMoreOpen(false);
        }}
      >
        <div className="mobile-more-content">
          <div className="mobile-more-head">
            <div>
              <span className="eyebrow">{role} portal</span>
              <h2 id={`mobile-more-title-${role}`}>More options</h2>
            </div>
            <button
              type="button"
              className="btn btn-ghost icon-btn"
              onClick={() => setMobileMoreOpen(false)}
              aria-label="Close more options"
            >
              <X size={20} />
            </button>
          </div>
          {overflowMobileItems.length > 0 ? (
            <nav
              className="mobile-more-list"
              aria-label={`${role} additional navigation`}
            >
              {overflowMobileItems.map((item) => {
                const Icon = iconMap[item.icon];
                const isActive = active(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`mobile-more-link ${isActive ? "active" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => {
                      if (isActive) setMobileMoreOpen(false);
                    }}
                  >
                    <span className="metric-icon">
                      <Icon size={18} />
                    </span>
                    <span>{item.label}</span>
                    <NavigationPendingIndicator />
                  </Link>
                );
              })}
            </nav>
          ) : null}
          <div className="mobile-more-account">
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
            <button
              className="btn btn-secondary mobile-signout"
              type="button"
              onClick={logout}
              disabled={signingOut}
            >
              {signingOut ? (
                <LoaderCircle className="animate-spin" size={18} />
              ) : (
                <LogOut size={18} />
              )}
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

function NavigationPendingIndicator() {
  const { pending } = useLinkStatus();

  return (
    <span
      className={`nav-pending-indicator ${pending ? "is-pending" : ""}`}
      aria-hidden={!pending}
    >
      <LoaderCircle size={14} />
      {pending ? <span className="sr-only">Loading</span> : null}
    </span>
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
