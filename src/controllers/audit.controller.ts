import { Request, Response } from 'express';
import { getAuditLogs } from '../services/audit.service';

export const getAudits = async (req: Request, res: Response) => {
  try {
    const { page, limit, q, sortBy, sortDir, createdFrom, createdTo } = req.query;

    const result = await getAuditLogs({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      q: q ? String(q) : undefined,
      sortBy: sortBy === 'created_at' ? 'created_at' : undefined,
      sortDir: sortDir === 'asc' ? 'asc' : 'desc',
      createdFrom: createdFrom ? String(createdFrom) : undefined,
      createdTo: createdTo ? String(createdTo) : undefined,
    });

    return res.json({
      success: true,
      message: 'Audit logs fetched successfully',
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: (error as Error).message,
    });
  }
};
