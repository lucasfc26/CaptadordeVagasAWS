import { User } from '@prisma/client';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  timezone: string;
  createdAt: Date;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    timezone: user.timezone,
    createdAt: user.createdAt,
  };
}
