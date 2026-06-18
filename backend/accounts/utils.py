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
    subject = "Password Reset Request – One-Time Password (OTP)"

    message = f"""
Dear User,

We received a request to reset the password for your account.

Please use the following One-Time Password (OTP) to proceed with the password reset process:

----------------------------------------
OTP: {otp}
----------------------------------------

Note:
• This OTP is valid for 10 minutes only.
• Please do not share this OTP with anyone for security reasons.

If you did not request a password reset, please ignore this email. Your account will remain secure.

If you need any assistance, feel free to contact our support team.

Best regards,  
Abhinav Career Scope
"""

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False
    )

def send_user_credentials_email(email, password):
    subject = "Your Account Login Credentials"

    message = f"""
Dear User,

Greetings from the Career Counselling Team.

Your account has been successfully created. Please find your login credentials below:

----------------------------------------
Login Credentials
----------------------------------------
Email: {email}
Password: {password}
----------------------------------------

If you have any questions or require assistance, please feel free to contact our support team.

Best regards,  
Abhinav Career Scope
"""

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False
    )


# def send_credentials_email(email, password, program_name, package_name):
#     subject = "Congratulations! Your Account Has Been Successfully Created "

#     message = f"""
# Dear Candidate,

# Congratulations! 

# You have been successfully selected for the **{program_name}** program under the **{package_name}** service.

# We have excited to support you in your career journey.

# --------------------------------------------------
# Access Your Dashboard
# --------------------------------------------------

# You can access your dashboard and track your complete counselling journey using the login credentials below:

# Login Link:
# https://staging.abhinavcareerscope.com/

# Login Credentials:
# Email: {email}
# Password: {password}

# --------------------------------------------------
# Payment Details
# --------------------------------------------------

# Session Fees:

# 🔹 Online Session: ₹5,000 (via GPay)

# 🔹 Offline Session:
# ₹500 via GPay + ₹4,500 cash at the time of counseling

# --------------------------------------------------
# Important Instructions
# --------------------------------------------------

# ✔️ Please join using a **Laptop only**  
# ✔️ Join **5 minutes before the scheduled session** for technical checks  
# ✔️ Keep **paper and pen ready** for taking notes  

# --------------------------------------------------
# Offline Session Process (If Applicable)
# --------------------------------------------------

# Office Address:

# Mrs. Reena Bhutada  
# Abhinav Career Scope, Pune  
# Bhagwati Maestros, Miller 403  
# LMD Chowk, Above Indian Smart Bazaar  
# Bavdhan, Pune – 411021  

# 📌 Important Notes:

# • Office is near **Chandani Chowk, Bavdhan**  
# • Please start **20 minutes earlier** considering traffic  
# • **Parking is available outside the building gate**

# --------------------------------------------------
# Online Session Instructions
# --------------------------------------------------

# If your session is online:

# ✔️ Please join **5 minutes before the scheduled time**  
# ✔️ Ensure you have a **stable internet connection**  
# ✔️ Join the session using a **Laptop**

# --------------------------------------------------
# Fee Reminder (If Applicable)
# --------------------------------------------------

# Kindly pay the remaining **₹4,500 in cash** at the time of counseling.

# (If the fees are already fully paid, please ignore this reminder.)

# --------------------------------------------------

# If you have any questions or need assistance, feel free to contact our support team.

# We look forward to guiding you through your career journey.

# Best Regards,  
# Career Counselling Team  
# CareerFutura
# """

#     email_status = send_mail(
#         subject,
#         message,
#         settings.DEFAULT_FROM_EMAIL,
#         [email],
#         fail_silently=False
#     )
#     print("EMAIL STATUS:", email_status)

def send_credentials_email(
    email,
    password,
    program_name,
    package_name,
    preferred_counselling_mode
):
    """
    Send login credentials email

    - Online → Zoom link + online instructions
    - Offline → Office address + offline instructions
    """

    from django.conf import settings
    from django.core.mail import send_mail

    subject = "Congratulations! Your Account Has Been Successfully Created"

    preferred_mode = (
        preferred_counselling_mode or "online"
    ).lower()

    # ==========================================
    # COMMON MESSAGE
    # ==========================================
    common_message = f"""
Dear Student,

Congratulations!

You have been successfully selected for the {program_name} under the {package_name} service.

We are excited to support you in your career journey.

________________________________________

Dashboard Access

Login Link:
https://cms.abhinavcareerscope.com/

Login Credentials:

Email: {email}
Password: {password}

________________________________________

Session Fees

Online Session: ₹5,000 (via GPay)

Offline Session:
₹500 via GPay + ₹4,500 cash during counselling

________________________________________

Important Instructions

• Join using a laptop only
• Join 5 minutes before the session
• Keep a notebook and pen ready
"""

    # ==========================================
    # ONLINE SESSION
    # ==========================================
    if preferred_mode == "online":

        mode_message = """
________________________________________

Online Session Details

Zoom Link:
https://us06web.zoom.us/j/78343615915?pwd=ZjU2UnlGNEl3K2JvcHY0WGYyb1ZKQT09

• Ensure a stable internet connection
• Keep audio/video ready
• Keep required documents handy
"""

    # ==========================================
    # OFFLINE SESSION
    # ==========================================
    else:

        mode_message = """
________________________________________

Offline Session Process

Office Address:

Mrs. Reena Bhutada
Abhinav Career Scope, Pune
Bhagwati Maestros, Miller 403
LMD Chowk, Above Indian Smart Bazaar
Bavdhan, Pune – 411021

📌 Important Notes:

• Office is near Chandani Chowk, Bavdhan
• Please start 20 minutes earlier considering traffic
• Parking is available outside the building gate
• Carry required documents
• Reach venue 30 minutes early
"""

    # ==========================================
    # CLOSING MESSAGE
    # ==========================================
    closing_message = """
________________________________________

Fee Reminder

Kindly pay the remaining ₹4,500 in cash at the time of counselling.

(If already paid in full, please ignore this reminder.)

________________________________________

For any queries or assistance:

Call / WhatsApp:
+91 99226 95424 | +91 82080 30557

We look forward to guiding you in your career journey.

Best Regards,
Abhinav Career Scope
"""

    # ==========================================
    # FINAL MESSAGE
    # ==========================================
    message = (
        common_message
        + mode_message
        + closing_message
    )

    # ==========================================
    # SEND EMAIL
    # ==========================================
    email_status = send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False
    )

    print("EMAIL STATUS:", email_status)




def send_password_reset_email(email, password):
    subject = "Password Reset Successful"
    message = f"""
Hello,

Your password has been reset successfully.

Login Credentials:
Email: {email}
Password: {password}

If you did not perform this action, please contact support immediately.

Regards,
Abhinav Career Scope
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
    "ui_ux": "UIUX",
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
