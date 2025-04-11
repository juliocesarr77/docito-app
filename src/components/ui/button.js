export function Button({ children, onClick, className = '', type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg shadow transition ${className}`}
    >
      {children}
    </button>
  );
}