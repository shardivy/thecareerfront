from django.db import models

from accounts.models import User
from backend import settings
from lead_registration.models import StudentProfile
from program_package.models import Package, Program

class Content(models.Model):
    CONTENT_TYPE_CHOICES = (
        ('video', 'Video'),
        ('pdf', 'PDF'),
        ('article', 'Article'),
    )
    
    CONTENT_CATEGORY_CHOICES = (
        ('study_material', 'Study Material'),
        ('tutorial', 'Tutorial'),
        ('guide', 'Guide')
    )
    
    title = models.CharField(max_length=200, null=True, blank=True)
    type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES, null=True, blank=False)
    category = models.CharField(max_length=100, choices=CONTENT_CATEGORY_CHOICES, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    # program = models.ManyToManyField(Program, blank=True) 
    file_url = models.FileField(upload_to='contents/', null=True, blank=True)
    video_link = models.URLField(null=True, blank=True)
    image = models.ImageField(upload_to='content_images/', null=True, blank=True)
    is_draft = models.BooleanField(default=True)
    download_count = models.PositiveIntegerField(default=0)
    is_student_visible = models.BooleanField(default=True)
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='contents',
        db_column='created_by_id'
    )

    is_active = models.BooleanField(default=True)
    free_content = models.BooleanField(default=False)
    payment_required = models.BooleanField(default=False)


class ContentPackage(models.Model):
    content = models.ForeignKey(Content, on_delete=models.CASCADE, null=True, blank=True)
    program = models.ForeignKey(Program, on_delete=models.CASCADE, null=True, blank=True)
    package = models.ForeignKey(Package, on_delete=models.CASCADE, null=True, blank=True)
    stream = models.ForeignKey('lead_registration.Stream', on_delete=models.CASCADE, null=True, blank=True)
    
    def __str__(self):
        return f"{self.content} - {self.program} - {self.package}"

    # class Meta:
    #     unique_together = ('content', 'program', 'package')
    
# models.py

class StudentContent(models.Model):
    student_profile = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name="student_contents"
    )

    content = models.ForeignKey(
        Content,
        on_delete=models.CASCADE,
        related_name="student_contents"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("student_profile", "content")

    def __str__(self):
        return f"{self.student_profile.user.email} - {self.content.title}"    
    
    

