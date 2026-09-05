import { Request, Response } from 'express';
import { simpleParser } from 'mailparser';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { runFullAnalysis } from '../services/analysis.service';

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

    // Cryptographic SHA-256 hash of the evidence file buffer for non-repudiation
    const sha256Hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

    // Parse the raw email buffer
    const parsed = await simpleParser(req.file.buffer);

    // Extract Authentication-Results header (with fallback to Received-SPF and DKIM-Signature)
    const authHeaderRaw = parsed.headers.get('authentication-results');
    const authHeaderStr = Array.isArray(authHeaderRaw) ? authHeaderRaw.join(' ') : String(authHeaderRaw || '');

    const parseAuthStatus = (protocol: string) => {
      const match = authHeaderStr.match(new RegExp(`${protocol}=([a-zA-Z0-9_-]+)`, 'i'));
      if (match) return match[1].toUpperCase();

      // Fallbacks
      if (protocol === 'spf') {
        const receivedSpf = parsed.headers.get('received-spf');
        if (receivedSpf) {
          const spfStr = Array.isArray(receivedSpf) ? receivedSpf.join(' ') : String(receivedSpf);
          const spfMatch = spfStr.match(/^(pass|fail|softfail|neutral|none|error)/i);
          if (spfMatch) return spfMatch[1].toUpperCase();
        }
      }

      if (protocol === 'dkim') {
        const dkimSig = parsed.headers.get('dkim-signature');
        if (dkimSig) return 'SIGNED';
      }

      return authHeaderStr ? 'NONE' : 'MISSING';
    };

    const spfResult = parseAuthStatus('spf');
    const dkimResult = parseAuthStatus('dkim');
    const dmarcResult = parseAuthStatus('dmarc');

    // Extract attachment details and flag risky extensions
    const riskyExtensions = ['.exe', '.scr', '.vbs', '.bat', '.cmd', '.js', '.ps1', '.iso', '.img', '.jar', '.hta', '.cpl', '.docm', '.xlsm'];
    const attachments = (parsed.attachments || []).map((att: any) => {
      const filename = att.filename || 'unnamed_attachment';
      const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
      const isRisky = riskyExtensions.includes(ext);
      
      // Calculate attachment SHA-256 if content buffer is present
      const attHash = att.content ? crypto.createHash('sha256').update(att.content).digest('hex') : null;

      return {
        filename,
        contentType: att.contentType,
        size: att.size,
        isRisky,
        sha256: attHash
      };
    });

    // Safely get received headers (can be string, array, or undefined)
    const receivedHeaderRaw = parsed.headers.get('received');
    const receivedHeaders = Array.isArray(receivedHeaderRaw) 
      ? receivedHeaderRaw 
      : (receivedHeaderRaw ? [receivedHeaderRaw] : []);

    const emailData = {
      filename: req.file.originalname,
      sha256Hash,
      from: (parsed.from as any)?.text || '',
      to: (parsed.to as any)?.text || '',
      cc: (parsed.cc as any)?.text || '',
      subject: parsed.subject || '',
      date: parsed.date ? parsed.date.toISOString() : '',
      messageId: parsed.messageId || '',
      replyTo: (parsed.replyTo as any)?.text || '',
      returnPath: (parsed.headers.get('return-path') as any)?.text || (typeof parsed.headers.get('return-path') === 'string' ? parsed.headers.get('return-path') : ''),
      textBodySnippet: parsed.text ? parsed.text.substring(0, 500) + '...' : 'No text body',
      htmlBodyExists: !!parsed.html,
      attachmentCount: attachments.length,
      receivedHeaders: receivedHeaders as any,
      spfResult,
      dkimResult,
      dmarcResult
    };

    // Delegate to the Master Orchestrator Service
    const analysisResult = await runFullAnalysis(emailData, parsed, attachments);

    // Save evidence immutably to PostgreSQL along with complete analysis report
    const savedEmail = await prisma.email.create({
      data: {
        ...emailData,
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
            attachments: (attachments || []) as any,
            nlpAnalysis: (analysisResult.nlpAnalysis || {}) as any,
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
      nlpAnalysis: report.nlpAnalysis || null
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
