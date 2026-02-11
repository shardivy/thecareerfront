from django.db import models

from accounts.models import User
from program_package.models import Package

class Content(models.Model):
    CONTENT_TYPE_CHOICES = (
        ('video', 'Video'),
        ('pdf', 'PDF'),
        ('article', 'Article'),
    )

    title = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES)
    category = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    file_path = models.FileField(upload_to='contents/')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    is_active = models.BooleanField(default=True)
    free_content = models.BooleanField(default=False)
    payment_required = models.BooleanField(default=False)


class ContentPackage(models.Model):
    content = models.ForeignKey(Content, on_delete=models.CASCADE)
    package = models.ForeignKey(Package, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('content', 'package')

