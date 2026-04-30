import type {
  ApiErrorBody,
  ApiSuccessResponse,
  LoginResponseData,
  TokenResponseData
} from '@ebooking-cx/shared';

import type {
  ApiClientError,
  AuthApiClient,
  AuthApiClientConfig,
  RequestOptions
} from './types';
import { isApiErrorResponse } from './types';

const DEFAULT_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json'
} as const;

export async function apiRequest<TResponse>(
  path: string,
  options: RequestOptions = {},
  config: AuthApiClientConfig = {}
): Promise<ApiSuccessResponse<TResponse>> {
  const requestInit: RequestInit = {
    method: options.method ?? 'GET',
    headers: {
      ...DEFAULT_HEADERS,
      ...(options.accessToken === undefined
        ? {}
        : {
            Authorization: `Bearer ${options.accessToken}`
          })
    }
  };

  if (options.body !== undefined) {
    requestInit.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${config.baseUrl ?? ''}${path}`, requestInit);

  const body = (await response.json()) as unknown;

  if (!response.ok) {
    throw toApiClientError(body, response.status);
  }

  return body as ApiSuccessResponse<TResponse>;
}

export function createAuthApiClient(
  config: AuthApiClientConfig = {}
): AuthApiClient {
  return {
    login(request) {
      return apiRequest<LoginResponseData>(
        '/api/v1/auth/login',
        {
          method: 'POST',
          body: request
        },
        config
      );
    },
    refresh(request) {
      return apiRequest<TokenResponseData>(
        '/api/v1/auth/refresh',
        {
          method: 'POST',
          body: request
        },
        config
      );
    },
    logout(request, accessToken) {
      return apiRequest<{ success: true }>(
        '/api/v1/auth/logout',
        {
          method: 'POST',
          body: request,
          accessToken
        },
        config
      );
    }
  };
}

function toApiClientError(body: unknown, statusCode: number): ApiClientError {
  if (isApiErrorResponse(body)) {
    return body.error;
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: `Request failed with status ${statusCode}.`,
    statusCode
  };
}
