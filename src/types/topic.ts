export interface Topic {
  id: number;
  subjectId: number;
  name: string;
  description?: string;
  weekNumber?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TopicFormData {
  subjectId: number;
  name: string;
  description?: string;
  weekNumber?: number;
}
