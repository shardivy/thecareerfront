from django.db import models

from accounts.models import User
from program_package.models import Package

class Payment(models.Model):
    METHOD_CHOICE = (
        
        ("cash", "Cash"),
        ("upi", "Upi")
    )
    
    PAYMENTTYPE_CHOICE = (
        ("online", "Online"),
        ("offline", "Offline")
    )
    
    STATUS_CHOICE = (
        ("fully_paid", "Fully Paid"),
        ("partial_paid", "Partial Paid"),
        ("verification_pending", "Verification Pending"),
        ("pending", "Pending")
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    package = models.ForeignKey(Package, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=20, decimal_places=2)
    payment_type = models.CharField(max_length=50, choices=PAYMENTTYPE_CHOICE)
    method = models.CharField(max_length=200, choices=METHOD_CHOICE)
    status = models.CharField(max_length=50, choices=STATUS_CHOICE, default='verification_pending')
    payment_date = models.DateField(blank=True, null=True)
    transaction_id = models.CharField(max_length=100, blank=True, unique=True, null=True)
    proof_file = models.FileField(upload_to='payments/', blank=True)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='verified_payments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.first_name} - {self.payment_type}"
    

class PaymentLog(models.Model):
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE)
    old_status = models.CharField(max_length=50)
    new_status = models.CharField(max_length=50)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    changed_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.old_status} - {self.new_status}"
    
    


