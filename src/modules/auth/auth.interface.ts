export interface ILoginPayload {
  phone: string;
  password: string;
}
export interface ISignUpPayload extends ILoginPayload {
  name: string;
}

export interface IChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
  id: number;
}
