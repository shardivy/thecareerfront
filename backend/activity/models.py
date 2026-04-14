from django.db import models
from django.conf import settings

class ActivityLog(models.Model):
    ACTION_CHOICES = [
        ("create", "Create"),
        ("update", "Update"),
        ("delete", "Delete"),
        ("login", "Login"),
        ("other", "Other"),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        db_constraint=False
    )
    action = models.CharField(max_length=255, choices=ACTION_CHOICES)
    module = models.CharField(max_length=100)
    model_name = models.CharField(max_length=100)  # model name
    object_id = models.PositiveIntegerField(null=True, blank=True)

    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

