from django.conf import settings
from storages.backends.s3 import S3Storage


class PublicMediaStorage(S3Storage):
    bucket_name = settings.AWS_PUBLIC_BUCKET_NAME
    location = settings.AWS_ENVIRONMENT

    default_acl = None
    file_overwrite = False
    querystring_auth = False


class PrivateMediaStorage(S3Storage):
    bucket_name = settings.AWS_PRIVATE_BUCKET_NAME
    location = settings.AWS_ENVIRONMENT

    default_acl = None
    file_overwrite = False
    querystring_auth = True