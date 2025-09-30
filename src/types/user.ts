import { UserRole } from "./enums";

export interface User {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string | null;
    role: UserRole;
    lastLogin?: Date;
}
  