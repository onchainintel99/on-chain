import React from 'react'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__row">
        <div className="site-footer__block">
          <p className="site-footer__brand">Onchain Intelligence</p>
          <p className="site-footer__meta">Owned and organized by Goutham</p>
          <p className="site-footer__meta">Developer &amp; IT support — Victor</p>
        </div>
        <div className="site-footer__block site-footer__block--contact">
          <p className="site-footer__heading">Contact us</p>
          <a className="site-footer__link" href="mailto:onchainintel99@gmail.com">
            onchainintel99@gmail.com
          </a>
        </div>
      </div>
      <div className="site-footer__divider" />
      <div className="site-footer__tagline">
        <p className="site-footer__made-for">
          Made for people who are willing to grow in the crypto industry.
        </p>
        <p className="site-footer__quote">
          “Risk comes from not knowing what you're doing.” — Warren Buffett
        </p>
      </div>
    </footer>
  )
}
