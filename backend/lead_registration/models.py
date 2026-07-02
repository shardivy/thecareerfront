from django.db import models

from django.utils import timezone
from datetime import timedelta
from accounts.models import Role, User
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
        # ('registered', 'Registered'),
        ('converted', 'Converted'),
    )

    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=15, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    dob = models.DateField(blank=True, null=True)
    study_class = models.CharField(max_length=200, null=True, blank=True)
    specialization = models.CharField(max_length=100, blank=True, null=True)
    stream = models.CharField(max_length=100, blank=True, null=True)
    # program = models.ForeignKey(Program, on_delete=models.CASCADE, null=True, blank=True)
    program = models.ManyToManyField(
        Program,
        blank=True,
        related_name="leads"
    )
    parent = models.ForeignKey(
        "lead_registration.ParentProfile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="leads"
    )
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

    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True, related_name="parent_profile")

    # Profile fields
    profession = models.CharField(max_length=100, blank=True, null=True)
    organization_name = models.CharField(max_length=150, blank=True, null=True)
    education_level = models.CharField(max_length=100, blank=True, null=True)
    father_background = models.CharField(max_length=200, blank=True, null=True)
    mother_background = models.CharField(max_length=200, blank=True, null=True)
    location = models.CharField(max_length=200, blank=True, null=True)
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
        self.otp = str(otp)
        self.otp_verified = False
        self.otp_created_at = timezone.now()
        self.save(update_fields=["otp", "otp_verified", "otp_created_at"])

    def verify_otp(self, entered_otp):
        if not self.otp:
            return False, "OTP not generated"

        if self.is_otp_expired():
            return False, "OTP expired"

        if str(self.otp) != str(entered_otp):
            return False, "Invalid OTP"

        # ✅ success
        self.otp_verified = True
        self.otp = None
        self.save(update_fields=["otp_verified", "otp"])

        return True, "OTP verified successfully"

    def is_otp_expired(self):
        if not self.otp_created_at:
            return True

        expiry_time = self.otp_created_at + timedelta(minutes=10)
        return timezone.now() > expiry_time

    def __str__(self):
        return f"ParentProfile of {self.user.email}"
    

class StudentProfile(models.Model):
    MODECHOICES = (
        ('online', 'Online'),
        ('offline', 'Offline'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="student_profile", null=True)
    parent = models.ForeignKey(ParentProfile, on_delete=models.SET_NULL, null=True, related_name='children')
    study_class = models.CharField(max_length=20, blank=True, null=True)
    dob = models.DateField(blank=True, null=True)
    current_academic_stage = models.CharField(max_length=20, blank=True, null=True)
    current_academic_year = models.CharField(max_length=10, blank=True, null=True)
    specialization = models.CharField(max_length=100, blank=True, null=True)
    stream = models.CharField(max_length=100, blank=True, null=True)
    preferred_counselling_mode = models.CharField(max_length=50, blank=True, null=True,choices=MODECHOICES) 
    suggested_stream = models.CharField(max_length=250, blank=True, null=True)

    school_college = models.CharField(max_length=200, blank=True, null=True)
    city = models.CharField(max_length=200, blank=True, null=True)
    qualification_status = models.CharField(max_length=100, blank=True, null=True)
    type = models.CharField(max_length=100, blank=True, null=True)
    is_profile_complete = models.BooleanField(default=False)
    
    previous_class_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True
    )

    board_exam_year = models.CharField(max_length=10, blank=True, null=True)

    improvement_areas = models.TextField(blank=True, null=True)
    
    otp = models.CharField(max_length=6, blank=True, null=True)
    # otp_verified = models.BooleanField(default=False)
    otp_created_at = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def set_otp(self, otp):
        self.otp = otp
        self.otp_created_at = timezone.now()
        self.save(update_fields=["otp", "otp_created_at"])

    def verify_otp(self, otp):
        if not self.otp:
            return False, "OTP not generated"

        if self.otp != otp:
            return False, "Invalid OTP"

        if timezone.now() > self.otp_created_at + timedelta(minutes=10):
            return False, "OTP expired"

        # Clear OTP after successful verification
        self.otp = None
        self.otp_created_at = None
        self.save(update_fields=["otp", "otp_created_at"])

        return True, "OTP verified successfully"
    
    def update_profile_completion(self):
        has_subjects = StudentSubjectPreference.objects.filter(
            student_profile=self
        ).exists()

        has_hobbies = StudentHobby.objects.filter(
            student_profile=self
        ).exists()

        self.is_profile_complete = has_subjects and has_hobbies
        self.save(update_fields=["is_profile_complete"])
        
    def __str__(self):
        if self.user:
            return f"StudentProfile of {self.user.first_name} {self.user.last_name} - {self.study_class}"
        return f"StudentProfile (No User) - {self.study_class}"
    
class StudentAcademicHistory(models.Model):
    student_profile = models.ForeignKey(StudentProfile, on_delete=models.CASCADE)
    academic_stage = models.CharField(max_length=20, blank=True, null=True)
    start_year = models.IntegerField(null=True, blank=True)
    end_year = models.IntegerField(null=True, blank=True)
    board_name = models.CharField(max_length=150, blank=True, null=True)
    coaching_entrance = models.CharField(max_length=200, blank=True, null=True)
    current_class_percentage = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    special_notes = models.TextField(blank=True, null=True) 
    is_current = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"AcademicHistory of {self.student_profile.user.email} - {self.academic_stage}"
    
class Stream(models.Model):
    name = models.CharField(max_length=100, unique=True, null=True, blank=True)
    programs = models.ManyToManyField(
        Program,
        related_name="streams",
        blank=True
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
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
    PREFERENCE_CHOICES = (
        ("like", "Like"),
        ("dislike", "Dislike"),
        ("moderate", "Moderate"),
    )
    student_profile = models.ForeignKey(StudentProfile, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    # preference_type = models.BooleanField(default=True)  # True for like, False for dislike
    preference_type = models.CharField(
        max_length=20,
        choices=PREFERENCE_CHOICES
    )
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
    
from django.db import models

class EmailOTP(models.Model):
    email = models.EmailField(unique=True)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.email

    
    
