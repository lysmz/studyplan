import { SessionService } from '../../auth/session.service'
import { DashboardService } from '../../services/dashboard.service'
import { definePartialApiHandlers, type PartialApiHandlerRegistry } from '../api-dispatcher'
import { authenticated } from '../authenticated'

export function createDashboardHandlers(
  dashboardService: DashboardService,
  sessionService: SessionService
): PartialApiHandlerRegistry {
  return definePartialApiHandlers({
    getDashboardStats: authenticated<'getDashboardStats'>(sessionService, (_input, userId) =>
      dashboardService.getDashboardStats(userId)
    ),

    getDashboardUpcoming: authenticated<'getDashboardUpcoming'>(sessionService, (_input, userId) =>
      dashboardService.getDashboardUpcoming(userId)
    ),

    getDashboardActivity: authenticated<'getDashboardActivity'>(sessionService, (_input, userId) =>
      dashboardService.getDashboardActivity(userId)
    )
  })
}
