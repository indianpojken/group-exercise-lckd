import middy from '@middy/core';
import jsonBodyParser from '@middy/http-json-body-parser';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  authorizeMiddleware,
  errorsMiddleware,
} from '../../middlewares/mod.ts';

import { statusCodes } from '../../types/statusCodes.type.ts';
import { createResponse } from '../../utils/response.util.ts';
import {
  getUsersCredentialsById,
  updatePasswordCredentials,
} from '../../services/credentials.service.ts';

interface Params {
  id: string;
}

interface Body {
  newPassword: string;
}

async function lambda(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const { userId: pk } = event.auth;
  const { id: sk } = event.pathParameters as unknown as Params;
  const { newPassword } = event.body as unknown as Body;
  if (!newPassword) throw new Error('Body must include `newPassword`');

  const user = await getUsersCredentialsById(pk, sk);

  await updatePasswordCredentials(pk, sk, newPassword);

  return createResponse(statusCodes.ok, { status: 'success', data: null });
}

export const handler = middy(lambda)
  .use(jsonBodyParser())
  .use(authorizeMiddleware.authorize())
  .use(errorsMiddleware.errorHandler());
