import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getGeoThreats = async (req: Request, res: Response): Promise<void> => {
  try {
    const reports = await prisma.analysisReport.findMany({
      select: {
        id: true,
        emailId: true,
        severity: true,
        riskScore: true,
        routeAnalysis: true,
        email: {
          select: {
            subject: true,
            from: true
          }
        }
      }
    });

    const locations: any[] = [];
    const arcs: any[] = [];

    reports.forEach(report => {
      if (report.routeAnalysis) {
        const route = report.routeAnalysis as any;
        if (route.hops && Array.isArray(route.hops)) {
          // Add points
          route.hops.forEach((hop: any) => {
            if (hop.geo && hop.geo.lat && hop.geo.lon) {
              locations.push({
                emailId: report.emailId,
                subject: report.email?.subject || "Unknown",
                from: report.email?.from || "Unknown",
                severity: report.severity,
                riskScore: report.riskScore,
                lat: hop.geo.lat,
                lng: hop.geo.lon, // react-globe.gl uses lng
                city: hop.geo.city || 'Unknown',
                country: hop.geo.country || 'Unknown',
                ip: hop.ip
              });
            }
          });

          // Add arcs between consecutive hops
          for (let i = 0; i < route.hops.length - 1; i++) {
            const start = route.hops[i];
            const end = route.hops[i + 1];
            if (start.geo && start.geo.lat && start.geo.lon && end.geo && end.geo.lat && end.geo.lon) {
              arcs.push({
                emailId: report.emailId,
                severity: report.severity,
                startLat: start.geo.lat,
                startLng: start.geo.lon,
                endLat: end.geo.lat,
                endLng: end.geo.lon,
                color: report.severity === 'HIGH' ? 'rgba(244, 63, 94, 0.6)' : 
                       report.severity === 'MEDIUM' ? 'rgba(245, 158, 11, 0.4)' : 
                       'rgba(16, 185, 129, 0.2)'
              });
            }
          }
        }
      }
    });

    res.json({
      status: 'success',
      data: {
        locations,
        arcs
      }
    });
  } catch (error: any) {
    console.error('Error fetching geo threats:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch geo threats' });
  }
};
