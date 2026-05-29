export interface Comment {
  id: string;

  reportId: string;

  userId: string;

  displayName: string;

  text: string;

  createdAt: number;

  updatedAt?: number;
}
