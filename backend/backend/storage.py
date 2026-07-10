from storages.backends.s3 import S3Storage


class MediaStorage(S3Storage):
    """
    Storage backend for all uploaded media files.
    """

    file_overwrite = False

    default_acl = None

    querystring_auth = False