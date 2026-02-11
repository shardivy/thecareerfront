from django.db import models

from django.utils import timezone
from datetime import timedelta
from accounts.models import User
from program_package.models import Program

class Lead(models.Model):
    SOURCE_CHOICES = (
        ('website', 'Website'),
        ('call', 'Call'),
        ('whatsapp', 'Whatsapp'),
        ('walk_in', 'Wali-in'),
    )

    STATUS_CHOICES = (
        ('enquiry', 'Enquiry'),
        ('registered', 'Registered'),
        ('converted', 'Converted'),
    )

    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=15, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    program = models.ForeignKey(Program, on_delete=models.CASCADE)
    source = models.CharField(max_length=20, blank=True, null=True, choices=SOURCE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='enquiry')
    date = models.DateField(blank=True, null=True)
    assigned_admin = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='assigned_leads'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.email}"
    
class ParentProfile(models.Model):
    background_choices = (
        ('urban', 'Urban'),
        ('rural', 'Rural'),
        ('semi_urban', 'Semi-Urban'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE)

    # Profile fields
    profession = models.CharField(max_length=100, blank=True, null=True)
    organization_name = models.CharField(max_length=150, blank=True, null=True)
    education_level = models.CharField(max_length=100, blank=True, null=True)
    background = models.CharField(max_length=100, choices=background_choices)
    annual_income_range = models.CharField(max_length=100)
    expectations_from_student = models.TextField()

    # 🔐 OTP fields (ADDED)
    otp = models.CharField(max_length=6, blank=True, null=True)
    otp_verified = models.BooleanField(default=False)
    otp_created_at = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # -----------------------------
    # OTP HELPERS
    # -----------------------------
    def set_otp(self, otp):
        self.otp = otp
        self.otp_verified = False
        self.otp_created_at = timezone.now()
        self.save()

    def verify_otp(self, otp):
        if self.otp != otp:
            return False

        if self.is_otp_expired():
            return False

        self.otp_verified = True
        self.save()
        return True

    def is_otp_expired(self):
        if not self.otp_created_at:
            return True
        return timezone.now() > self.otp_created_at + timedelta(minutes=5)

    def __str__(self):
        return f"ParentProfile of {self.user.email}"
    

class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    parent = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='children')
    study_class = models.CharField(max_length=20, blank=True, null=True)
    current_academic_stage = models.CharField(max_length=20, blank=True, null=True)
    current_academic_year = models.CharField(max_length=10, blank=True, null=True)

    school_college = models.CharField(max_length=200, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"StudentProfile of {self.user.email} - {self.user.first_name} {self.user.last_name} - {self.study_class}"
    
class StudentAcademicHistory(models.Model):
    student_profile = models.ForeignKey(StudentProfile, on_delete=models.CASCADE)
    academic_stage = models.CharField(max_length=20)
    start_year = models.IntegerField()
    end_year = models.IntegerField()
    is_current = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"AcademicHistory of {self.student_profile.user.email} - {self.academic_stage}"
    
class Stream(models.Model):
    name = models.CharField(max_length=100)
    
    def __str__(self):
        return self.name
    
class StudentStream(models.Model):
    student_profile = models.ForeignKey(StudentProfile, on_delete=models.CASCADE)
    stream = models.ForeignKey(Stream, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.student_profile.user.email} - {self.stream.name}"
    
class Subject(models.Model):
    name = models.CharField(max_length=100)
    def __str__(self):
        return self.name
    
class StudentSubjectPreference(models.Model):
    student_profile = models.ForeignKey(StudentProfile, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    preference_type = models.BooleanField(default=True)  # True for like, False for dislike
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.student_profile.user.email} - {self.subject.name} - {'Like' if self.preference_type else 'Dislike'}"
    
class Hobby(models.Model):
    name = models.CharField(max_length=100)
    
    def __str__(self):
        return self.name
    
class StudentHobby(models.Model):
    student_profile = models.ForeignKey(StudentProfile, on_delete=models.CASCADE)
    hobby = models.ForeignKey(Hobby, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.student_profile.user.email} - {self.hobby.name}"

    
    
