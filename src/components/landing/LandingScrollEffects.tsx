'use client';

import { useEffect, useState } from 'react';

/**
 * ════════════════════════════════════════════════════════════════════
 * 🎨 LandingScrollEffects (V25.41)
 * ════════════════════════════════════════════════════════════════════
 *
 * Component يضيف scroll behaviors للـ landing page:
 *
 *   ✓ Sticky nav مع shadow + hide on scroll down
 *   ✓ Back-to-top button (يظهر بعد scroll 400px)
 *   ✓ Scroll progress indicator (شريط رفيع أعلى الصفحة)
 *   ✓ Fade-in animation لكل section عند الظهور
 *   ✓ Smooth scroll للروابط الـ anchor
 * ════════════════════════════════════════════════════════════════════
 */

export default function LandingScrollEffects() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [navHidden, setNavHidden] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let lastScrollY = 0;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScroll = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const progress = docHeight > 0 ? (currentScroll / docHeight) * 100 : 0;

          setScrollProgress(progress);
          setShowBackToTop(currentScroll > 400);

          // Hide nav on scroll down, show on scroll up
          if (currentScroll > 100) {
            if (currentScroll > lastScrollY) {
              setNavHidden(true);
            } else {
              setNavHidden(false);
            }
          } else {
            setNavHidden(false);
          }

          // أضف class للـ body
          if (currentScroll > 20) {
            document.body.classList.add('landing-scrolled');
          } else {
            document.body.classList.remove('landing-scrolled');
          }

          if (navHidden) {
            document.body.classList.add('landing-nav-hidden');
          } else {
            document.body.classList.remove('landing-nav-hidden');
          }

          lastScrollY = currentScroll;
          ticking = false;
        });
        ticking = true;
      }
    };

    // Initial check
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Smooth scroll للروابط
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      const element = document.querySelector(href);
      if (element) {
        e.preventDefault();
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    document.addEventListener('click', handleAnchorClick);

    // Fade-in animation عند الظهور
    const fadeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('landing-fade-in-visible');
            fadeObserver.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '0px 0px -80px 0px',
        threshold: 0.1,
      }
    );

    const fadeElements = document.querySelectorAll(
      '.landing-stats, .landing-features, .landing-coverage-map, .landing-blog, .landing-faq, .landing-testimonials, .landing-cta'
    );
    fadeElements.forEach((el) => {
      el.classList.add('landing-fade-in');
      fadeObserver.observe(el);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleAnchorClick);
      fadeObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Scroll progress indicator */}
      <div
        className="landing-scroll-progress"
        style={{ transform: `scaleX(${scrollProgress / 100})` }}
        aria-hidden="true"
      />

      {/* Back to top button */}
      <button
        type="button"
        onClick={scrollToTop}
        className={`landing-back-to-top ${showBackToTop ? 'visible' : ''}`}
        aria-label="الذهاب للأعلى"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      </button>
    </>
  );
}
