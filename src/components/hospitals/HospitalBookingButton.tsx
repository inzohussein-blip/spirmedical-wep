'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import HospitalBookingModal from './HospitalBookingModal';

interface Props {
  hospital: {
    id: string;
    name: string;
    type: string;
    city: string;
    district: string | null;
    departments?: string[] | null;
  };
  userPhone?: string;
}

/**
 * Wrapper Component للزر - يفتح الـ Modal
 */
export default function HospitalBookingButton({ hospital, userPhone }: Props) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        style={{
          width: '100%',
          padding: 14,
          background: 'linear-gradient(135deg, #0F6E56 0%, #04342C 100%)',
          color: 'white',
          border: 0,
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 800,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          marginBottom: 14,
          boxShadow: '0 4px 12px rgba(15, 107, 88, 0.2)',
        }}
      >
        <Calendar size={18} strokeWidth={2.4} />
        احجز موعد في هذه المستشفى
      </button>

      {showModal && (
        <HospitalBookingModal
          hospital={hospital}
          onClose={() => setShowModal(false)}
          userPhone={userPhone}
        />
      )}
    </>
  );
}
