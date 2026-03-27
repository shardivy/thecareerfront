from django.db import models

from accounts.models import User

class Exam(models.Model):
    name = models.CharField(max_length=150)
    provider = models.CharField(max_length=150, blank=True, null=True)
    instructions = models.TextField(blank=True, null=True, help_text="Instructions for taking the exam.")
    exam_link = models.URLField(blank=True, null=True, help_text="Link to the online exam.")
    is_active = models.BooleanField(default=True, help_text="Designates whether this exam is active.")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name            
    
class UserExam(models.Model):
    STATUS_CHOICES = (
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        # ('submitted', 'Submitted'),
        # ('exam_started', 'Exam Started'),
        ('pending_approval', 'Pending Approval'),
        ('completed', 'Completed'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, null=True, blank=True)
    status = models.CharField(max_length=200, choices=STATUS_CHOICES, default='not_started')
    description = models.TextField(blank=True, null=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='approved_exams'
    )
    created_at = models.DateTimeField(auto_now_add=True)

