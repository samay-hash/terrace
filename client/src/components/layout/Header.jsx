import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Search, ShoppingBag, User, LogOut, Package, LayoutDashboard, Heart, ChevronDown } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { useWishlist } from "../../context/WishlistContext.jsx";
import { useCategories, useFacets, useProducts } from "../../hooks/queries.js";
import { assetUrl } from "../../lib/api.js";
import { formatPrice } from "../../lib/format.js";
import { Logo } from "./Logo.jsx";
import { SearchOverlay } from "./SearchOverlay.jsx";
import { Drawer } from "../ui/Overlay.jsx";
import styles from "./Header.module.css";

// The rest of the departments live in the Shop mega menu.
const PRIMARY = ["watches", "footwear", "eyewear"];
const COLLECTIONS = [
  { to: "/shop?sort=newest", label: "New in" },
  { to: "/shop?sort=popular", label: "Bestsellers" },
  { to: "/shop?sort=rating&minRating=4", label: "Top rated" },
  { to: "/shop?onSale=true", label: "On sale" },
  { to: "/shop?maxPrice=1999&sort=popular", label: "Gifts under ₹2,000" },
];

function isActive(location, params) {
  if (location.pathname !== "/shop") return false;
  const current = new URLSearchParams(location.search);
  return Object.entries(params).every(([k, v]) => current.get(k) === v);
}

