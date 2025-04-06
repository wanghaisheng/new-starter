interface ErrorScreenProps {
  error: Error;
  onRetry?: () => void;
}

export function ErrorScreen({ error, onRetry }: ErrorScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 px-4">
      <div className="text-red-500 text-6xl mb-4">⚠️</div>
      <h1 className="text-xl font-semibold text-white mb-2">出错了</h1>
      <p className="text-gray-300 text-center mb-6">{error.message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          重试
        </button>
      )}
    </div>
  );
} 