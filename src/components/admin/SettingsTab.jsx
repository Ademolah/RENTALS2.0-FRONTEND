export default function SettingsTab() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 md:p-8 max-w-2xl">
      <h2 className="text-xl font-display font-bold text-brand-dark mb-4">Platform rules</h2>
      <ul className="space-y-3 text-base text-brand-text-secondary">
        <li>Guests pay the listed price. The 5% commission is taken from the host payout (host receives 95%).</li>
        <li>Chauffeur service: N25,000 per 12 hours.</li>
        <li>Hosts and guests never see each other's personal details.</li>
        <li>Payouts are released after both sides confirm arrival.</li>
      </ul>
      <p className="mt-6 text-sm text-brand-text-muted">These rules are set on the server and shown here for reference.</p>
    </div>
  );
}
