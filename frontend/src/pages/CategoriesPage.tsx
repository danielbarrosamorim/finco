import { useState } from 'react'
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import type { Category } from '@/lib/types'

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6',
  '#8B5CF6', '#EC4899', '#6B7280', '#94A3B8',
]

export function CategoriesPage() {
  const { data: categories, isLoading } = useCategories()
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const deleteMutation = useDeleteCategory()

  const [editing, setEditing] = useState<Category | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState<Category | null>(null)

  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])

  function openCreate() {
    setEditing(null)
    setName('')
    setColor(PRESET_COLORS[0])
    setShowForm(true)
  }

  function openEdit(cat: Category) {
    setEditing(cat)
    setName(cat.name)
    setColor(cat.color ?? PRESET_COLORS[0])
    setShowForm(true)
  }

  async function handleSave() {
    if (!name.trim()) return
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, name: name.trim(), color })
    } else {
      await createMutation.mutateAsync({ name: name.trim(), color })
    }
    setShowForm(false)
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await deleteMutation.mutateAsync(deleting.id)
    } catch {
      // error shown by mutation
    }
    setDeleting(null)
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Categorias</h1>
        <button
          onClick={openCreate}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white active:opacity-80"
        >
          + Nova
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
        </div>
      ) : categories?.length ? (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800"
            >
              <div
                className="h-8 w-8 shrink-0 rounded-full"
                style={{ backgroundColor: cat.color ?? '#94A3B8' }}
              />
              <span className="flex-1 font-medium text-gray-900 dark:text-white">{cat.name}</span>
              <button
                onClick={() => openEdit(cat)}
                className="px-2 text-sm text-gray-400 active:text-gray-600"
              >
                Editar
              </button>
              <button
                onClick={() => setDeleting(cat)}
                className="px-2 text-sm text-red-400 active:text-red-600"
              >
                Excluir
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhuma categoria"
          action={{ label: 'Criar categoria', onClick: openCreate }}
        />
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="w-full max-w-sm rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {editing ? 'Editar categoria' : 'Nova categoria'}
            </h3>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome da categoria"
              className="mb-4 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              autoFocus
            />
            <div className="mb-4 flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full ${color === c ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-700 dark:border-gray-600 dark:text-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim()}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-medium text-white disabled:opacity-50"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Excluir categoria"
        message={`Deseja excluir "${deleting?.name}"?`}
        confirmLabel="Excluir"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
