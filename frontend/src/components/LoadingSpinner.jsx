export default function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizes = { sm: 24, md: 40, lg: 56 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
      <div style={{
        width: sizes[size], height: sizes[size],
        border: '3px solid var(--border-default)',
        borderTopColor: 'var(--primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        marginBottom: '1rem',
      }} />
      {text && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{text}</p>}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
