import {Role} from "./Role";

export interface User {
  uid: string;

  displayName: string;

  email: string;

  phoneNumber?: string;

  photoURL?: string;

  edad?: number;

  role: Role;

  isActive: boolean;

  usaSillaDeRuedas?: boolean;

  usaBaston?: boolean;

  problemasVision?: boolean;

  necesitaPerroGuia?: boolean;

  necesitaGuia?: boolean;

  createdAt: number;

  lastLoginAt?: number;
}
