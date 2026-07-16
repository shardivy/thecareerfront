import os

from storages.backends.s3 import S3Storage
from django.conf import settings



# class MediaStorage(S3Storage):
#     """
#     Storage backend for all uploaded media files.
#     """

#     file_overwrite = False

#     default_acl = None

#     querystring_auth = False
    
# class PublicMediaStorage(S3Storage):
#     bucket_name = "abhinavcareerscope-public"
#     default_acl = None
#     file_overwrite = False
#     querystring_auth = False


# class PrivateMediaStorage(S3Storage):
#     bucket_name = "abhinavcareerscope-media-staging"
#     default_acl = None
#     file_overwrite = False
#     querystring_auth = True


AWS_ENVIRONMENT = os.getenv("AWS_ENVIRONMENT")


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