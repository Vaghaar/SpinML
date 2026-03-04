'use client';

import { useRouter } from 'next/navigation';
import { motion }    from 'framer-motion';

export default function LegalPage() {
  const router = useRouter();

  return (
    <div className="min-h-dvh bg-dark-bg pb-20">
      <div className="sticky top-0 bg-dark-bg/80 backdrop-blur-md border-b border-white/5 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-white text-sm">← Retour</button>
          <h1 className="font-title font-bold text-white flex-1 text-center">Mentions légales & RGPD</h1>
          <span className="w-16" />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto px-4 pt-8 prose prose-invert prose-sm"
      >
        <section className="glass rounded-2xl p-6 mb-4">
          <h2 className="font-title text-white text-lg font-bold mb-3">Éditeur</h2>
          <p className="text-slate-400 text-sm">
            SpinMyLunch est une application web de choix de repas collaboratif.
            Ce service est fourni à titre indicatif.
          </p>
        </section>

        <section className="glass rounded-2xl p-6 mb-4">
          <h2 className="font-title text-white text-lg font-bold mb-3">Données personnelles (RGPD)</h2>
          <div className="space-y-3 text-slate-400 text-sm">
            <p><strong className="text-white">Données collectées :</strong> adresse email, nom, photo de profil (via Google OAuth), historique des spins et votes.</p>
            <p><strong className="text-white">Finalité :</strong> Authentification, fonctionnement du service, gamification.</p>
            <p><strong className="text-white">Base légale :</strong> Exécution du contrat (utilisation du service).</p>
            <p><strong className="text-white">Conservation :</strong> 12 mois d&apos;inactivité, puis anonymisation automatique.</p>
            <p><strong className="text-white">Vos droits :</strong> Vous pouvez exporter ou supprimer vos données depuis votre profil à tout moment.</p>
            <p><strong className="text-white">Cookies :</strong> Un cookie httpOnly sécurisé est utilisé pour le maintien de session (token de rafraîchissement). Aucun cookie de tracking.</p>
          </div>
        </section>

        <section className="glass rounded-2xl p-6 mb-4">
          <h2 className="font-title text-white text-lg font-bold mb-3">Sécurité</h2>
          <ul className="text-slate-400 text-sm space-y-1 list-disc list-inside">
            <li>Authentification via Google OAuth 2.0 (aucun mot de passe stocké)</li>
            <li>Tokens JWT HS256 (15 min) + refresh tokens chiffrés (7 jours)</li>
            <li>Toutes les communications chiffrées via HTTPS/TLS</li>
            <li>Protection CSRF sur le flux OAuth (paramètre state)</li>
            <li>Rate limiting sur les actions sensibles (spins, votes)</li>
          </ul>
        </section>

        <section className="glass rounded-2xl p-6">
          <h2 className="font-title text-white text-lg font-bold mb-3">Contact</h2>
          <p className="text-slate-400 text-sm">
            Pour toute question relative à vos données personnelles, contactez-nous via les paramètres de votre profil (option &quot;Exporter mes données&quot;).
          </p>
        </section>
      </motion.div>
    </div>
  );
}
