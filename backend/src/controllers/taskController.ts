import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../types';
import { emitToUser } from '../config/socket';

const prisma = new PrismaClient();

const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(['To Do', 'In Progress', 'Completed']).default('To Do'),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).default('Medium'),
  dueDate: z.string().datetime().optional().nullable(),
  dueTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  createdVia: z.enum(['manual', 'voice']).default('manual')
});

const updateTaskSchema = createTaskSchema.partial();

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { status, priority } = req.query;

    const where: any = {
      userId: req.userId
    };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

export const getTaskById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: {
        id: parseInt(id),
        userId: req.userId
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createTaskSchema.parse(req.body);

    const task = await prisma.task.create({
      data: {
        ...validatedData,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        dueTime: validatedData.dueTime || null,
        userId: req.userId!
      }
    });

    // Emit real-time update
    const io = req.app.get('io');
    emitToUser(io, req.userId!, 'task:created', task);

    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateTaskSchema.parse(req.body);

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id: parseInt(id),
        userId: req.userId
      }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: {
        ...validatedData,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
        dueTime: validatedData.dueTime !== undefined ? validatedData.dueTime : undefined
      }
    });

    // Emit real-time update
    const io = req.app.get('io');
    emitToUser(io, req.userId!, 'task:updated', task);

    res.json({
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id: parseInt(id),
        userId: req.userId
      }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await prisma.task.delete({
      where: { id: parseInt(id) }
    });

    // Emit real-time update
    const io = req.app.get('io');
    emitToUser(io, req.userId!, 'task:deleted', { id: parseInt(id) });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};
