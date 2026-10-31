export default function NoticeBanner({ notice }) {
  if (!notice) return null;
  const tone = notice.type === 'success'
    ? 'bg-status-available-soft text-status-available border-status-available/20'
    : 'bg-red-50 text-red-700 border-red-200';
  return (
    <div role="alert" className={`mb-6 px-5 py-4 rounded-xl text-base font-semibold border ${tone}`}>
      {notice.message}
    </div>
  );
}
