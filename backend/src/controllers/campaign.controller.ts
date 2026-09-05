import { Request, Response } from 'express';
import { analyzeCampaignCorrelations } from '../services/campaign.service';

export const getCampaigns = async (req: Request, res: Response): Promise<void> => {
  try {
    const correlationData = await analyzeCampaignCorrelations();
    res.json({
      status: 'success',
      data: correlationData,
    });
  } catch (error: any) {
    console.error('Campaign correlation calculation failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to compute multi-email campaign correlations: ' + (error.message || 'Unknown error'),
    });
  }
};
