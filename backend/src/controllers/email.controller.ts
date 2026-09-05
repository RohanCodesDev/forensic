import { Request, Response } from 'express';
import { simpleParser } from 'mailparser';
import { PrismaClient } from '@prisma/client';
import { runFullAnalysis } from '../services/analysis.service';
import { parseRawEmail } from '../services/ingestion.service';

const prisma = new PrismaClient();

export const uploadEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ status: 'error', message: 'No file uploaded' });
      return;
    }

    if (!req.file.originalname.endsWith('.eml')) {
      res.status(400).json({ status: 'error', message: 'Only .eml files are supported' });
      return;
    }

    // Pass buffer to ingestion service to extract everything
    const ingestion = await parseRawEmail(req.file.buffer);
    
    const emailDataWithFilename = {
      ...ingestion.emailData,
      filename: req.file.originalname,
    };

    // Run deep forensics using the parsed data
    const analysisResult = await runFullAnalysis(emailDataWithFilename, ingestion.parsed, ingestion.attachments);

    // Save evidence immutably to PostgreSQL along with complete analysis report
    const savedEmail = await prisma.email.create({
      data: {
        filename: req.file.originalname,
        sha256Hash: ingestion.sha256Hash,
        from: emailDataWithFilename.from,
        to: emailDataWithFilename.to,
        cc: emailDataWithFilename.cc,
        subject: emailDataWithFilename.subject,
        date: emailDataWithFilename.date,
        messageId: emailDataWithFilename.messageId,
        replyTo: emailDataWithFilename.replyTo,
        returnPath: emailDataWithFilename.returnPath,
        textBodySnippet: emailDataWithFilename.textBodySnippet,
        htmlBodyExists: emailDataWithFilename.htmlBodyExists,
        attachmentCount: emailDataWithFilename.attachmentCount,
        receivedHeaders: emailDataWithFilename.receivedHeaders,
        spfResult: ingestion.spfResult,
        dkimResult: ingestion.dkimResult,
        dmarcResult: ingestion.dmarcResult,
        analysisReport: {
          create: {
            threatLevel: analysisResult.threatLevel,
            riskScore: analysisResult.riskEvaluation?.score || 0,
            severity: analysisResult.riskEvaluation?.severity || 'LOW',
            summary: analysisResult.riskEvaluation?.summary || '',
            anomalies: analysisResult.anomalies as any,
            riskFactors: (analysisResult.riskEvaluation?.factors || []) as any,
            domainAnalysis: (analysisResult.domainAnalysis || {}) as any,
            urlAnalysis: (analysisResult.urlAnalysis || []) as any,
            routeAnalysis: (analysisResult.routeAnalysis || {}) as any,
            threatIntel: (analysisResult.threatIntel || []) as any,
            attachments: (ingestion.attachments || []) as any,
            nlpAnalysis: (analysisResult.nlpAnalysis || {}) as any,
            aiAnalysis: (analysisResult.aiAnalysis || {}) as any,
          }
        }
      },
      include: {
        analysisReport: true
      }
    });

    res.json({
      status: 'success',
      message: 'Evidence and full forensic report securely preserved in PostgreSQL.',
      data: savedEmail,
      analysis: analysisResult
    });
  } catch (error: any) {
    console.error('Email parsing error details:', error);
    res.status(500).json({ status: 'error', message: 'Failed to parse email: ' + (error.message || 'Unknown error') });
  }
};

export const getAllEmails = async (req: Request, res: Response): Promise<void> => {
  try {
    const emails = await prisma.email.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        filename: true,
        sha256Hash: true,
        from: true,
        to: true,
        subject: true,
        date: true,
        createdAt: true,
        spfResult: true,
        dkimResult: true,
        dmarcResult: true,
        attachmentCount: true,
        analysisReport: {
          select: {
            threatLevel: true,
            riskScore: true,
            severity: true,
            summary: true,
          }
        }
      }
    });
    res.json({ status: 'success', data: emails });
  } catch (error: any) {
    console.error('Error fetching email investigations:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch investigation history: ' + error.message });
  }
};

export const getEmailById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const email: any = await prisma.email.findUnique({
      where: { id },
      include: {
        analysisReport: true
      }
    });

    if (!email) {
      res.status(404).json({ status: 'error', message: 'Investigation record not found' });
      return;
    }

    const report = email.analysisReport;
    const analysis = report ? {
      threatLevel: report.threatLevel,
      riskEvaluation: {
        score: report.riskScore,
        severity: report.severity,
        summary: report.summary,
        factors: report.riskFactors || [],
      },
      anomalies: report.anomalies || [],
      attachments: report.attachments || [],
      domainAnalysis: report.domainAnalysis,
      urlAnalysis: report.urlAnalysis || [],
      routeAnalysis: report.routeAnalysis,
      threatIntel: report.threatIntel || [],
      nlpAnalysis: report.nlpAnalysis || null,
      aiAnalysis: report.aiAnalysis || null
    } : null;

    res.json({
      status: 'success',
      data: email,
      analysis
    });
  } catch (error: any) {
    console.error('Error fetching email record:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch investigation: ' + error.message });
  }
};

export const deleteEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    await prisma.email.delete({ where: { id } });
    res.json({ status: 'success', message: 'Investigation deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting email record:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete investigation: ' + error.message });
  }
};

export const triggerAiAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const email: any = await prisma.email.findUnique({
      where: { id },
      include: { analysisReport: true }
    });

    if (!email) {
      res.status(404).json({ status: 'error', message: 'Email investigation not found' });
      return;
    }

    const { analyzeWithAI } = await import('../services/ai.service');

    const report = email.analysisReport;
    const forensicContext = {
      riskScore: report?.riskScore || 0,
      severity: report?.severity || 'LOW',
      anomalies: report?.anomalies || [],
      spf: email.spfResult,
      dkim: email.dkimResult,
      dmarc: email.dmarcResult,
      domainAnalysis: report?.domainAnalysis,
      urlAnalysis: report?.urlAnalysis,
      threatIntel: report?.threatIntel,
    };

    const aiResult = await analyzeWithAI(
      email.textBodySnippet || '',
      email.subject || '',
      forensicContext
    );

    if (!aiResult) {
      res.status(500).json({
        status: 'error',
        message: 'Groq AI Analysis failed to generate a response. Verify GROQ_API_KEY in backend/.env',
      });
      return;
    }

    // Persist result to database
    if (report) {
      await prisma.analysisReport.update({
        where: { id: report.id },
        data: { aiAnalysis: aiResult as any }
      });
    }

    res.json({
      status: 'success',
      message: 'AI Semantic Analysis generated and persisted successfully.',
      aiAnalysis: aiResult,
    });
  } catch (error: any) {
    console.error('Trigger AI Analysis error:', error);
    res.status(500).json({ status: 'error', message: 'AI Analysis execution error: ' + error.message });
  }
};
