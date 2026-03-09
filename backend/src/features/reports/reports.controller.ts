import type { NextFunction, Request, Response } from 'express';

import type { GetMonthlyReportInput } from './reports.schema';
import reportsService from './reports.service';

class ReportsController {
  async getMonthlyReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await reportsService.getMonthlyReport(
        String(req.user?.id),
        req.query as unknown as GetMonthlyReportInput
      );

      return res.status(200).json({
        data: report,
      });
    } catch (error) {
      return next(error);
    }
  }
}

const reportsController = new ReportsController();

export default reportsController;
