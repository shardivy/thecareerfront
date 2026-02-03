from django.db import models

from accounts.models import User
from exam.models import Exam

class Report(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE)
    file_path = models.FileField(upload_to='reports/')
    is_locked = models.BooleanField(default=False)
    review_required = models.BooleanField(default=False)

    uploaded_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='uploaded_reports'
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.uploaded_by}"
    

class Review(models.Model):
    RELATED_TYPE_CHOICES = (
        ('report', 'Report'),
        ('certificate', 'Certificate'),
        ('paid_doc', 'Paid Document'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    related_type = models.CharField(max_length=20, choices=RELATED_TYPE_CHOICES)
    related_id = models.PositiveIntegerField()
    review_text = models.TextField()
    rating = models.IntegerField()
    is_shared = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


