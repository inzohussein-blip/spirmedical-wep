'use client';

import { useState } from 'react';

interface FAQItem {
  q: string;
  a: string;
}

export default function LandingFAQ({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <div className="landing-faq-list">
      {items.map((item, i) => (
        <details
          key={i}
          className="landing-faq-item"
          open={openIndex === i}
          onClick={(e) => {
            e.preventDefault();
            toggle(i);
          }}
        >
          <summary className="landing-faq-question">
            <span>{item.q}</span>
            <span className="landing-faq-icon" aria-hidden="true">
              {openIndex === i ? '−' : '+'}
            </span>
          </summary>
          <div className="landing-faq-answer">
            <p>{item.a}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
