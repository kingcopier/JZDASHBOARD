import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserRecord, UserRole } from '../../types';
import { ShieldAlert, Shield, Star, Globe, Trash2, ChevronDown } from 'lucide-react';

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; Icon: React.FC<{ size?: number }> }> = {
  pending: { label: 'Pending', color: 'text-amber-400 bg-amber-950/40 border-amber-500/30', Icon: ({ size }) => <ShieldAlert size={size} /> },
  public:  { label: 'Public',  color: 'text-green-400 bg-green-950/40 border-green-500/30',  Icon: ({ size }) => <Globe size={size} /> },
  vip:     { label: 'VIP',     color: 'text-purple-400 bg-purple-950/40 border-purple-500/30', Icon: ({ size }) => <Star size={size} /> },
  admin:   { label: 'Admin',   color: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30',  Icon: ({ size }) => <Shield size={size} /> },
};

const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  const { label, color, Icon } = ROLE_CONFIG[role];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${color}`}>
      <Icon size={10} />
      {label}
    </span>
  );
};

export const UsersTab: React.FC = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserRecord)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const setRole = async (uid: string, role: UserRole) => {
    setUpdating(uid);
    setOpenDropdown(null);
    try {
      await updateDoc(doc(db, 'users', uid), {
        role,
        ...(role !== 'pending' ? { approvedAt: Date.now() } : {}),
      });
    } finally {
      setUpdating(null);
    }
  };

  const deleteUser = async (uid: string) => {
    if (!window.confirm('Remove this user? They can still sign in but will be set to pending again if they do.')) return;
    await deleteDoc(doc(db, 'users', uid));
  };

  const pendingUsers = users.filter(u => u.role === 'pending');
  const otherUsers = users.filter(u => u.role !== 'pending');

  if (loading) return (
    <div className="py-16 text-center font-mono text-xs text-zinc-600 animate-pulse">
      LOADING USERS...
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Pending banner */}
      {pendingUsers.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-950/20 border border-amber-500/20 rounded-xl">
          <ShieldAlert size={16} className="text-amber-400 flex-shrink-0" />
          <span className="font-mono text-xs text-amber-400">
            {pendingUsers.length} user{pendingUsers.length > 1 ? 's' : ''} awaiting approval
          </span>
        </div>
      )}

      {/* Users list */}
      <div className="space-y-2">
        {[...pendingUsers, ...otherUsers].map(user => (
          <div
            key={user.uid}
            className={`flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl border transition-colors ${
              user.role === 'pending'
                ? 'bg-amber-950/10 border-amber-500/20'
                : 'bg-[#0a0a0c] border-zinc-800 hover:border-zinc-700'
            }`}
          >
            {/* User info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400 flex-shrink-0 uppercase">
                {user.displayName?.[0] ?? user.email[0]}
              </div>
              <div className="min-w-0">
                <div className="text-sm text-zinc-200 font-medium truncate">{user.email}</div>
                <div className="text-[10px] font-mono text-zinc-600 mt-0.5">
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                  {user.approvedAt && ` · Approved ${new Date(user.approvedAt).toLocaleDateString()}`}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <RoleBadge role={user.role} />

              {/* Role dropdown */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === user.uid ? null : user.uid)}
                  disabled={updating === user.uid}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-colors disabled:opacity-40"
                >
                  {updating === user.uid ? '...' : 'Role'}
                  <ChevronDown size={11} />
                </button>

                {openDropdown === user.uid && (
                  <div className="absolute right-0 top-full mt-1 z-50 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden min-w-[120px]">
                    {(Object.keys(ROLE_CONFIG) as UserRole[]).filter(r => r !== user.role).map(role => {
                      const { label, Icon } = ROLE_CONFIG[role];
                      return (
                        <button
                          key={role}
                          onClick={() => setRole(user.uid, role)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors font-mono"
                        >
                          <Icon size={11} />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                onClick={() => deleteUser(user.uid)}
                aria-label="Delete user"
                className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="py-16 text-center">
          <p className="font-mono text-xs text-zinc-600">NO USERS YET.</p>
        </div>
      )}
    </div>
  );
};
