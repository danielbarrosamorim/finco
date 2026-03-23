interface EmptyStateProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-4">📭</div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white active:opacity-80"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
