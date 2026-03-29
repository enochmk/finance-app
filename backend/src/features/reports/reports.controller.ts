import type { NextFunction, Request, Response } from 'express';

import type { GetMonthlyReportQuery } from './reports.schema';
import reportsService from './reports.service';

type EmptyObject = Record<string, never>;
type GetMonthlyReportRequest = Request<
  EmptyObject,
  unknown,
  EmptyObject,
  GetMonthlyReportQuery
>;

class ReportsController {
  getMonthlyReport = async (
    req: GetMonthlyReportRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const report = await reportsService.getMonthlyReport(
        req.user!.id,
        req.query
      );

      return res.status(200).json({
        data: report,
      });
    } catch (error) {
      return next(error);
    }
  };
}

const reportsController = new ReportsController();

export default reportsController;
