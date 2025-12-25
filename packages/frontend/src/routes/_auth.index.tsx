import { createFileRoute } from '@tanstack/react-router'
import { Sidebar } from '@/components/layout/Sidebar'
import { ConfigForm } from '@/components/dashboard/ConfigForm'

export const Route = createFileRoute('/_auth/')({
  component: Dashboard,
})

function Dashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Sidebar />
      <div className="lg:col-span-2">
        <ConfigForm />
      </div>
    </div>
  )
}
