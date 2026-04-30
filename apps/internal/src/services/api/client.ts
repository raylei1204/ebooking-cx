import type {
  ApiSuccessResponse,
  LoginResponseData,
  PaginationMeta,
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

export async function apiRequest<TResponse, TMeta = PaginationMeta>(
  path: string,
  options: RequestOptions = {},
  config: AuthApiClientConfig = {}
): Promise<ApiSuccessResponse<TResponse, TMeta>> {
  const isFormDataBody =
    typeof FormData !== 'undefined' && options.body instanceof FormData;
  const requestInit: RequestInit = {
    method: options.method ?? 'GET',
    headers: {
      ...(isFormDataBody ? { Accept: 'application/json' } : DEFAULT_HEADERS),
      ...(options.accessToken === undefined
        ? {}
        : {
            Authorization: `Bearer ${options.accessToken}`
          })
    }
  };

  if (options.body !== undefined) {
    requestInit.body = isFormDataBody
      ? (options.body as FormData)
      : JSON.stringify(options.body);
  }

  const response = await fetch(`${config.baseUrl ?? ''}${path}`, requestInit);
  const body = await parseResponseBody(response);

  if (!response.ok) {
    throw toApiClientError(body, response.status);
  }

  if (body === null) {
    return {
      data: undefined as TResponse
    };
  }

  return body as ApiSuccessResponse<TResponse, TMeta>;
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

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const responseText = await response.text();

  if (responseText.trim().length === 0) {
    return null;
  }

  return JSON.parse(responseText) as unknown;
}
