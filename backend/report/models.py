from django.db import models

from accounts.models import User
from program_package.models import Package, Program, UserProgramPackage
from exam.models import Exam

class Report(models.Model):
    STATUSCHOICES = (
        ('not_received', 'Not Received'),
        ('received_locked', 'Received Locked'),
        ('received_unlocked', 'Received Unlocked'),
        ('v1_not_received', 'V1 Not Received'),
        ('v2_not_received', 'V2 Not Received'),
        ('v3_not_received', 'V3 Not Received'),    
        ('v1_received', 'V1 Received'),
        ('v2_received', 'V2 Received'),
        ('v3_received', 'V3 Received'),
        # ('pending_uploaded', 'Pending Uploaded'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    # user_program_package = models.ForeignKey(
    #     UserProgramPackage,
    #     on_delete=models.CASCADE,
    #     null=True,
    #     blank=True
    # )
    program = models.ForeignKey(
        Program,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    package = models.ForeignKey(
        Package,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, null=True, blank=True)
    file_path = models.FileField(upload_to='reports/', blank=True, null=True)
    file_path1 = models.FileField(upload_to='reports/', blank=True, null=True)
    file_path2 = models.FileField(upload_to='reports/', blank=True, null=True)
    file_path_count = models.PositiveIntegerField(default=0)
    file_path1_count = models.PositiveIntegerField(default=0)
    file_path2_count = models.PositiveIntegerField(default=0)
    report_status = models.CharField(max_length=50, blank=True, null=True, choices=STATUSCHOICES)
    report_status_v2 = models.CharField(max_length=50, blank=True, null=True, choices=STATUSCHOICES, default='v2_not_received')
    report_status_v3 = models.CharField(max_length=50, blank=True, null=True, choices=STATUSCHOICES, default='v3_not_received')
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


