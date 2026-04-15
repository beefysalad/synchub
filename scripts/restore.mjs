import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const projectRoot = path.join(__dirname, '..')
const sampleContentDir = path.join(projectRoot, '_sample_content')

if (!fs.existsSync(sampleContentDir)) {
  console.log('No _sample_content directory found. Nothing to restore.')
  process.exit(0)
}

const itemsToRestore = [
  'app/docs',
  'components/docs',
  'components/landing',
  'components/dashboard',
  'app/page.tsx',
  'app/dashboard/page.tsx',
]

console.log('Restoring from _sample_content directory...')

itemsToRestore.forEach((itemPath) => {
  const sourcePath = path.join(sampleContentDir, itemPath)
  if (fs.existsSync(sourcePath)) {
    const destPath = path.join(projectRoot, itemPath)
    const targetDir = path.dirname(destPath)

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    if (fs.existsSync(destPath) && fs.statSync(destPath).isFile()) {
      fs.rmSync(destPath)
    }

    fs.renameSync(sourcePath, destPath)
    console.log(`Restored: ${itemPath}`)
  } else {
    console.log(`Skipped: ${itemPath} (not found in _sample_content)`)
  }
})

const cleanEmptyFoldersRecursively = (folder) => {
  if (!fs.existsSync(folder)) return

  const files = fs.readdirSync(folder)
  if (files.length > 0) {
    files.forEach((file) => {
      const fullPath = path.join(folder, file)
      if (fs.statSync(fullPath).isDirectory()) {
        cleanEmptyFoldersRecursively(fullPath)
      }
    })

    if (fs.readdirSync(folder).length === 0) {
      fs.rmdirSync(folder)
    }
  } else {
    fs.rmdirSync(folder)
  }
}

cleanEmptyFoldersRecursively(sampleContentDir)

if (!fs.existsSync(sampleContentDir)) {
  console.log('Removed empty _sample_content directory.')
}

console.log('Restore complete!')
