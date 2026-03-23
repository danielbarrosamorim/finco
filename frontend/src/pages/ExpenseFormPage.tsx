import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { useCategories } from '@/hooks/useCategories'
import { useExpense, useCreateExpense, useUpdateExpense, useDeleteExpense } from '@/hooks/useExpenses'
import { CurrencyInput } from '@/components/CurrencyInput'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useState } from 'react'

interface FormData {
  description: string
  amount: number
  date: string
  category: string
  subcategory: string
  installment_num: string
  installment_total: string
}

export function ExpenseFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id

  const { data: expense } = useExpense(id)
  const { data: categories } = useCategories()
  const createMutation = useCreateExpense()
  const updateMutation = useUpdateExpense()
  const deleteMutation = useDeleteExpense()

  const [showDelete, setShowDelete] = useState(false)
  const [showInstallments, setShowInstallments] = useState(false)

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      description: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      category: '',
      subcategory: '',
      installment_num: '',
      installment_total: '',
    },
  })

  useEffect(() => {
    if (expense) {
      reset({
        description: expense.description,
        amount: expense.amount,
        date: expense.date,
        category: expense.category ?? '',
        subcategory: expense.subcategory ?? '',
        installment_num: expense.installment_num?.toString() ?? '',
        installment_total: expense.installment_total?.toString() ?? '',
      })
      if (expense.installment_num) setShowInstallments(true)
    }
  }, [expense, reset])

  const onSubmit = async (data: FormData) => {
    const payload = {
      description: data.description,
      amount: data.amount,
      date: data.date,
      category: data.category || undefined,
      subcategory: data.subcategory || undefined,
      installment_num: data.installment_num ? parseInt(data.installment_num) : undefined,
      installment_total: data.installment_total ? parseInt(data.installment_total) : undefined,
    }

    if (isEditing) {
      await updateMutation.mutateAsync({ id, ...payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
    navigate('/expenses')
  }

  const handleDelete = async () => {
    if (!id) return
    await deleteMutation.mutateAsync(id)
    navigate('/expenses')
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 active:text-gray-700 dark:text-gray-400"
        >
          ← Voltar
        </button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          {isEditing ? 'Editar despesa' : 'Nova despesa'}
        </h1>
        <div className="w-12" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Amount */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Valor
          </label>
          <Controller
            name="amount"
            control={control}
            rules={{ validate: (v) => v > 0 || 'Valor é obrigatório' }}
            render={({ field }) => (
              <CurrencyInput value={field.value} onChange={field.onChange} />
            )}
          />
          {errors.amount && (
            <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Descrição
          </label>
          <input
            {...register('description', { required: 'Descrição é obrigatória' })}
            placeholder="Ex: iFood, Uber, Mercado..."
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Data
          </label>
          <input
            type="date"
            {...register('date', { required: 'Data é obrigatória' })}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Category */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Categoria
          </label>
          <select
            {...register('category')}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Auto-categorizar</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-400">
            Deixe vazio para categorização automática
          </p>
        </div>

        {/* Subcategory */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Subcategoria
          </label>
          <input
            {...register('subcategory')}
            placeholder="Ex: Delivery, Streaming..."
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Installments toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowInstallments(!showInstallments)}
            className="text-sm text-primary active:opacity-70"
          >
            {showInstallments ? '− Remover parcelamento' : '+ Parcelamento'}
          </button>
        </div>

        {showInstallments && (
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">Parcela</label>
              <input
                type="number"
                min="1"
                {...register('installment_num')}
                placeholder="1"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">de</label>
              <input
                type="number"
                min="1"
                {...register('installment_total')}
                placeholder="12"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-white active:opacity-80 disabled:opacity-50"
        >
          {isPending ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Adicionar despesa'}
        </button>

        {isEditing && (
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="w-full rounded-xl border border-red-300 py-3 text-sm font-medium text-red-500 active:bg-red-50"
          >
            Excluir despesa
          </button>
        )}
      </form>

      <ConfirmDialog
        open={showDelete}
        title="Excluir despesa"
        message="Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  )
}
