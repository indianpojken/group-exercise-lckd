import middy from '@middy/core';
import jsonBodyParser from '@middy/http-json-body-parser';

import { z } from 'zod';

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { createResponse } from '../../utils/response.util.ts';
import { credentialsService } from '../../services/mod.ts';

import {
  authorizeMiddleware,
  validatorMiddleware,
  errorsMiddleware,
} from '../../middlewares/mod.ts';

import { credentialsValidation } from '../../validations/mod.ts';
import { statusCodes } from '../../types/statusCodes.type.ts';

async function lambda(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const credentials = event.body as unknown as z.infer<
    typeof credentialsValidation.credentials
  >;

  const id = await credentialsService.saveCredentials(
    event.auth.userId,
    credentials
  );

  return createResponse(statusCodes.accepted, {
    status: 'success',
    data: { id },
  });
}

export const handler = middy(lambda)
  .use(jsonBodyParser())
  .use(authorizeMiddleware.authorize())
  .use(validatorMiddleware.validate(credentialsValidation.credentials))
  .use(errorsMiddleware.errorHandler());
