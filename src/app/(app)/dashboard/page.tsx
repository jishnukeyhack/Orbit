'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const resolveRoute = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        if (!mounted) return;

        let encryptionKey = user.user_metadata?.encryption_key;

        // If user doesn't have an encryption key, let's generate one and save it dynamically!
        if (!encryptionKey) {
          const chars = 'abcdef0123456789';
          let generatedKey = '';
          for (let i = 0; i < 16; i++) {
            generatedKey += chars[Math.floor(Math.random() * chars.length)];
          }
          encryptionKey = generatedKey;

          // Save key inside user metadata in Supabase Auth
          await supabase.auth.updateUser({
            data: { ...user.user_metadata, encryption_key: generatedKey }
          });
        }

        // Check for pending landing page redirect target (e.g. /swarms, /workflows, /agents)
        const nextTarget = localStorage.getItem("orbit_redirect_target");
        if (nextTarget) {
          localStorage.removeItem("orbit_redirect_target");
          router.replace(`${nextTarget}/${encryptionKey}`);
        } else {
          router.replace(`/dashboard/${encryptionKey}`);
        }
      } catch (err) {
        console.error('Error resolving secure dashboard key:', err);
        router.push('/login');
      }
    };

    resolveRoute();

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(79,140,255,0.2)', borderTopColor: 'var(--accent-blue)', animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Establishing secure encrypted context...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
