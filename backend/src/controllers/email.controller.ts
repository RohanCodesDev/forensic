import { Request, Response } from 'express';
import { simpleParser } from 'mailparser';
import { PrismaClient } from '@prisma/client';
import { analyzeSenderDomain } from '../services/domain.service';

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
      return {
        filename,
        contentType: att.contentType,
        size: att.size,
        isRisky
      };
    });

    // Safely get received headers (can be string, array, or undefined)
    const receivedHeaderRaw = parsed.headers.get('received');
    const receivedHeaders = Array.isArray(receivedHeaderRaw) 
      ? receivedHeaderRaw 
      : (receivedHeaderRaw ? [receivedHeaderRaw] : []);

    const emailData = {
      filename: req.file.originalname,
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

    // Save evidence immutably to PostgreSQL
    const savedEmail = await prisma.email.create({
      data: emailData
    });

    // PHASE 3 & 4: Header Forensics & Authentication Anomalies
    const anomalies: string[] = [];

    // Helper to safely extract just the email address part from "Name <email@domain.com>"
    const extractEmail = (fullText: string) => {
      const match = fullText.match(/<([^>]+)>/);
      return match ? match[1].trim().toLowerCase() : fullText.trim().toLowerCase();
    };

    const fromAddress = extractEmail(emailData.from);
    const replyToAddress = emailData.replyTo ? extractEmail(emailData.replyTo) : null;
    const returnPathAddress = emailData.returnPath ? extractEmail(emailData.returnPath) : null;

    // 1. From / Reply-To Mismatch
    if (replyToAddress && replyToAddress !== fromAddress) {
      anomalies.push(`REPLY-TO MISMATCH: Sender claims to be '${fromAddress}', but replies are redirected to '${replyToAddress}'.`);
    }

    // 2. Return-Path / From Mismatch
    if (returnPathAddress && returnPathAddress !== fromAddress) {
      anomalies.push(`RETURN-PATH MISMATCH: Sender claims to be '${fromAddress}', but technical bounces (the true sender) route to '${returnPathAddress}'.`);
    }

    // 3. Missing Message-ID
    if (!emailData.messageId || emailData.messageId.trim() === '') {
      anomalies.push(`MISSING MESSAGE-ID: Legitimate mail servers usually assign a unique Message-ID. The absence suggests a custom/malicious script.`);
    }

    // 4. SPF Authentication Anomalies
    if (['FAIL', 'SOFTFAIL', 'HARDFAIL'].includes(spfResult)) {
      anomalies.push(`SPF FAILURE (${spfResult}): The sending server's IP address is NOT authorized in the domain's DNS SPF record.`);
    }

    // 5. DKIM Authentication Anomalies
    if (['FAIL', 'BADSIG', 'PERMERROR'].includes(dkimResult)) {
      anomalies.push(`DKIM FAILURE (${dkimResult}): Cryptographic signature validation failed. Email content or headers may have been tampered with.`);
    }

    // 6. DMARC Authentication Anomalies
    if (['FAIL', 'REJECT'].includes(dmarcResult)) {
      anomalies.push(`DMARC FAILURE (${dmarcResult}): Domain alignment check failed. The email violates the sender domain's authentication policy.`);
    }

    // 7. Risky Attachments
    const riskyAtts = attachments.filter((a: any) => a.isRisky);
    if (riskyAtts.length > 0) {
      anomalies.push(`HIGH RISK ATTACHMENTS DETECTED: Contains ${riskyAtts.length} potentially executable/malicious attachment file(s): ${riskyAtts.map((a: any) => a.filename).join(', ')}.`);
    }

    // PHASE 5: Domain Analysis & Brand Impersonation
    const extractName = (fullText: string) => {
      const match = fullText.match(/^"?([^"<]+)"?\s*</);
      return match ? match[1].trim() : null;
    };
    const senderName = extractName(emailData.from);
    const domainAnalysis = analyzeSenderDomain(fromAddress, senderName);

    if (domainAnalysis && domainAnalysis.anomalies.length > 0) {
      anomalies.push(...domainAnalysis.anomalies);
    }

    // Threat Level Evaluation
    let threatLevel: 'CLEAN' | 'SUSPICIOUS' | 'HIGH_RISK' = 'CLEAN';
    if (
      anomalies.length >= 2 || 
      riskyAtts.length > 0 || 
      ['FAIL', 'REJECT'].includes(dmarcResult) || 
      ['FAIL', 'HARDFAIL'].includes(spfResult) ||
      (domainAnalysis && domainAnalysis.brandImpersonation.matchType !== null)
    ) {
      threatLevel = 'HIGH_RISK';
    } else if (anomalies.length === 1) {
      threatLevel = 'SUSPICIOUS';
    }

    res.json({
      status: 'success',
      message: 'Evidence securely preserved in PostgreSQL.',
      data: savedEmail,
      analysis: { 
        threatLevel,
        anomalies,
        attachments,
        domainAnalysis
      }
    });
  } catch (error: any) {
    console.error('Email parsing error details:', error);
    res.status(500).json({ status: 'error', message: 'Failed to parse email: ' + (error.message || 'Unknown error') });
  }
};
