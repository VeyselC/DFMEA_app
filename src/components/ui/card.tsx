export function Card({ children }: any) {
  return <div className="bg-white shadow rounded p-4">{children}</div>;
}

export function CardContent({ children, className = '' }: any) {
  return <div className={className}>{children}</div>;
}
