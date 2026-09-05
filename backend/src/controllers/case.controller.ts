import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createCase = async (req: Request, res: Response) => {
  try {
    const { name, description, priority } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Case name is required' });
    }

    const newCase = await prisma.case.create({
      data: {
        name,
        description,
        priority: priority || 'MEDIUM',
        status: 'OPEN'
      }
    });

    // Create Audit Log for Case Creation
    await prisma.auditLog.create({
      data: {
        caseId: newCase.id,
        action: 'CASE_CREATED',
        details: { name, description, priority },
        performedBy: 'SYSTEM_USER'
      }
    });

    return res.status(201).json({ success: true, data: newCase });
  } catch (error) {
    console.error('Error creating case:', error);
    return res.status(500).json({ success: false, message: 'Failed to create case' });
  }
};

export const getAllCases = async (req: Request, res: Response) => {
  try {
    const cases = await prisma.case.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { emails: true }
        }
      }
    });
    return res.status(200).json({ success: true, data: cases });
  } catch (error) {
    console.error('Error fetching cases:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch cases' });
  }
};

export const getCaseById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const caseItem = await prisma.case.findUnique({
      where: { id },
      include: {
        emails: {
          include: {
            analysisReport: true
          }
        },
        auditLogs: {
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    if (!caseItem) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    return res.status(200).json({ success: true, data: caseItem });
  } catch (error) {
    console.error('Error fetching case:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch case' });
  }
};

export const updateCase = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, description, status, priority } = req.body;

    const updatedCase = await prisma.case.update({
      where: { id },
      data: {
        name,
        description,
        status,
        priority
      }
    });

    await prisma.auditLog.create({
      data: {
        caseId: id,
        action: 'CASE_UPDATED',
        details: { status, priority, name },
        performedBy: 'SYSTEM_USER'
      }
    });

    return res.status(200).json({ success: true, data: updatedCase });
  } catch (error) {
    console.error('Error updating case:', error);
    return res.status(500).json({ success: false, message: 'Failed to update case' });
  }
};

export const assignEmailToCase = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { emailId } = req.body;

    if (!emailId) {
      return res.status(400).json({ success: false, message: 'emailId is required' });
    }

    // Assign email to case
    const updatedEmail = await prisma.email.update({
      where: { id: emailId },
      data: {
        caseId: id
      }
    });

    // Create Audit Log for Evidence Addition
    await prisma.auditLog.create({
      data: {
        caseId: id,
        emailId: emailId,
        action: 'EVIDENCE_ASSIGNED',
        details: { emailFilename: updatedEmail.filename, sha256Hash: updatedEmail.sha256Hash },
        performedBy: 'SYSTEM_USER'
      }
    });

    return res.status(200).json({ success: true, message: 'Email assigned to case successfully', data: updatedEmail });
  } catch (error) {
    console.error('Error assigning email to case:', error);
    return res.status(500).json({ success: false, message: 'Failed to assign email to case' });
  }
};

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const logs = await prisma.auditLog.findMany({
      where: { caseId: id },
      orderBy: { timestamp: 'desc' },
      include: {
        email: {
          select: { filename: true, sha256Hash: true }
        }
      }
    });
    return res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
};
