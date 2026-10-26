import { NavLink, Outlet, useLocation } from "react-router-dom";

export function Layout() {
  const { pathname } = useLocation();
  const onInk = pathname === "/";
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className={`masthead ${onInk ? "on-ink" : ""}`}>
        <NavLink to="/" aria-label="Noctra — home">Noctra</NavLink>
        <nav aria-label="Primary">
          <NavLink to="/shop/">Shop</NavLink>
          <NavLink to="/about/">About</NavLink>
        </nav>
      </header>
      <main id="main"><Outlet /></main>
      <footer className="footer">
        <span>© {new Date().getFullYear()} Noctra</span>
        <span>Collection 01 is in development. No orders are being taken yet.</span>
      </footer>
    </>
  );
}
