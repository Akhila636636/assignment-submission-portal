const VARIANTS = {
  pending:  'badge-pending',
  graded:   'badge-graded',
  archived: 'badge-archived',
};

const DOTS = {
  pending:  '⏳',
  graded:   '✅',
  archived: '📁',
};

export default function Badge({ status }) {
  const cls = VARIANTS[status] || 'badge-pending';
  return (
    <span className={`badge ${cls}`}>
      {DOTS[status]} {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}
