import { useState } from 'react'
import { useRules, useCreateRule, useUpdateRule, useDeleteRule } from '@/hooks/useRules'
import { useCategories } from '@/hooks/useCategories'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import type { AutoRule } from '@/lib/types'

export function RulesPage() {
  const { data: rules, isLoading } = useRules()
  const { data: categories } = useCategories()
  const createMutation = useCreateRule()
  const updateMutation = useUpdateRule()
  const deleteMutation = useDeleteRule()

  const [editing, setEditing] = useState<AutoRule | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState<AutoRule | null>(null)

  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('')
  const [subcategory, setSubcategory] = useState('')

  function openCreate() {
    setEditing(null)
    setKeyword('')
    setCategory(categories?.[0]?.name ?? '')
    setSubcategory('')
    setShowForm(true)
  }

  function openEdit(rule: AutoRule) {
    setEditing(rule)
    setKeyword(rule.keyword)
    setCategory(rule.category)
    setSubcategory(rule.subcategory ?? '')
    setShowForm(true)
  }

  async function handleSave() {
    if (!keyword.trim() || !category) return
    const payload = {
      keyword: keyword.trim(),
      category,
      subcategory: subcategory.trim() || undefined,
    }
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
    setShowForm(false)
  }

  async function handleDelete() {
    if (!deleting) return
    await deleteMutation.mutateAsync(deleting.id)
    setDeleting(null)
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Regras automáticas</h1>
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
      ) : rules?.length ? (
        <div className="space-y-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  "{rule.keyword}"
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  → {rule.category}
                  {rule.subcategory && ` / ${rule.subcategory}`}
                </p>
              </div>
              <button
                onClick={() => openEdit(rule)}
                className="px-2 text-sm text-gray-400 active:text-gray-600"
              >
                Editar
              </button>
              <button
                onClick={() => setDeleting(rule)}
                className="px-2 text-sm text-red-400 active:text-red-600"
              >
                Excluir
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhuma regra"
          description="Regras categorizam despesas automaticamente"
          action={{ label: 'Criar regra', onClick: openCreate }}
        />
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="w-full max-w-sm rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {editing ? 'Editar regra' : 'Nova regra'}
            </h3>
            <div className="space-y-3">
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Palavra-chave (ex: iFood)"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                autoFocus
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Selecionar categoria</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <input
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="Subcategoria (opcional)"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-700 dark:border-gray-600 dark:text-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!keyword.trim() || !category}
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
        title="Excluir regra"
        message={`Deseja excluir a regra "${deleting?.keyword}"?`}
        confirmLabel="Excluir"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
