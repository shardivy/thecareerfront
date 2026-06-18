from django.db import models

from accounts.models import User
from django.conf import settings
from exam.models import Exam

class Program(models.Model):
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    duration = models.CharField(max_length=150, blank=True, null=True)
    session = models.CharField(max_length=150, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
class Package(models.Model):
    
    program = models.ForeignKey(Program, on_delete=models.CASCADE)
    name = models.CharField(max_length=250, blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True, null=True)
    link_url = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    aptitude_test = models.BooleanField(default=False)
    engineering_test_analysis = models.BooleanField(default=False)
    is_handholding = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.program.name} - {self.name}"
    
class PackageFeature(models.Model):
    package = models.ForeignKey(Package, on_delete=models.CASCADE)
    feature_code = models.CharField(max_length=50, blank=True, null=True)
    description = models.CharField(max_length=250, blank=True, null=True)
    is_enabled = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.package.name} - {self.feature_code}"
    
class UserProgramPackage(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    program = models.ForeignKey(Program, on_delete=models.CASCADE)
    package = models.ForeignKey(Package, on_delete=models.CASCADE, null=True, blank=True)
    assigned_by = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.program.name} - {self.assigned_by}"
    
class PackageExam(models.Model):
    package = models.ForeignKey(Package,on_delete=models.CASCADE,related_name="package_exams")
    exam = models.ForeignKey(Exam,on_delete=models.CASCADE,related_name="exam_packages")
    is_mandatory = models.BooleanField(default=False)
    sequence_order = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "package_exams"
        ordering = ["sequence_order"]
        unique_together = ("package", "exam")

    def __str__(self):
        return f"{self.package} - {self.exam} (Order {self.sequence_order})"
    
class QuestionAnswer(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='question_answers'
    )

    question = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Question by {self.user}"
    
class CollegeListAnalysis(models.Model):

    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        # ('pending_approval', 'Pending Approval'),
        ('completed', 'Completed'),
        
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='college_analysis',
        
    )
    question = models.ForeignKey(
        QuestionAnswer,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )


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

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='not_started'
    )

    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_college_analysis',
        
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Answer(models.Model):
    student = models.ForeignKey("lead_registration.StudentProfile", on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(QuestionAnswer, on_delete=models.CASCADE, related_name='answers')
    program = models.ForeignKey(Program, on_delete=models.CASCADE, null=True, blank=True)
    package = models. ForeignKey(Package, on_delete=models.CASCADE, null=True, blank=True)
    answer_text = models.TextField(null=True, blank=True)
    is_draft = models.BooleanField(default=True) 
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Answer to {self.question} by {self.question.user}"
    
    
class LandingPage(models.Model):
    program = models.ForeignKey(Program, on_delete=models.CASCADE, null=True, blank=True)
    package = models.ForeignKey(Package, on_delete=models.CASCADE, null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    flyer_image = models.ImageField(upload_to="landing_page_flyers/", null=True, blank=True)
    process1 = models.CharField(max_length=255, blank=True, null=True)
    process2 = models.CharField(max_length=255, blank=True, null=True)
    process3 = models.CharField(max_length=255, blank=True, null=True)
    process4 = models.CharField(max_length=255, blank=True, null=True)
    contact_details = models.CharField(max_length=255, blank=True, null=True)
    enterprise_name = models.CharField(max_length=255, blank=True, null=True)
    registration_details1 = models.TextField(blank=True, null=True)
    registration_details2 = models.TextField(blank=True, null=True)
    registration_details3 = models.TextField(blank=True, null=True)
    registration_details4 = models.TextField(blank=True, null=True)
    instructions1 = models.TextField(max_length=255, blank=True, null=True)
    instructions2 = models.TextField(max_length=255, blank=True, null=True)
    instructions3 = models.TextField(max_length=255, blank=True, null=True)
    instructions4 = models.TextField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
