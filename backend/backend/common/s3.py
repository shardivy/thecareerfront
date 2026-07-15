import os

import boto3
from django.conf import settings


# def generate_presigned_url(file_name, expiration=600):
#     client = boto3.client(
#         "s3",
#         aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
#         aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
#         region_name=settings.AWS_S3_REGION_NAME,
#     )

#     return client.generate_presigned_url(
#         "get_object",
#         Params={
#             "Bucket": settings.AWS_STORAGE_BUCKET_NAME,
#             "Key": file_name,
#             "ResponseContentDisposition": "attachment"
#         },
#         ExpiresIn=expiration,
#     )

def generate_presigned_url(file_name, expiration=600):
    client = boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME,
    )

    ext = os.path.splitext(file_name)[1].lower()

    disposition = "inline" if ext == ".pdf" else "attachment"

    return client.generate_presigned_url(
        "get_object",
        Params={
            "Bucket": settings.AWS_STORAGE_BUCKET_NAME,
            "Key": file_name,
            "ResponseContentDisposition": disposition,
        },
        ExpiresIn=expiration,
    )