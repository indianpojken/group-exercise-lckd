import { z } from 'zod';
import { nanoid } from 'nanoid';
import aes from 'crypto-js/aes';

import { database } from './database.service.ts';
import { ApiError } from '../errors/api.error.ts';

import { usersService } from './mod.ts';

import { statusCodes } from '../types/statusCodes.type.ts';

import { credentialsValidation } from '../validations/mod.ts';

interface CredentialsItem {
  SK: string;
  PK: string;
  username: string;
  password: string;
  domain: string;
}

type Credentials = z.infer<typeof credentialsValidation.credentials>;

export async function getUsersCredentialsById(
  userId: string,
  credentialsId: string
) {
  const { Items: credentials } = await database
    .query({
      TableName: process.env.TABLE_NAME as string,
      KeyConditionExpression: 'PK = :PK AND SK = :SK',
      ExpressionAttributeValues: {
        ':PK': `user#${userId}`,
        ':SK': `credentials#${credentialsId}`,
      },
      Limit: 1,
    })
    .promise();

  if (credentials?.length) {
    return credentials as unknown as CredentialsItem;
  } else {
    throw new ApiError(statusCodes.notFound, {
      message: `No password with the id: '${credentialsId}' was found`,
    });
  }
}

export async function saveCredentials(
  userId: string,
  credentials: Credentials
) {
  const user = await usersService.getUserById(userId);
  const credentialsId = nanoid();

  await database
    .put({
      TableName: process.env.TABLE_NAME as string,
      Item: {
        PK: `user#${userId}`,
        SK: `credentials#${credentialsId}`,
        username: credentials.username,
        password: aes
          .encrypt(credentials.password, process.env.CRYPTO_SECRET as string)
          .toString(),
        domain: credentials.domain,
      },
    })
    .promise();

  return credentialsId;
}

export async function getAllCredentials(userId: string) {
  const { Items: credentials } = await database
    .query({
      TableName: process.env.TABLE_NAME as string,
      KeyConditionExpression: 'PK = :userId AND begins_with(SK, :prefix)',
      ExpressionAttributeValues: {
        ':userId': `user#${userId}`,
        ':prefix': 'credentials#',
      },
    })
    .promise();

  return credentials as CredentialsItem[];
}

export function createCredentailsResponse(credentials: CredentialsItem) {
  return {
    id: credentials.SK.replace('credentials#', ''),
    username: credentials.username,
    password: credentials.password,
    domain: credentials.domain,
  };
}

export async function deletePasswordCredentials(pk: string, sk: string) {
  const params = {
    TableName: process.env.TABLE_NAME as string,
    Key: { PK: 'user#' + pk, SK: 'credentials#' + sk },
  };
  const response = await database.delete(params).promise();
  return response;
}
