import type { NextFunction, Request, Response } from 'express';

import dashboardService from './dashboard.service';
import type { GetDashboardSummaryQuery } from './dashboard.schema';

type EmptyObject = Record<string, never>;
type GetDashboardSummaryRequest = Request<
  EmptyObject,
  unknown,
  EmptyObject,
  GetDashboardSummaryQuery
>;

class DashboardController {
  getSummary = async (
    req: GetDashboardSummaryRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const summary = await dashboardService.getSummary(
        req.user!.id,
        req.query
      );

      return res.status(200).json({
        data: summary,
      });
    } catch (error) {
      return next(error);
    }
  };
}

const dashboardController = new DashboardController();

export default dashboardController;
