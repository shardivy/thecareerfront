from django.db import models
from django.conf import settings

from accounts.models import User
from payment.models import Payment

class Event(models.Model):
    EVENT_TYPE_CHOICES = (
        ('seminar', 'Seminar'),
        ('webinar', 'Webinar'),
    )

    MODE_CHOICES = (
        ('online', 'Online'),
        ('offline', 'Offline'),
    )

    STATUS_CHOICES = (
        ('planned', 'Planned'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    event_type = models.CharField(max_length=20, choices=EVENT_TYPE_CHOICES)
    title = models.CharField(max_length=200)

    institute_name = models.CharField(max_length=200)
    concerned_person_name = models.CharField(max_length=150)
    concerned_person_mobile = models.CharField(max_length=15)
    concerned_person_email = models.EmailField()

    event_date = models.DateTimeField()
    event_mode = models.CharField(max_length=20, choices=MODE_CHOICES)
    location = models.CharField(max_length=255, blank=True)

    is_paid = models.BooleanField(default=False)
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    conducted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)

    created_at = models.DateTimeField(auto_now_add=True)


class HandHoldingParticipant(models.Model):
    MODE_CHOICES = (
        ('online', 'Online'),
        ('offline', 'Offline'),
    )

    STATUS_CHOICES = (
        ('active', 'Active'),
        ('completed', 'Completed'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, null=True, blank=True)

    resume_file = models.FileField(upload_to='handholding/resumes/', blank=True, null=True)
    photo = models.ImageField(upload_to='handholding/photos/', blank=True, null=True)

    mobile = models.CharField(max_length=15, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)

    full_address = models.TextField()
    city = models.CharField(max_length=100, null=True, blank=True)
    state = models.CharField(max_length=100, null=True, blank=True)
    pincode = models.CharField(max_length=10, null=True, blank=True)

    mode = models.CharField(max_length=10, choices=MODE_CHOICES, null=True, blank=True)
    total_sessions = models.PositiveIntegerField(default=10, null=True, blank=True)
    completed_sessions = models.PositiveIntegerField(default=0)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    certificate_issued = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - Handholding"


class HandHoldingSession(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
    )

    participant = models.ForeignKey(
        HandHoldingParticipant,
        on_delete=models.CASCADE,
        related_name='sessions'
    )

    conducted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='conducted_handholding_sessions'
    )

    session_no = models.PositiveIntegerField()
    session_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('participant', 'session_no')


class Certificate(models.Model):
    PROGRAM_TYPE_CHOICES = (
        ('handholding', 'Handholding'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    program_type = models.CharField(max_length=50, choices=PROGRAM_TYPE_CHOICES)
    certificate_file = models.FileField(upload_to='certificates/')
    issued_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.program_type}"


class Advertisement(models.Model):
    STATUS_CHOICES = (
        ('scheduled', 'Scheduled'),
        ('live', 'Live'),
        ('completed', 'Completed'),
    )

    advertiser_name = models.CharField(max_length=200)
    contact_mobile = models.CharField(max_length=15)
    contact_email = models.EmailField()

    ad_platform = models.CharField(max_length=100)

    ad_start_date = models.DateField()
    ad_end_date = models.DateField()

    amount = models.DecimalField(max_digits=10, decimal_places=2)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_ads'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.advertiser_name

