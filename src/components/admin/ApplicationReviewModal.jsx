import { ReviewModalShell, ReviewFooter } from './ReviewModalParts';

function Field({ label, value }) {
  return (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
      <span className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-1">{label}</span>
      <span className="text-sm font-bold text-brand-dark">{value}</span>
    </div>
  );
}

export default function ApplicationReviewModal({ application, busy, onClose, onApprove, onReject }) {
  const fullName = application.user ? `${application.user.firstName || ''} ${application.user.lastName || ''}` : 'N/A';

  return (
    <ReviewModalShell
      title="Application Review"
      subtitle={`ID: ${application._id}`}
      widthClass="max-w-2xl"
      bodyClass="space-y-6 md:space-y-8"
      onClose={onClose}
      footer={(
        <ReviewFooter
          busy={busy}
          onReject={() => onReject(application._id)}
          onApprove={() => onApprove(application._id)}
          rejectLabel="Reject"
          approveLabel="Approve Host"
        />
      )}
    >
      <div>
        <h3 className="text-xs font-display font-bold uppercase tracking-widest text-brand-text-muted mb-3 md:mb-4">Applicant Identity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <Field label="Full Name" value={fullName} />
          <Field label="NIN / ID Number" value={application.nin || 'Not Provided'} />
        </div>
      </div>
    </ReviewModalShell>
  );
}
