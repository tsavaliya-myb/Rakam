import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class S3Service {
  readonly client: S3Client;
  readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.client = new S3Client({
      region: config.get<string>('aws.region'),
      credentials: {
        accessKeyId: config.get<string>('aws.accessKeyId') ?? '',
        secretAccessKey: config.get<string>('aws.secretAccessKey') ?? '',
      },
    });
    this.bucket = config.get<string>('aws.s3Bucket') ?? '';
  }

  // TODO: presignedPut(key, contentType), presignedGet(key), delete(key)
}
