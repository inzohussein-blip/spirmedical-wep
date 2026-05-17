/* eslint-disable react/jsx-key */
import React from 'react';

// ════════════════════════════════════════════════════════════════════
// 💀 SKELETON COMPONENTS
// ════════════════════════════════════════════════════════════════════

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rect' | 'card';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className = '', variant = 'rect', width, height }: SkeletonProps) {
  const style: React.CSSProperties = {};
  if (width !== undefined) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height !== undefined) style.height = typeof height === 'number' ? `${height}px` : height;

  return <div className={`skeleton skeleton-${variant} ${className}`} style={style} aria-hidden="true" />;
}

// ─── Card Skeleton ───
export function SkeletonCard() {
  return (
    <div className="skeleton-card-wrap">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="skeleton-card-content">
        <Skeleton variant="text" width="60%" height={14} />
        <Skeleton variant="text" width="80%" height={11} />
      </div>
      <Skeleton variant="rect" width={50} height={20} />
    </div>
  );
}

// ─── Chat List Skeleton ───
export function SkeletonChatList() {
  return (
    <div className="skeleton-list">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="skeleton-chat-item">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="skeleton-chat-content">
            <div className="skeleton-chat-top">
              <Skeleton variant="text" width="40%" height={14} />
              <Skeleton variant="text" width={30} height={10} />
            </div>
            <Skeleton variant="text" width="75%" height={11} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Messages Skeleton ───
export function SkeletonMessages() {
  return (
    <div className="skeleton-messages">
      <div className="skeleton-msg theirs">
        <Skeleton variant="circular" width={28} height={28} />
        <Skeleton variant="rect" width="60%" height={40} />
      </div>
      <div className="skeleton-msg mine">
        <Skeleton variant="rect" width="55%" height={50} />
      </div>
      <div className="skeleton-msg theirs">
        <Skeleton variant="circular" width={28} height={28} />
        <Skeleton variant="rect" width="70%" height={60} />
      </div>
      <div className="skeleton-msg mine">
        <Skeleton variant="rect" width="40%" height={30} />
      </div>
    </div>
  );
}

// ─── Services Grid Skeleton ───
export function SkeletonServicesGrid() {
  return (
    <div className="skeleton-grid">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="skeleton-grid-item">
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="text" width="80%" height={12} />
          <Skeleton variant="text" width="60%" height={10} />
        </div>
      ))}
    </div>
  );
}

// ─── Dashboard Skeleton ───
export function SkeletonDashboard() {
  return (
    <div className="skeleton-dashboard">
      {/* Header */}
      <div className="skeleton-header">
        <div className="skeleton-header-left">
          <Skeleton variant="circular" width={36} height={36} />
          <div>
            <Skeleton variant="text" width={80} height={10} />
            <Skeleton variant="text" width={60} height={12} />
          </div>
        </div>
        <Skeleton variant="circular" width={32} height={32} />
      </div>

      {/* Search */}
      <Skeleton variant="rect" width="100%" height={44} className="skeleton-search" />

      {/* Pills */}
      <div className="skeleton-pills">
        <Skeleton variant="rect" width={80} height={32} />
        <Skeleton variant="rect" width={100} height={32} />
        <Skeleton variant="rect" width={90} height={32} />
      </div>

      {/* Cards */}
      <Skeleton variant="rect" width="100%" height={120} className="skeleton-promo" />

      {/* Grid */}
      <SkeletonServicesGrid />
    </div>
  );
}

// ─── Appointments List Skeleton ───
export function SkeletonAppointmentsList() {
  return (
    <div className="skeleton-list">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton-appt-card">
          <div className="skeleton-appt-head">
            <Skeleton variant="rect" width={40} height={40} />
            <div style={{ flex: 1 }}>
              <Skeleton variant="text" width="50%" height={14} />
              <Skeleton variant="text" width="40%" height={11} />
            </div>
            <Skeleton variant="rect" width={70} height={24} />
          </div>
          <Skeleton variant="text" width="80%" height={11} />
        </div>
      ))}
    </div>
  );
}

// ─── Profile Card Skeleton ───
export function SkeletonProfile() {
  return (
    <div className="skeleton-profile">
      <Skeleton variant="circular" width={80} height={80} />
      <Skeleton variant="text" width={140} height={18} />
      <Skeleton variant="text" width={100} height={12} />
      <div className="skeleton-profile-stats">
        <Skeleton variant="rect" width={70} height={50} />
        <Skeleton variant="rect" width={70} height={50} />
        <Skeleton variant="rect" width={70} height={50} />
      </div>
    </div>
  );
}
