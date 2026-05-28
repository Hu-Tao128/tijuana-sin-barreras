import {Role} from "./Role";

export interface User {
  uid: string;

  displayName: string;

  email: string;

  photoURL?: string;

  role: Role;

  isActive: boolean;

  createdAt: number;

  lastLoginAt?: number;
}
