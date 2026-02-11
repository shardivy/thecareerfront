from django.db import models

from accounts.models import User

class Counsellor(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    specialization = models.CharField(max_length=150)
    is_active = models.BooleanField(default=True)
    
class Slot(models.Model):
    MODE_CHOICES = (
        ('online', 'Online'),
        ('offline', 'Offline'),
    )

    lead_counsellor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="lead_slots"
    )

    normal_counsellor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="normal_slots"
    )

    date = models.DateField()
    start_time = models.CharField(max_length=150, blank=True, null=True)
    end_time = models.CharField(max_length=150, null=True, blank=True)
    mode = models.CharField(max_length=20, choices=MODE_CHOICES)
    duration_minutes = models.PositiveIntegerField()
    is_available = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "slots"

    
class Booking(models.Model):
    STATUS_CHOICES = (
        ('scheduled', 'Scheduled'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    
    MODE_CHOICES = (
        ('online', 'Online'),
        ('offline', 'Offline'),
    )

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='student_bookings')
    slot = models.ForeignKey(Slot, on_delete=models.CASCADE)
    lead_counsellor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lead_bookings')
    normal_counsellor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='normal_bookings')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    mode = models.CharField(max_length=20, choices=MODE_CHOICES)
    date = models.DateField(blank=True, null=True)
    meeting_link = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    
class CounsellingNote(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE)
    counsellor = models.ForeignKey(Counsellor, on_delete=models.CASCADE)
    notes = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


class FollowUp(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
    )

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE)
    followup_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)

    


    

