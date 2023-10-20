import middy from '@middy/core';
import jsonBodyParser from '@middy/http-json-body-parser';

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { createResponse } from '../../utils/response.util.ts';
import { credentialsService } from '../../services/mod.ts';

import {
  authorizeMiddleware,
  errorsMiddleware,
} from '../../middlewares/mod.ts';

import { statusCodes } from '../../types/statusCodes.type.ts';

async function lambda(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const credentialId = event.pathParameters?.credentialsId as string;

  const credentials = await credentialsService.getUsersCredentialsById(
    event.auth.userId,
    credentialId
  );

  return createResponse(statusCodes.ok, {
    status: 'success',
    data: {
      credentials: credentialsService.createCredentailsResponse(credentials),
    },
  });
}

export const handler = middy(lambda)
  .use(jsonBodyParser())
  .use(authorizeMiddleware.authorize())
  .use(errorsMiddleware.errorHandler());
