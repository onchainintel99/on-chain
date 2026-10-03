import React from "react";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__row">
        <div className="site-footer__block">
          <p className="site-footer__brand">Onchain Intelligence</p>
          <p className="site-footer__meta"><strong>Founder:</strong> Goutham Tummagunta</p>
          <a className="site-footer__link" href="mailto:onchainintel99@gmail.com">
            onchainintel99@gmail.com
          </a>
        </div>

        <div className="site-footer__block site-footer__block--contact">
          <p className="site-footer__heading">Technical Support</p>
          <p className="site-footer__meta">BhuvanaChandra Dabba</p>
          <a className="site-footer__link" href="mailto:bhuvanachandradabba@gmail.com">
            bhuvanachandradabba@gmail.com
          </a>
          <p className="site-footer__meta" style={{ marginTop: "0.75rem" }}>Victor Boli</p>
          <a className="site-footer__link" href="mailto:victorboli777@gmail.com">
            victorboli777@gmail.com
          </a>
        </div>
      </div>

      <div className="site-footer__divider" />

      <div className="site-footer__tagline">
        <p className="site-footer__made-for">
          © {new Date().getFullYear()} Onchain Intelligence. All rights reserved.
        </p>
        <p className="site-footer__quote">
          For platform assistance, please contact our Technical Support team.
        </p>
      </div>
    </footer>
  );
}
