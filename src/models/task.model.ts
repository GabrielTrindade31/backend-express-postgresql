import { Schema, model, Document, Types } from 'mongoose';

export const TASK_STATUSES = ['pending', 'in_progress', 'completed'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface TaskDocument extends Document {
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: Date | null;
  user: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<TaskDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: { type: String, enum: TASK_STATUSES, default: 'pending', index: true },
    dueDate: { type: Date },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

taskSchema.index({ user: 1, title: 1 });

taskSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id?.toString?.() ?? ret._id;
    Reflect.deleteProperty(ret, '_id');
    Reflect.deleteProperty(ret, '__v');
    return ret;
  },
});

taskSchema.set('toObject', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id?.toString?.() ?? ret._id;
    Reflect.deleteProperty(ret, '_id');
    Reflect.deleteProperty(ret, '__v');
    return ret;
  },
});

export const TaskModel = model<TaskDocument>('Task', taskSchema);
