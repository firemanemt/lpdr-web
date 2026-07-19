export default function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizes = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-3',
    lg: 'h-16 w-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className={`${sizes[size]} rounded-full border-gray-300 border-t-emerald-500 animate-spin mb-4`} />
      {text && <p className="text-gray-500 text-sm">{text}</p>}
    </div>
  );
}
