export interface ISendOtpResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface IVerifyOtpResponse {
  success: boolean;
  message?: string;
  data?: string;
  token?: string;
  error?: string;
}
