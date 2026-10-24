import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, Search, ShoppingBag, User, LogOut, Package, LayoutDashboard } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { useCategories } from "../../hooks/queries.js";
import { Logo } from "./Logo.jsx";
import { SearchBox } from "./SearchBox.jsx";
import { Drawer } from "../ui/Overlay.jsx";
import styles from "./Header.module.css";

const SHORT_NAMES = { "club-football": "Club", international: "International", retro: "Retro", cricket: "Cricket", basketball: "Basketball", training: "Training" };

function useNavItems() {
  const { data: categories = [] } = useCategories();
  return [
    ...categories.map((c) => ({ to: `/shop?category=${c.slug}`, label: SHORT_NAMES[c.slug] ?? c.name, slug: c.slug })),
    { to: "/shop?onSale=true", label: "Sale", sale: true },
  ];
}

function isActive(location, item) {
  const params = new URLSearchParams(location.search);
  if (location.pathname !== "/shop") return false;
  if (item.sale) return params.get("onSale") === "true";
  return params.get("category") === item.slug;
}

function AccountMenu() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <Link to="/login" className={styles.signIn}>
        <User size={20} aria-hidden />
        <span>Sign in</span>
      </Link>
    );
  }

  return (
    <div className={styles.account} ref={ref}>
      <button type="button" className={styles.avatar} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu" aria-label="Account menu">
        {user.name.charAt(0).toUpperCase()}
      </button>
      {open && (
        <div className={styles.menu} role="menu">
          <div className={styles.menuHead}>
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
          <Link role="menuitem" to="/account" className={styles.menuItem} onClick={() => setOpen(false)}>
            <Package size={17} aria-hidden /> My orders
          </Link>
          {isAdmin && (
            <Link role="menuitem" to="/admin" className={styles.menuItem} onClick={() => setOpen(false)}>
              <LayoutDashboard size={17} aria-hidden /> Admin dashboard
            </Link>
          )}
          <button
            role="menuitem"
            type="button"
            className={styles.menuItem}
            onClick={async () => {
              setOpen(false);
              await logout();
              navigate("/");
            }}
          >
            <LogOut size={17} aria-hidden /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const location = useLocation();
  const { itemCount, openDrawer } = useCart();
  const { user, isAdmin } = useAuth();
  const navItems = useNavItems();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className={styles.announce}>
        <p className="container">
          Free shipping on orders over ₹2,999. Cash on delivery across India.{" "}
          <Link to="/help#returns">30-day free returns</Link>
        </p>
      </div>
      <header className={styles.header} data-scrolled={scrolled ? "" : undefined}>
        <div className={`container ${styles.bar}`}>
          <button type="button" className={styles.burger} onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>

          <Logo />

          <nav className={styles.nav} aria-label="Main">
            <NavLink to="/shop" end className={({ isActive: exact }) => `${styles.navLink} ${exact && !location.search ? styles.current : ""}`}>
              Shop all
            </NavLink>
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`${styles.navLink} ${item.sale ? styles.sale : ""} ${isActive(location, item) ? styles.current : ""}`}
                aria-current={isActive(location, item) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className={styles.actions}>
            <SearchBox className={styles.search} />
            <button type="button" className={styles.searchToggle} onClick={() => setMenuOpen(true)} aria-label="Search">
              <Search size={20} />
            </button>
            <AccountMenu />
            <button type="button" className={styles.bag} onClick={openDrawer} aria-label={`Bag, ${itemCount} ${itemCount === 1 ? "item" : "items"}`}>
              <ShoppingBag size={21} aria-hidden />
              {itemCount > 0 && <span className={`${styles.count} tabular`}>{itemCount > 99 ? "99+" : itemCount}</span>}
            </button>
          </div>
        </div>
      </header>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} side="left" label="Menu">
        <div className={styles.mobile}>
          <Logo />
          <SearchBox onNavigate={() => setMenuOpen(false)} autoFocus />
          <nav aria-label="Mobile" className={styles.mobileNav}>
            <Link to="/shop" onClick={() => setMenuOpen(false)}>
              Shop all
            </Link>
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className={item.sale ? styles.sale : ""}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className={styles.mobileFoot}>
            {user ? (
              <>
                <Link to="/account" onClick={() => setMenuOpen(false)}>
                  My orders
                </Link>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setMenuOpen(false)}>
                    Admin dashboard
                  </Link>
                )}
              </>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)}>
                Sign in or create an account
              </Link>
            )}
            <Link to="/help" onClick={() => setMenuOpen(false)}>
              Help and returns
            </Link>
          </div>
        </div>
      </Drawer>
    </>
  );
}
