from django.core.mail import send_mail
from django.conf import settings

def send_payment_reject_email(email):
    send_mail(
        subject="Payment Rejected",
        message="Your payment has been rejected. Please try again.",
        from_email="noreply@yourapp.com",
        recipient_list=[email],
        fail_silently=False
    )

def send_payment_reject_whatsapp(phone):
    print(f"WhatsApp sent to {phone}: Your payment has been rejected.")
    
def send_payment_created_email(user, payment):
    """
    Send email when payment is created
    """

    subject = "Payment Received Successfully"

    message = f"""
Dear {user.first_name},

We have received your payment successfully.

Payment Details:
Payment ID: {payment.id}
Amount Paid: {payment.amount}
Payment Status: {payment.status}

Thank you for your payment.

Best Regards,
Support Team
"""

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=True
    )


def send_payment_updated_email(user, payment):
    """
    Send email when payment is updated
    """

    subject = "Payment Status Updated"

    message = f"""
Dear {user.first_name},

Your payment information has been updated.

Updated Payment Details:
Payment ID: {payment.id}
Amount: {payment.amount}
Payment Status: {payment.status}

Please login to the portal to view updated details.

Best Regards,
Support Team
"""

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=True
    )
    
def send_payment_approved_email(user, payment, cumulative_amount, package_price):
    """
    Email when admin approves payment
    """

    subject = "Your Payment Has Been Approved"

    message = f"""
Dear {user.first_name},

Your payment has been successfully verified by our team.

Payment Details:
Payment ID: {payment.id}
Amount Paid: {payment.amount}
Payment Status: {payment.status}

Total Paid So Far: {cumulative_amount}
Package Price: {package_price}

"""

    if payment.status == "fully_paid":
        message += """
Your package has now been fully paid and activated.
You can access your program and related services from your student portal.
"""
    else:
        message += """
Your payment has been recorded as a partial payment.
Please complete the remaining payment to activate your full package access.
"""

    message += """

Thank you for choosing our services.

Best Regards  
Support Team
"""

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=True
    )


def send_payment_rejected_email(user):
    """
    Email when admin rejects payment
    """

    subject = "Payment Verification Failed"

    message = f"""
Dear {user.first_name},

Unfortunately, your recent payment submission could not be verified by our team.

Possible reasons may include:
• Invalid payment proof
• Incorrect transaction details
• Payment not received in our account

Please review your payment details and submit the correct information again.

If you believe this is an error, please contact our support team.

Best Regards  
Support Team
"""

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=True
    )
