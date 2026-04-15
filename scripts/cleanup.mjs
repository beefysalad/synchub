import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const projectRoot = path.join(__dirname, '..')
const sampleContentDir = path.join(projectRoot, '_sample_content')

if (!fs.existsSync(sampleContentDir)) {
  fs.mkdirSync(sampleContentDir, { recursive: true })
}

const itemsToMove = [
  'app/docs',
  'components/docs',
  'components/landing',
  'components/dashboard',
]

console.log('Moving sample content to _sample_content directory...')

itemsToMove.forEach((itemPath) => {
  const sourcePath = path.join(projectRoot, itemPath)
  if (fs.existsSync(sourcePath)) {
    const destPath = path.join(sampleContentDir, itemPath)
    const targetDir = path.dirname(destPath)

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    fs.renameSync(sourcePath, destPath)
    console.log(`Moved: ${itemPath}`)
  } else {
    console.log(`Skipped: ${itemPath} (not found)`)
  }
})

console.log('Overwriting sample pages with minimal boilerplate...')

const appPagePath = path.join(projectRoot, 'app/page.tsx')
const appPageContent = `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Next.js Boilerplate</h1>
      <p className="mt-4 text-xl">Get started by editing <code>app/page.tsx</code></p>
    </main>
  )
}
`
if (fs.existsSync(appPagePath)) {
  const oldAppPageDest = path.join(sampleContentDir, 'app/page.tsx')
  const oldAppPageDir = path.dirname(oldAppPageDest)
  if (!fs.existsSync(oldAppPageDir))
    fs.mkdirSync(oldAppPageDir, { recursive: true })
  fs.copyFileSync(appPagePath, oldAppPageDest)

  fs.writeFileSync(appPagePath, appPageContent)
  console.log('Reset: app/page.tsx')
}

// Overwrite app/dashboard/page.tsx
const appDashboardPagePath = path.join(projectRoot, 'app/dashboard/page.tsx')
const appDashboardPageContent = `export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full items-center justify-center mt-20">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">Minimal dashboard page</p>
    </div>
  )
}
`
if (fs.existsSync(appDashboardPagePath)) {
  const oldDashDest = path.join(sampleContentDir, 'app/dashboard/page.tsx')
  const oldDashDir = path.dirname(oldDashDest)
  if (!fs.existsSync(oldDashDir)) fs.mkdirSync(oldDashDir, { recursive: true })
  fs.copyFileSync(appDashboardPagePath, oldDashDest)

  fs.writeFileSync(appDashboardPagePath, appDashboardPageContent)
  console.log('Reset: app/dashboard/page.tsx')
}

console.log(
  'Cleanup complete! Check the _sample_content directory for the previous sample components and pages.'
)
