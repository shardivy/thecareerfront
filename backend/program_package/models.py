from django.db import models

from accounts.models import User
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
    PACKAGE_CHOICE = (
        ('basic', 'Basic'),
        ('standard', 'Standard'),
        ('premium', 'Premium')
    )
    program = models.ForeignKey(Program, on_delete=models.CASCADE)
    name = models.CharField(max_length=150, choices=PACKAGE_CHOICE)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
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
    package = models.ForeignKey(Package, on_delete=models.CASCADE)
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
    

