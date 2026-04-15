import { Rocket } from 'lucide-react'

const Deployment = () => {
  return (
    <section id="deployment" className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-neutral-50 dark:text-neutral-900">
          <Rocket className="size-5" />
        </div>
        <h2 className="text-3xl font-bold">Deployment</h2>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-8 dark:border-neutral-800 dark:bg-neutral-900/30">
        <h3 className="mb-4 text-xl font-bold">Vercel (Recommended)</h3>
        <div className="space-y-2 text-sm text-zinc-600 dark:text-neutral-400">
          <p>1. Push to GitHub</p>
          <p>2. Import in Vercel</p>
          <p>
            3. Add Environment Variables (DATABASE_URL, Clerk publishable key,
            Clerk secret key, etc)
          </p>
          <p>4. Deploy!</p>
        </div>
        <div className="mt-6 border-l-4 border-blue-500 bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-900/20 dark:text-blue-100">
          <strong>Important:</strong> Set a secure{' '}
          <code className="font-mono">CLERK_SECRET_KEY</code> in production
          settings.
        </div>
      </div>
    </section>
  )
}

export default Deployment
