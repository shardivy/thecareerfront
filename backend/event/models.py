from django.db import models
from django.conf import settings

from accounts.models import User
from counselling_slot.models import Slot
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
    
class HandHoldingSession(models.Model):
    title = models.CharField(max_length=200, null=True)
    description = models.TextField(null=True, blank=True)
    ordering = models.PositiveIntegerField(default=1)
    # created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


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
    show_profile = models.BooleanField(default=False)

    full_address = models.TextField(null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    state = models.CharField(max_length=100, null=True, blank=True)
    pincode = models.CharField(max_length=10, null=True, blank=True)

    preferred_counselling_mode = models.CharField(max_length=10, choices=MODE_CHOICES, null=True, blank=True)
    total_sessions = models.PositiveIntegerField(null=True, blank=True)
    completed_sessions = models.PositiveIntegerField(default=0)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    certificate_issued = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - Handholding"


class HandHoldingParticipantSession(models.Model):
    STATUS_CHOICES = (
        ('not_booked', 'Not Booked'),
        ('booked', 'Booked'),
        ('in_progress', 'In Progress'),
        ('rescheduled', 'Rescheduled'),
        ('completed', 'Completed'),
        ('pending', 'Pending'),
        ('cancelled', 'Cancelled'),
    )
    
    slot = models.ForeignKey(
        'counselling_slot.Slot',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='slot_id'
    )

    handholding_participant = models.ForeignKey(
        HandHoldingParticipant,
        on_delete=models.CASCADE,
        related_name='sessions'
    )
    handholding_session = models.ForeignKey(HandHoldingSession, on_delete=models.CASCADE, null=True, blank=True)

    conducted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='conducted_handholding_sessions'
    )

    session_no = models.PositiveIntegerField()
    session_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    notes = models.TextField(blank=True, null=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)



class Certificate(models.Model):
    PROGRAM_TYPE_CHOICES = (
        ('handholding', 'Handholding'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    program_type = models.CharField(max_length=50, choices=PROGRAM_TYPE_CHOICES, null=True, blank=True)
    certificate_file = models.FileField(upload_to='certificates/', null=True, blank=True)
    certificate_status = models.CharField(max_length=20, choices=(
        ('pending', 'Pending'),
        ('issued', 'Issued'),
    ), default='pending')
    issued_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.program_type}"


class Advertisement(models.Model):
    STATUS_CHOICES = (
        ('scheduled', 'Scheduled'),
        ('live', 'Live'),
        ('completed', 'Completed'),
    )

    advertisement_name = models.CharField(max_length=200, null=True, blank=True)
    advertiser_name = models.CharField(max_length=200, null=True, blank=True)
    contact_mobile = models.CharField(max_length=15, null=True, blank=True)
    contact_email = models.EmailField()

    ad_platform = models.CharField(max_length=100, null=True, blank=True)

    ad_start_date = models.DateField(null=True, blank=True)
    ad_end_date = models.DateField(null=True, blank=True)

    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    ad_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_ads'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.advertiser_name

