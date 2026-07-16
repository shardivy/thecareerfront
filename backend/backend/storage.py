import os
from storages.backends.s3 import S3Storage
from decouple import config

AWS_ENVIRONMENT = config("AWS_ENVIRONMENT")


class PublicMediaStorage(S3Storage):
    bucket_name = config("AWS_PUBLIC_BUCKET_NAME")
    location = AWS_ENVIRONMENT
    file_overwrite = False
    default_acl = None
    querystring_auth = False


class PrivateMediaStorage(S3Storage):
    bucket_name = config("AWS_PRIVATE_BUCKET_NAME")
    location = AWS_ENVIRONMENT
    file_overwrite = False
    default_acl = None
    querystring_auth = True