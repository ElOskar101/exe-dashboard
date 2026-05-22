export interface IUserRol {
  _id: string
  name: string
  permission: Array<{
    _id: string
    name: string
    description: string
  }>
}

export interface IUser {
  twoFactor: {
    isEnabled: boolean
    secret: string
  }
  recovering: {
    code: string
  }
  recoveringCode: string
  _id: string
  fullName: string
  username: string
  studioAccess: boolean
  urlImage: string
  qaEmail: string
  email: string
  roles: IUserRol[]
  devices: string[]
  settings: {
    _id: string
    theme: string
    skypeNotification: boolean
    emailNotification: boolean
    silentNotification: boolean
    autoDarkMode: boolean
    startAutoMode: string
    endAutoMode: string
    createdAt: string
    updatedAt: string
  }
  area: string
  pushNotificationsSettings: string[]
  createdAt: string
  updatedAt: string
  lastLogin: string
  loginCounter: number
}
