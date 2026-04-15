import { userService } from '@/lib/services/user-service'
import DashboardComponent from '@/components/dashboard'

const DashboardPage = async () => {
  const user = await userService.syncCurrentUserToDatabase()

  return <DashboardComponent user={user} />
}

export default DashboardPage
