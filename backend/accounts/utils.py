import random
import string
from django.core.mail import send_mail
from django.conf import settings


def generate_password(length=8):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))


def generate_otp():
    return str(random.randint(100000, 999999))

def send_otp_email(email, otp):
    subject = "Password Reset OTP"
    message = f"""
Hello 👋

We received a request to reset your password.

Your One-Time Password (OTP) is: {otp}

⚠️ This OTP is valid for 10 minutes only.

If you did not request a password reset, please ignore this email.

Regards,
Career Counselling Team
"""

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False
    )


def send_credentials_email(email, password):
    subject = "Your Login Credentials"
    message = f"""
Hello 👋

Your account has been successfully created.

Login Credentials:
Email: {email}
Password: {password}

Please login and change your password after first login.

Regards,
Career Counselling Team
"""

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False
    )


def send_password_reset_email(email, password):
    subject = "Password Reset Successful"
    message = f"""
Hello 👋,

Your password has been reset successfully.

Login Credentials:
Email: {email}
Password: {password}

If you did not perform this action, please contact support immediately.

Regards,
Career Counselling Team
"""

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False
    )
    
    
ROLE_PREFIX = {
    "superadmin": "SUP",
    "admin": "ADM",
    "student": "STU",
    "parent": "PAR",
    # "lead_counsellor": "LCNS",
    "counsellor": "CNS",
}

def generate_role_id(role_name, model, field_name):
    prefix = ROLE_PREFIX.get(role_name)

    if not prefix:
        raise ValueError(f"Invalid role_name: {role_name}")

    last_obj = model.objects.filter(
        **{f"{field_name}__startswith": prefix}
    ).order_by('-id').first()

    if last_obj and getattr(last_obj, field_name):
        last_number = int(getattr(last_obj, field_name).split('_')[1])
        next_number = last_number + 1
    else:
        next_number = 1

    return f"{prefix}_{next_number:04d}"


def generate_otp():
    return random.randint(100000, 999999)
