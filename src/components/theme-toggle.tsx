"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

function switchThemeWithoutTransitions(next: boolean) {
  const style = document.createElement("style");
  style.dataset.themeTransitionOverride = "true";
  style.textContent = "*,*::before,*::after{transition:none !important}";
  document.head.append(style);

  document.documentElement.classList.toggle("dark", next);
  void document.body.offsetHeight;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => style.remove());
  });
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(
    () => setDark(document.documentElement.classList.contains("dark")),
    [],
  );

  function toggle() {
    const next = !dark;
    switchThemeWithoutTransitions(next);
    localStorage.setItem("psc-theme", next ? "dark" : "light");
    setDark(next);
  }

  return (
    <button
      type="button"
      className="btn btn-secondary icon-btn"
      onClick={toggle}
      aria-label={`Switch to ${dark ? "light" : "dark"} theme`}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
