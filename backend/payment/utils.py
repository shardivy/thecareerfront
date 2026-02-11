from django.core.mail import send_mail

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
