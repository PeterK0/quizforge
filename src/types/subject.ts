export interface Subject {
  id: number;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectFormData {
  name: string;
  description?: string;
  color: string;
  icon?: string;
}