// Desktop mega menu for "Shop". Opens on hover (with a short delay so it
// doesn't flicker), click or keyboard, and closes on Escape or leaving.
function MegaMenu({ categories }) {
  const [open, setOpen] = useState(false);
  const timer = useRef(null);
  const ref = useRef(null);
  const location = useLocation();
  const { data: facets } = useFacets();
  const { data: featured } = useProducts({ featured: "true", inStock: "true", sort: "rating", limit: 1 });
  const feature = featured?.items?.[0];
  const brands = [...(facets?.brands ?? [])].sort((a, b) => b.count - a.count).slice(0, 8);

  useEffect(() => setOpen(false), [location]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  const enter = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), 120);
  };
  const leave = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 160);
  };

  return (
    <div className={styles.megaWrap} ref={ref} onMouseEnter={enter} onMouseLeave={leave}>
      <button type="button" className={styles.navLink} aria-expanded={open} aria-controls="mega-menu" onClick={() => setOpen((o) => !o)}>
        Shop <ChevronDown size={14} aria-hidden className={styles.chev} data-open={open ? "" : undefined} />
      </button>
      {open && (
        <div id="mega-menu" className={styles.mega}>
          <div className={`container ${styles.megaInner}`}>
            <div className={styles.megaCol}>
              <p className={styles.megaTitle}>Categories</p>
              <Link to="/shop" className={styles.megaLink}>
                Shop everything
              </Link>
              {categories.map((c) => (
                <Link key={c.id} to={`/shop?category=${c.slug}`} className={styles.megaLink}>
                  {c.name} <span>{c.productCount}</span>
                </Link>
              ))}
            </div>
            <div className={styles.megaCol}>
              <p className={styles.megaTitle}>Brands</p>
              {brands.map((b) => (
                <Link key={b.name} to={`/shop?brand=${encodeURIComponent(b.name)}`} className={styles.megaLink}>
                  {b.name} <span>{b.count}</span>
                </Link>
              ))}
            </div>
            <div className={styles.megaCol}>
              <p className={styles.megaTitle}>Collections</p>
              {COLLECTIONS.map((c) => (
                <Link key={c.to} to={c.to} className={styles.megaLink}>
                  {c.label}
                </Link>
              ))}
            </div>
            {feature && (
              <Link to={`/product/${feature.slug}`} className={styles.megaFeature}>
                <span className={styles.megaFeatureMedia}>
                  <img className="product-photo" src={assetUrl(feature.images[0]?.url)} alt="" width="400" height="400" />
                </span>
                <span className={styles.megaFeatureText}>
                  <span>Editor's pick</span>
                  <strong>{feature.name}</strong>
                  <span className="tabular">{formatPrice(feature.price)}</span>
                </span>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
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
      <Link to="/login" className={styles.iconButton} aria-label="Sign in or create an account" title="Sign in">
        <User size={20} strokeWidth={1.6} />
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
            <Package size={17} aria-hidden /> Orders
          </Link>
          <Link role="menuitem" to="/wishlist" className={styles.menuItem} onClick={() => setOpen(false)}>
            <Heart size={17} aria-hidden /> Wishlist
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
  const { count: savedCount } = useWishlist();
  const { user, isAdmin } = useAuth();
  const { data: categories = [] } = useCategories();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // "/" opens search from anywhere, like most premium stores.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <div className={styles.announce}>
        <p className="container">
          Free shipping over ₹2,999 and free 30-day returns. <Link to="/help#shipping">Delivery details</Link>
        </p>
      </div>
      <header
        className={styles.header}
        data-scrolled={scrolled ? "" : undefined}
        data-transparent={location.pathname === "/" && !scrolled ? "" : undefined}
      >
        <div className={`container ${styles.bar}`}>
          <div className={styles.left}>
            <button type="button" className={`${styles.iconButton} ${styles.burger}`} onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <Menu size={22} strokeWidth={1.6} />
            </button>
            <nav className={styles.nav} aria-label="Main">
              <MegaMenu categories={categories} />
              <Link to="/shop?sort=newest" className={`${styles.navLink} ${isActive(location, { sort: "newest" }) ? styles.current : ""}`}>
                New in
              </Link>
              {PRIMARY.map((slug) => {
                const c = categories.find((cat) => cat.slug === slug);
                if (!c) return null;
                const current = isActive(location, { category: slug });
                return (
                  <Link key={slug} to={`/shop?category=${slug}`} className={`${styles.navLink} ${current ? styles.current : ""}`} aria-current={current ? "page" : undefined}>
                    {c.name}
                  </Link>
                );
              })}
              <Link to="/shop?onSale=true" className={`${styles.navLink} ${styles.sale} ${isActive(location, { onSale: "true" }) ? styles.current : ""}`}>
                Sale
              </Link>
            </nav>
          </div>

          <div className={styles.center}>
            <Logo tone={location.pathname === "/" && !scrolled ? "light" : "ink"} />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.searchButton} onClick={() => setSearchOpen(true)} aria-label="Search (press /)">
              <Search size={18} strokeWidth={1.6} aria-hidden />
              <span>Search</span>
            </button>
            <Link to="/wishlist" className={`${styles.iconButton} ${styles.withCount}`} aria-label={`Wishlist, ${savedCount} saved`} title="Wishlist">
              <Heart size={20} strokeWidth={1.6} />
              {savedCount > 0 && <span className={`${styles.count} tabular`}>{savedCount}</span>}
            </Link>
            <AccountMenu />
            <button type="button" className={`${styles.iconButton} ${styles.withCount}`} onClick={openDrawer} aria-label={`Bag, ${itemCount} ${itemCount === 1 ? "item" : "items"}`}>
              <ShoppingBag size={20} strokeWidth={1.6} />
              {itemCount > 0 && <span key={itemCount} className={`${styles.count} ${styles.bump} tabular`}>{itemCount > 99 ? "99+" : itemCount}</span>}
            </button>
          </div>
        </div>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} side="left" label="Menu">
        <div className={styles.mobile}>
          <Logo />
          <button
            type="button"
            className={styles.mobileSearch}
            onClick={() => {
              setMenuOpen(false);
              setSearchOpen(true);
            }}
          >
            <Search size={18} aria-hidden /> Search products
          </button>
          <nav aria-label="Mobile" className={styles.mobileNav}>
            <Link to="/shop" onClick={() => setMenuOpen(false)}>
              Shop everything
            </Link>
            {categories.map((c) => (
              <Link key={c.id} to={`/shop?category=${c.slug}`} onClick={() => setMenuOpen(false)}>
                {c.name} <span>{c.productCount}</span>
              </Link>
            ))}
            <Link to="/shop?onSale=true" onClick={() => setMenuOpen(false)} className={styles.sale}>
              Sale
            </Link>
          </nav>
          <div className={styles.mobileFoot}>
            <Link to="/wishlist" onClick={() => setMenuOpen(false)}>
              Wishlist {savedCount > 0 && `(${savedCount})`}
            </Link>
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
