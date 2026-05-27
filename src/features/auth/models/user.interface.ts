import { z } from 'zod'

export const userPermissionSchema = z.object({
  _id: z.string(),
  name: z.string(),
  description: z.string(),
})

export const userRoleSchema = z.object({
  _id: z.string(),
  name: z.string(),
  permission: z.array(userPermissionSchema),
})

export const userSchema = z.object({
  twoFactor: z.object({
    isEnabled: z.boolean(),
    secret: z.string(),
  }),
  recovering: z.object({
    code: z.string(),
  }),
  recoveringCode: z.string(),
  _id: z.string(),
  fullName: z.string(),
  username: z.string(),
  studioAccess: z.boolean(),
  urlImage: z.string(),
  qaEmail: z.string(),
  email: z.string(),
  roles: z.array(userRoleSchema),
  devices: z.array(z.string()),
  settings: z.object({
    _id: z.string(),
    theme: z.string(),
    skypeNotification: z.boolean(),
    emailNotification: z.boolean(),
    silentNotification: z.boolean(),
    autoDarkMode: z.boolean(),
    startAutoMode: z.string(),
    endAutoMode: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  area: z.string(),
  pushNotificationsSettings: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastLogin: z.string(),
  loginCounter: z.number(),
})

export type IUserRol = z.infer<typeof userRoleSchema>
export type IUser = z.infer<typeof userSchema>
