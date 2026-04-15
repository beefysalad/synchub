import { FileText } from 'lucide-react'

const Forms = () => {
  return (
    <section id="forms" className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-neutral-50 dark:text-neutral-900">
          <FileText className="size-5" />
        </div>
        <h2 className="text-3xl font-bold">Forms & Validation</h2>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-8 dark:border-neutral-800 dark:bg-neutral-900/30">
        <p className="mb-6 text-zinc-600 dark:text-neutral-400">
          Robust forms using <strong>React Hook Form</strong> paired with{' '}
          <strong>Zod</strong> schemas.
        </p>
        <div className="overflow-hidden rounded-xl bg-zinc-900 p-4 dark:bg-neutral-950">
          <pre className="overflow-x-auto text-sm text-zinc-300">
            <code>{`// lib/schemas/user.ts
export const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Component
const { register, handleSubmit } = useForm({
  resolver: zodResolver(userSchema)
});`}</code>
          </pre>
        </div>
      </div>
    </section>
  )
}

export default Forms
