import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../types';
import voiceService from '../services/voiceService';

const prisma = new PrismaClient();

const parseVoiceSchema = z.object({
  transcript: z.string().min(1)
});

export const parseVoiceCommand = async (req: AuthRequest, res: Response) => {
  try {
    const { transcript } = parseVoiceSchema.parse(req.body);

    // Parse the voice command using AI
    const result = await voiceService.parseVoiceCommand(transcript);

    // Log the voice command
    await prisma.voiceCommand.create({
      data: {
        userId: req.userId!,
        transcript,
        parsedData: result.parsed as any,
        success: true
      }
    });

    res.json({
      message: 'Voice command parsed successfully',
      ...result
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }
    console.error('Parse voice error:', error);
    res.status(500).json({ error: 'Failed to parse voice command' });
  }
};

export const getVoiceHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 20 } = req.query;

    const history = await prisma.voiceCommand.findMany({
      where: {
        userId: req.userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit as string),
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    });

    res.json({ history });
  } catch (error) {
    console.error('Get voice history error:', error);
    res.status(500).json({ error: 'Failed to fetch voice history' });
  }
};
