import type { NextFunction, Request, Response } from 'express';

import dashboardService from './dashboard.service';
import type { GetDashboardSummaryInput } from './dashboard.schema';

class DashboardController {
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await dashboardService.getSummary(
        String(req.user?.id),
        req.query as unknown as GetDashboardSummaryInput
      );

      return res.status(200).json({
        data: summary,
      });
    } catch (error) {
      return next(error);
    }
  }
}

const dashboardController = new DashboardController();

export default dashboardController;
