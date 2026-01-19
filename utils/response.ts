export interface ApiResponse<T = null> {
    success: boolean;
    data?: T;
    token?: string;
    message?: string;
    statusCode: number;
}

export const response = <T>(
    success: boolean,
    statusCode: number,
    token?: string,
    message?: string,
    data?: T,
): ApiResponse<T> => {
    return {
        success,
        statusCode,
        token,
        ...(message && { message }),
        ...(data !== undefined && { data }),
    };
};
