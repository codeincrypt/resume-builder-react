import { Link } from "react-router-dom";

import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div>
          <Logo />
          <p className="site-footer__tag">
            Resume templates named for the world's capitals. No AI writing, no
            tracking of your documents.
          </p>
        </div>
        <nav aria-label="Footer" className="site-footer__nav">
          <Link to="/templates">Templates</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/contact">Contact</Link>
        </nav>
      </div>
      <div className="container site-footer__legal">
        © {new Date().getFullYear()} CapitalCV. All rights reserved.
      </div>
    </footer>
  );
}
