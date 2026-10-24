import { Suspense, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutGrid, Package, Tags, ReceiptText, Store, LogOut, Menu, X, MessageSquareText, Moon, Sun } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { Logo } from "../layout/Logo.jsx";
import { PageLoader } from "../ui/Feedback.jsx";
import { useTheme } from "../../hooks/useTheme.js";
import styles from "./Admin.module.css";

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutGrid, end: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/orders", label: "Orders", icon: ReceiptText },
  { to: "/admin/reviews", label: "Reviews", icon: MessageSquareText },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} data-open={open ? "" : undefined}>
        <div className={styles.sidebarTop}>
          <Logo tone="light" to="/admin" label="Terrace admin home" />
          <span className={styles.badge}>Admin</span>
          <button type="button" className={styles.closeNav} onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <nav className={styles.nav} aria-label="Admin">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={styles.navLink} onClick={() => setOpen(false)}>
              <Icon size={18} aria-hidden /> {label}
            </NavLink>
          ))}
        </nav>
        <div className={styles.sidebarFoot}>
          <NavLink to="/" className={styles.navLink}>
            <Store size={18} aria-hidden /> View store
          </NavLink>
          <button type="button" className={styles.navLink} onClick={toggle} aria-pressed={theme === "dark"}>
            {theme === "dark" ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />} {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <div className={styles.who}>
            <span className={styles.avatar}>{user.name.charAt(0)}</span>
            <span className={styles.whoText}>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </span>
            <button
              type="button"
              className={styles.signOut}
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <div className={styles.main}>
        <div className={styles.mobileBar}>
          <button type="button" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
          <Logo to="/admin" />
        </div>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}

