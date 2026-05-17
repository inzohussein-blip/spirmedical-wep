'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { promoteToAdmin, revokeAdminRole, changeAdminRole } from './actions';
import { ADMIN_ROLES, type AdminRole } from '@/lib/admin-types';

interface AdminUser {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: AdminRole;
  createdAt: string;
  isMe: boolean;
}

interface Props {
  admins: AdminUser[];
}

export default function AdminsClient({ admins }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('support');

  function handleAdd() {
    setError(''); setSuccess('');
    if (!/^07\d{9}$/.test(newPhone.trim())) {
      setError('رقم الهاتف غير صحيح');
      return;
    }
    startTransition(async () => {
      const result = await promoteToAdmin(newPhone, newRole);
      if (!result.ok) { setError(result.error || 'حدث خطأ'); return; }
      setSuccess(`✅ تم تعيين ${result.name ?? 'المستخدم'} كـ ${ADMIN_ROLES[newRole].label}`);
      setNewPhone('');
      setShowAddForm(false);
      router.refresh();
    });
  }

  function handleRevoke(adminId: string, name: string) {
    if (!confirm(`إزالة صلاحيات الإدارة من "${name}"؟`)) return;
    startTransition(async () => {
      const result = await revokeAdminRole(adminId);
      if (!result.ok) { setError(result.error || 'حدث خطأ'); return; }
      setSuccess('تم إزالة الصلاحيات');
      router.refresh();
    });
  }

  function handleChangeRole(adminId: string, role: AdminRole) {
    if (!confirm(`تغيير الدور إلى "${ADMIN_ROLES[role].label}"؟`)) return;
    startTransition(async () => {
      const result = await changeAdminRole(adminId, role);
      if (!result.ok) { setError(result.error || 'حدث خطأ'); return; }
      setSuccess('تم تحديث الدور');
      router.refresh();
    });
  }

  const inputStyle: React.CSSProperties = {
    padding: '10px 12px', border: '1px solid var(--line)',
    borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
  };

  return (
    <>
      {/* Add Form */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 18, marginBottom: 16 }}>
        {!showAddForm ? (
          <button onClick={() => setShowAddForm(true)} style={{
            padding: '10px 20px', background: 'var(--emerald-deep)', color: '#fff',
            border: 0, borderRadius: 10, fontSize: 13, fontWeight: 800,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            + إضافة مدير
          </button>
        ) : (
          <>
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 12px' }}>إضافة مدير جديد</h3>

            {error && (
              <div style={{ background: 'var(--rose-soft)', color: 'var(--rose)', padding: '10px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>
                  رقم الهاتف
                </label>
                <input
                  type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="07XXXXXXXXX" dir="ltr"
                  style={{ ...inputStyle, width: '100%' }}
                />
                <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>
                  المستخدم يجب أن يكون مسجلاً في النظام
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>
                  الدور
                </label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value as AdminRole)} style={inputStyle}>
                  <option value="super_admin">👑 {ADMIN_ROLES.super_admin.label}</option>
                  <option value="manager">👔 {ADMIN_ROLES.manager.label}</option>
                  <option value="support">🎧 {ADMIN_ROLES.support.label}</option>
                </select>
              </div>

              <button onClick={handleAdd} disabled={isPending} style={{
                padding: '10px 20px', background: 'var(--emerald-deep)', color: '#fff',
                border: 0, borderRadius: 8, fontSize: 12, fontWeight: 800,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                💾 تعيين
              </button>
              <button onClick={() => { setShowAddForm(false); setError(''); }} style={{
                padding: '10px 16px', background: 'transparent', border: '1px solid var(--line)',
                borderRadius: 8, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                إلغاء
              </button>
            </div>
          </>
        )}

        {success && (
          <div style={{ background: 'var(--emerald-soft)', color: 'var(--emerald-deep)', padding: '10px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, marginTop: 12 }}>
            {success}
          </div>
        )}
      </div>

      {/* List */}
      <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ background: 'var(--paper-3)' }}>
            <tr>
              <th style={th}>الاسم</th>
              <th style={th}>الهاتف</th>
              <th style={th}>الدور</th>
              <th style={th}>تاريخ التعيين</th>
              <th style={th}>إجراء</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => {
              const meta = ADMIN_ROLES[a.role];
              return (
                <tr key={a.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={td}>
                    <div style={{ fontWeight: 700 }}>
                      {a.name} {a.isMe && <span style={{ fontSize: 10, color: 'var(--emerald)', marginInlineStart: 6 }}>(أنت)</span>}
                    </div>
                    {a.email && <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{a.email}</div>}
                  </td>
                  <td style={{ ...td, fontFamily: 'monospace' }} dir="ltr">{a.phone}</td>
                  <td style={td}>
                    <select
                      value={a.role}
                      onChange={(e) => handleChangeRole(a.id, e.target.value as AdminRole)}
                      disabled={a.isMe || isPending}
                      style={{
                        padding: '4px 8px', fontSize: 11, fontWeight: 700,
                        border: 'none', borderRadius: 100,
                        background: 'var(--paper-3)', color: meta.color,
                        cursor: a.isMe ? 'default' : 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      <option value="super_admin">👑 مدير عام</option>
                      <option value="admin">👑 مدير عام</option>
                      <option value="manager">👔 مدير عمليات</option>
                      <option value="support">🎧 دعم فني</option>
                    </select>
                  </td>
                  <td style={td}>{new Date(a.createdAt).toLocaleDateString('ar-IQ')}</td>
                  <td style={td}>
                    {a.isMe ? (
                      <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>—</span>
                    ) : (
                      <button onClick={() => handleRevoke(a.id, a.name)} disabled={isPending} style={{
                        padding: '4px 10px', background: 'var(--rose-soft)', color: 'var(--rose)',
                        border: 0, borderRadius: 100, fontSize: 11, fontWeight: 800,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                        🗑 إزالة
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

const th: React.CSSProperties = { padding: '12px 14px', textAlign: 'right', fontSize: 11, fontWeight: 800, color: 'var(--ink-3)' };
const td: React.CSSProperties = { padding: '12px 14px', fontSize: 13, color: 'var(--ink)' };
