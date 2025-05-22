export function Button({ children, className = '', variant, ...props }: any) {
  const base =
    variant === 'destructive'
      ? 'bg-red-500 hover:bg-red-600 text-white'
      : variant === 'outline'
      ? 'border border-gray-400 text-gray-800'
      : 'bg-blue-500 hover:bg-blue-600 text-white';

  return (
    <button className={`${base} px-3 py-1 rounded ${className}`} {...props}>
      {children}
    </button>
  );
}
