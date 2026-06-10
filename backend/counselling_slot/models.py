from django.db import models

from accounts.models import User
from program_package.models import Package, Program
from lead_registration.models import StudentProfile

class Counsellor(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="counsellor")
    specialization = models.CharField(max_length=150, null=True, blank=True)
    is_active = models.BooleanField(default=False)
    
class Slot(models.Model):
    MODE_CHOICES = (
        ('online', 'Online'),
        ('offline', 'Offline'),
    )

    counsellor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="counsellor_slots"
    )

    date = models.DateField()
    start_time = models.CharField(max_length=150, blank=True, null=True)
    end_time = models.CharField(max_length=150, null=True, blank=True)
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, null=True, blank=True)
    # duration_minutes = models.PositiveIntegerField()
    is_available = models.BooleanField(default=True)
    is_deleted = models.BooleanField(default=False)
    is_handholding_session_available = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "slots"
        constraints = [
            models.UniqueConstraint(
                fields=["counsellor", "date", "start_time"],
                name="unique_counsellor_date_start_time"
            )
        ]
        
    def delete(self, using=None, keep_parents=False):
        """Override delete to only soft delete"""
        self.is_deleted = True
        self.is_available = False
        self.save(update_fields=["is_deleted", "is_available"])

    def hard_delete(self):
        """Actually delete from database if needed"""
        super().delete()


    
class Booking(models.Model):
    STATUS_CHOICES = (
        ('not_booked', 'Not Booked'),
        ('booked', 'Booked'),
        ('rescheduled', 'Rescheduled'),
        ('completed', 'Completed'),
        ('pending', 'Pending'),
        ('cancelled', 'Cancelled'),
    )

    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='student_bookings')
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
    slot = models.ForeignKey(Slot, on_delete=models.CASCADE, null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='booked')
    session_type = models.CharField(max_length=20, blank=True, null=True)
    date = models.DateField(blank=True, null=True)
    meeting_link = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
class BookingCounsellor(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE)
    counsellor = models.ForeignKey(Counsellor, on_delete=models.CASCADE)
    role = models.CharField(max_length=50, blank=True, null=True, choices=[
        ('lead', 'Lead'),
        ('assistant', 'Assistant'),
    ])  
    assigned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = "booking_counsellors"
        unique_together = ("booking", "counsellor")  # prevent duplicates

    def __str__(self):
        return f"{self.booking_id} - {self.counsellor_id} ({self.role})"

    
    
class CounsellingNote(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, null=True, blank=True)
    counsellor = models.ForeignKey(Counsellor, on_delete=models.CASCADE, null=True, blank=True)
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
    notes = models.TextField(null=True, blank=True)
    file1 = models.FileField(upload_to="counselling_notes/", null=True, blank=True)
    file2 = models.FileField(upload_to="counselling_notes/", null=True, blank=True)
    file3 = models.FileField(upload_to="counselling_notes/", null=True, blank=True)
    file4 = models.FileField(upload_to="counselling_notes/", null=True, blank=True)
    file5 = models.FileField(upload_to="counselling_notes/", null=True, blank=True)  
    created_at = models.DateTimeField(auto_now_add=True)


class FollowUp(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
    )

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE)
    followup_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)

    


    

