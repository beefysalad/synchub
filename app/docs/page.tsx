import DocsComponent from '@/components/docs'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Documentation | Next.js Prisma Boilerplate',
  description: 'Complete documentation for the Next.js Prisma Boilerplate',
}
export default function DocsPage() {
  return <DocsComponent />
}
