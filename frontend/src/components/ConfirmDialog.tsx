interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  destructive?: boolean
}

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirmar',
  destructive = false,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{message}</p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 active:bg-gray-100 dark:border-gray-600 dark:text-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium text-white active:opacity-80 ${
              destructive ? 'bg-red-500' : 'bg-primary'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
