from django.db import models

from accounts.models import User
from exam.models import Exam

class Report(models.Model):
    STATUSCHOICES = (
        ('not_received', 'Not Received'),
        ('received_locked', 'Received Locked'),
        ('received_unlocked', 'Received Unlocked'),
        # ('pending_uploaded', 'Pending Uploaded'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, null=True, blank=True)
    file_path = models.FileField(upload_to='reports/', blank=True, null=True)
    report_status = models.CharField(max_length=50, blank=True, null=True, choices=STATUSCHOICES)
    review_required = models.BooleanField(default=False)

    uploaded_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='uploaded_reports'
    )
    uploaded_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.uploaded_by}"
    

class Review(models.Model):
    RELATED_TYPE_CHOICES = (
        ('report', 'Report'),
        ('certificate', 'Certificate'),
        ('paid_doc', 'Paid Document'),
    )
    STATUSCHOICES = (
        ('not_submitted', 'Not Submitted'),
        ('in_process', 'In Process'),
        ('pending_approval', 'Pending Approval'),
        ('submitted', 'Submitted'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    related_type = models.CharField(max_length=20, choices=RELATED_TYPE_CHOICES, null=True, blank=True)
    
    review_status = models.CharField(max_length=20, choices=STATUSCHOICES, default='not_submitted')
    related_id = models.PositiveIntegerField(null=True, blank=True)
    review_text = models.TextField(null=True, blank=True)
    rating = models.IntegerField(null=True, blank=True)
    is_shared = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


