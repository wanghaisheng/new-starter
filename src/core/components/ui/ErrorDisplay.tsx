interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
}

export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full animate-fade-in">
      <p className="text-red-400 mb-4 font-medium">{error}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="px-6 py-2.5 bg-secondary-500 hover:bg-secondary-600 text-white rounded-full font-medium transition-colors duration-200 shadow-md"
        >
          Retry
        </button>
      )}
    </div>
  );
} 