import React, { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { Mail, Trash2, UserRound } from 'lucide-react';
import { db } from '../../firebase';
import { AccessRequest } from '../../types';

export const RequestsTab: React.FC = () => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'accessRequests'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AccessRequest)));
      setLoading(false);
    }, () => {
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const deleteRequest = async (id: string, email: string) => {
    if (!window.confirm(`Delete access request from ${email}?`)) return;
    await deleteDoc(doc(db, 'accessRequests', id));
  };

  if (loading) {
    return (
      <div className="py-16 text-center font-mono text-xs text-zinc-600 animate-pulse">
        LOADING ACCESS REQUESTS...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-[#0a0a0c] px-4 py-3">
        <div>
          <h2 className="font-orbitron text-sm font-bold uppercase tracking-wider text-zinc-100">
            Vault Access Requests
          </h2>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600">
            {requests.length} saved lead{requests.length === 1 ? '' : 's'}
          </p>
        </div>
        <Mail size={18} className="text-cyan-400" />
      </div>

      {requests.length > 0 ? (
        <div className="space-y-2">
          {requests.map(request => (
            <div
              key={request.id}
              className="group flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-[#0a0a0c] px-4 py-3.5 transition-colors hover:border-zinc-700"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-500">
                  <UserRound size={15} />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-zinc-200">{request.name}</div>
                  <a
                    href={`mailto:${request.email}`}
                    className="mt-0.5 block truncate font-mono text-xs text-cyan-500/80 hover:text-cyan-300"
                  >
                    {request.email}
                  </a>
                </div>
              </div>

              <div className="flex flex-shrink-0 items-center gap-3">
                <div className="hidden text-right font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-700 sm:block">
                  {new Date(request.createdAt).toLocaleDateString()}
                </div>
                <button
                  onClick={() => deleteRequest(request.id, request.email)}
                  aria-label={`Delete request from ${request.email}`}
                  className="rounded-lg p-1.5 text-zinc-700 opacity-100 transition-colors hover:bg-red-950/30 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-800 py-16 text-center">
          <Mail size={24} className="mx-auto mb-3 text-zinc-700" />
          <p className="font-mono text-xs text-zinc-600">NO ACCESS REQUESTS YET.</p>
        </div>
      )}
    </div>
  );
};
