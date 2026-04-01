import type { NextFunction, Request, Response } from 'express';

import workspaceService from './workspace.service';

class WorkspaceController {
  reset = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      await workspaceService.resetAll(_req.user!.id);

      return res.status(200).json({
        data: { reset: true },
        message: 'Workspace cleared and reset successfully',
      });
    } catch (error) {
      return next(error);
    }
  };
}

const workspaceController = new WorkspaceController();

export default workspaceController;
