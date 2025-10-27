import { FilterQuery, Types } from 'mongoose';
import { z } from 'zod';
import { AppError } from '../errors/AppError';
import { TaskDocument, TaskModel, TASK_STATUSES } from '../models/task.model';
import logger from '../utils/logger';

const statusEnum = z.enum(TASK_STATUSES);
const descriptionSchema = z
  .string({ invalid_type_error: 'A descrição deve ser uma string.' })
  .max(500, 'A descrição deve conter no máximo 500 caracteres.');
const dueDateSchema = z
  .union([
    z
      .string({ invalid_type_error: 'A data de vencimento deve ser uma string.' })
      .datetime({ message: 'A data de vencimento deve estar no formato ISO 8601.' })
      .transform((value) => new Date(value)),
    z.null(),
  ])
  .optional();

const createTaskSchema = z.object({
  title: z
    .string({ invalid_type_error: 'O título deve ser uma string.' })
    .min(3, 'O título deve conter ao menos 3 caracteres.'),
  description: descriptionSchema.optional(),
  status: statusEnum.optional(),
  dueDate: dueDateSchema,
});

const putTaskSchema = z.object({
  title: z
    .string({ invalid_type_error: 'O título deve ser uma string.' })
    .min(3, 'O título deve conter ao menos 3 caracteres.'),
  description: descriptionSchema.optional(),
  status: statusEnum,
  dueDate: dueDateSchema,
});

const patchTaskSchema = z
  .object({
    title: z
      .string({ invalid_type_error: 'O título deve ser uma string.' })
      .min(3, 'O título deve conter ao menos 3 caracteres.')
      .optional(),
    description: descriptionSchema.optional(),
    status: statusEnum.optional(),
    dueDate: dueDateSchema,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualização.',
  });

const listTasksQuerySchema = z
  .object({
    status: statusEnum.optional(),
    title: z
      .string({ invalid_type_error: 'O filtro de título deve ser uma string.' })
      .min(1, 'Informe ao menos um caractere para o filtro de título.')
      .optional(),
    dueDate: dueDateSchema,
  })
  .strip();

const normalizeDueDate = (value?: Date | null): Date | undefined => {
  if (!value) {
    return undefined;
  }

  return value instanceof Date ? value : undefined;
};

const buildQueryFilters = (
  userId: string,
  filters: z.infer<typeof listTasksQuerySchema>
): FilterQuery<TaskDocument> => {
  const query: FilterQuery<TaskDocument> = { user: userId };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.title) {
    query.title = { $regex: filters.title, $options: 'i' };
  }

  if (filters.dueDate) {
    const start = new Date(filters.dueDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(filters.dueDate);
    end.setHours(23, 59, 59, 999);
    query.dueDate = { $gte: start, $lte: end };
  }

  return query;
};

const ensureValidId = (taskId: string): void => {
  if (!Types.ObjectId.isValid(taskId)) {
    throw new AppError('Identificador de tarefa inválido.', 400);
  }
};

const ensureOwnership = (task: TaskDocument, userId: string): void => {
  if (task.user.toString() !== userId) {
    logger.warn('Tentativa de acesso a tarefa de outro usuário.', {
      taskId: task.id,
      ownerId: task.user,
      requesterId: userId,
    });
    throw new AppError('Você não tem permissão para acessar este recurso.', 403);
  }
};

export class TaskService {
  async createTask(userId: string, payload: unknown): Promise<TaskDocument> {
    const data = createTaskSchema.parse(payload);

    const task = await TaskModel.create({
      title: data.title,
      description: data.description,
      status: data.status ?? 'pending',
      dueDate: normalizeDueDate(data.dueDate ?? undefined),
      user: userId,
    });

    logger.info('Tarefa criada com sucesso.', { userId, taskId: task.id });
    return task;
  }

  async listTasks(userId: string, query: unknown): Promise<TaskDocument[]> {
    const filters = listTasksQuerySchema.parse(query ?? {});
    const mongoQuery = buildQueryFilters(userId, filters);

    const tasks = await TaskModel.find(mongoQuery).sort({ createdAt: -1 });
    logger.debug('Listagem de tarefas executada.', {
      userId,
      filters,
      count: tasks.length,
    });
    return tasks;
  }

  async getTaskById(userId: string, taskId: string): Promise<TaskDocument> {
    ensureValidId(taskId);
    const task = await TaskModel.findById(taskId);

    if (!task) {
      throw new AppError('Tarefa não encontrada.', 404);
    }

    ensureOwnership(task, userId);

    logger.debug('Tarefa recuperada com sucesso.', { userId, taskId: task.id });
    return task;
  }

  async updateTask(userId: string, taskId: string, payload: unknown): Promise<TaskDocument> {
    ensureValidId(taskId);
    const data = putTaskSchema.parse(payload);

    const task = await TaskModel.findById(taskId);

    if (!task) {
      throw new AppError('Tarefa não encontrada.', 404);
    }

    ensureOwnership(task, userId);

    task.title = data.title;
    task.description = data.description;
    task.status = data.status;
    task.dueDate = normalizeDueDate(data.dueDate ?? undefined) ?? null;

    await task.save();

    logger.info('Tarefa atualizada (PUT) com sucesso.', { userId, taskId: task.id });
    return task;
  }

  async partiallyUpdateTask(
    userId: string,
    taskId: string,
    payload: unknown
  ): Promise<TaskDocument> {
    ensureValidId(taskId);
    const data = patchTaskSchema.parse(payload);

    const task = await TaskModel.findById(taskId);

    if (!task) {
      throw new AppError('Tarefa não encontrada.', 404);
    }

    ensureOwnership(task, userId);

    if (data.title !== undefined) {
      task.title = data.title;
    }

    if (data.description !== undefined) {
      task.description = data.description;
    }

    if (data.status !== undefined) {
      task.status = data.status;
    }

    if (data.dueDate !== undefined) {
      const normalizedDueDate = normalizeDueDate(data.dueDate ?? undefined);
      task.dueDate = normalizedDueDate ?? null;
    }

    await task.save();

    logger.info('Tarefa atualizada (PATCH) com sucesso.', { userId, taskId: task.id });
    return task;
  }

  async deleteTask(userId: string, taskId: string): Promise<void> {
    ensureValidId(taskId);
    const task = await TaskModel.findById(taskId);

    if (!task) {
      throw new AppError('Tarefa não encontrada.', 404);
    }

    ensureOwnership(task, userId);

    await task.deleteOne();
    logger.info('Tarefa removida com sucesso.', { userId, taskId: task.id });
  }
}

export const taskService = new TaskService();
