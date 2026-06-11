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
        ("not_paid", "Not Paid"),
        ("fully_paid", "Fully Paid"),
        ("partial_paid", "Partial Paid"),
        ("verification_pending", "Verification Pending"),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    # package = models.ForeignKey(Package, on_delete=models.CASCADE, null=True, blank=True)
    package = models.ManyToManyField(
        Package,
        blank=True
    )
    amount = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    payment_type = models.CharField(max_length=50, choices=PAYMENTTYPE_CHOICE, null=True, blank=True)
    method = models.CharField(max_length=200, choices=METHOD_CHOICE, null=True, blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICE, default='verification_pending')
    payment_date = models.DateField(blank=True, null=True)
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    proof_file = models.FileField(upload_to='payments/', blank=True, null=True)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='verified_payments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        user_name = self.user.first_name if self.user else "No User"
        payment_type = self.payment_type if self.payment_type else "No Type"

        return f"{user_name} - {payment_type}"
    

class PaymentLog(models.Model):
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE)
    old_status = models.CharField(max_length=50)
    new_status = models.CharField(max_length=50)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    changed_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.old_status} - {self.new_status}"
    
    


