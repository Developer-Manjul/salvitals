import { openDemo, openTrial, waChat } from "../js/site";

export default function Navbar() {
  return (
    <nav className="nav" id="siteNav">

      <div className="wrap nav-in">

        {/* Logo */}
        <a className="logo" href="#top" aria-label="Vitals home">
          <img
            src="logo.png"
            alt="Vitals - Clinic Growth CRM"
            className="navbar-logo"
          />
        </a>

        {/* Desktop Navigation */}
        <div className="nav-links">

          <a href="#product">
            Product
          </a>

          <a href="#features">
            See inside
          </a>

          <a href="#specialities">
            Who it's for
          </a>

          <a href="#pricing">
            Pricing
          </a>

          <a href="#customers">
            Customers
          </a>

          <a href="#faq">
            FAQ
          </a>

        </div>

        {/* Right Side */}
        <div className="nav-cta">

      
          {/* WhatsApp
          <button
            className="btn btn-wa nav-whatsapp"
            type="button"
            onClick={() => waChat()}
          >
            <svg
              className="i i-16"
              aria-hidden="true"
            >
              <use href="#i-wa" />
            </svg>

            <span>WhatsApp</span>
          </button> */}

          

           {/* Sign In */}
          <button
            className="btn btn-primary nav-trial"
            type="button"
            onClick={() => {
              window.location.href = "/signin";
            }}
          >
            Sign in
          </button>

          {/* Mobile Menu Button */}
          <button
            className="burger"
            id="menuToggle"
            aria-label="Open menu"
            aria-expanded="false"
            type="button"
          >
            <svg
              className="i i-20"
              aria-hidden="true"
            >
              <use href="#i-menu" />
            </svg>
          </button>

        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className="mobile-menu"
        id="mobileMenu"
      >

        <a href="#product">
          Product
        </a>

        <a href="#features">
          See inside
        </a>

        <a href="#specialities">
          Who it's for
        </a>

        <a href="#pricing">
          Pricing
        </a>

        <a href="#customers">
          Customers
        </a>

        <a href="#faq">
          FAQ
        </a>

        {/* Mobile Sign In */}
        <button
          className="nav-signin mobile-signin"
          type="button"
          onClick={() => {
            window.location.href = "/signin";
          }}
        >
          Sign in
        </button>

        {/* Mobile WhatsApp */}
        <button
          className="btn btn-wa btn-block"
          style={{ marginTop: "10px" }}
          type="button"
          onClick={() => waChat()}
        >
          <svg
            className="i i-16"
            aria-hidden="true"
          >
            <use href="#i-wa" />
          </svg>

          WhatsApp
        </button>

        {/* Mobile Trial */}
        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: "10px" }}
          type="button"
          onClick={() => openTrial()}
        >
          Start free trial
        </button>

      </div>

    </nav>
  );
}