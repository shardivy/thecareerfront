from django.core.mail import send_mail
from django.conf import settings

from counselling_slot.models import BookingCounsellor


# def send_booking_created_email(user, booking_slots, booking_date):
#     """
#     Email when booking is created
#     """

#     subject = "Your Counselling Session Has Been Booked"

#     slot_details = ""
#     for slot in booking_slots:
#         slot_details += f"""
# Slot Date: {slot.date}
# Start Time: {slot.start_time}
# End Time: {slot.end_time}
# Mode: {slot.mode}
# """

#     message = f"""
# Dear {user.first_name},

# Your counselling session has been successfully booked.

# Booking Date: {booking_date}

# Session Details:
# {slot_details}

# Please make sure to join the session on time.

# If you need to reschedule, please contact support.

# Best Regards  
# Abhinav Career Scope
# """

#     send_mail(
#         subject,
#         message,
#         settings.DEFAULT_FROM_EMAIL,
#         [user.email],
#         fail_silently=True
#     )

def send_booking_created_email(user, booking, booking_slots, booking_date, send_email_func):

    subject = "Your Counselling Session Has Been Booked"

    slot_details = "\n".join([
        f"""
Slot Date: {slot.date}
Start Time: {slot.start_time}
Mode: {slot.mode}
"""
        for slot in booking_slots
    ])

    # =========================
    # STUDENT EMAIL
    # =========================
    send_email_func(
        subject,
        f"""Dear {user.first_name},

Your counselling session has been successfully booked.

Booking Date: {booking_date}

Session Details:
{slot_details}

Best Regards
Abhinav Career Scope
""",
        user.email
    )

    # =========================
    # COUNSELLOR EMAILS
    # =========================
    booking_counsellors = BookingCounsellor.objects.filter(
        booking=booking
    ).select_related("counsellor__user")

    for bc in booking_counsellors:

        email = bc.counsellor.user.email if bc.counsellor else None
        if not email:
            continue

        send_email_func(
            subject,
            f"""Dear {bc.counsellor.user.first_name},

A counselling session has been booked and assigned to you.

Student: {user.first_name} {user.last_name}
Role: {bc.role}

Booking Date: {booking_date}

Session Details:
{slot_details}

Best Regards
Abhinav Career Scope
""",
            email
        )

# def send_booking_updated_email(user, booking_slots, booking_date):
#     """
#     Email when booking is updated
#     """

#     subject = "Your Counselling Session Has Been Updated"

#     slot_details = ""
#     for slot in booking_slots:
#         slot_details += f"""
# Slot Date: {slot.date}
# Start Time: {slot.start_time}
# End Time: {slot.end_time}
# Mode: {slot.mode}
# """

#     message = f"""
# Dear {user.first_name},

# Your counselling session booking has been updated.

# Updated Session Details:

# Booking Date: {booking_date}

# {slot_details}

# Please review the updated session schedule.

# If you have any questions, feel free to contact our support team.

# Best Regards  
# Abhinav Career Scope
# """

#     send_mail(
#         subject,
#         message,
#         settings.DEFAULT_FROM_EMAIL,
#         [user.email],
#         fail_silently=True
#     )

def send_booking_updated_email(user, booking, booking_slots, booking_date, send_email_func):

    subject = "Your Counselling Session Has Been Updated"

    slot_details = "\n".join([
        f"""
Slot Date: {slot.date}
Start Time: {slot.start_time}
Mode: {slot.mode}
"""
        for slot in booking_slots
    ])

    send_email_func(
        subject,
        f"""Dear {user.first_name},

Your counselling session booking has been updated.

Booking Date: {booking_date}

Session Details:
{slot_details}

Best Regards
Abhinav Career Scope
""",
        user.email
    )

    booking_counsellors = BookingCounsellor.objects.filter(
        booking=booking
    ).select_related("counsellor__user")

    for bc in booking_counsellors:

        email = bc.counsellor.user.email if bc.counsellor else None
        if not email:
            continue

        send_email_func(
            subject,
            f"""Dear {bc.counsellor.user.first_name},

The counselling session has been updated.

Student: {user.first_name} {user.last_name}
Role: {bc.role}

Booking Date: {booking_date}

Updated Session Details:
{slot_details}

Best Regards
Abhinav Career Scope
""",
            email
        )
        
        
        
               
def generate_counselling_reminder(slot, student_profile, booking_status, program=None, package=None):
    """
    Generate counselling reminder subject + message
    based on:
    - booked
    - rescheduled
    - not_booked
    """

    preferred_mode = (
        student_profile.preferred_counselling_mode or "online"
    ).lower()
    
    program_name = program.name if program else "N/A"
    package_name = package.name if package else "N/A"

    # ==========================================
    # 🔹 NOT BOOKED
    # ==========================================
    if booking_status in ["not_booked", "pending"]:
        return {
            "subject": "Slot Booking Reminder | Abhinav Career Scope",
            "message": f"""
Greetings from Abhinav Career Scope.

You have not booked your counselling slot yet.

Please book your slot as soon as possible to continue your counselling process.

Regards,
Abhinav Career Scope.
""".strip()
        }

    # ==========================================
    # 🔹 BOOKED / RESCHEDULED SUBJECT
    # ==========================================
    if booking_status == "rescheduled":
        subject = "Rescheduled Counselling Session Reminder | Abhinav Career Scope"
        session_label = "Your rescheduled session"
    else:
        subject = "Counselling Session Reminder | Abhinav Career Scope"
        session_label = "Your session"

    # ==========================================
    # 🔹 ONLINE MESSAGE
    # ==========================================
    if preferred_mode == "online":

        message = f"""
Greetings from Abhinav Career Scope.

Program : {program_name}
Package : {package_name}

{session_label} is scheduled on {slot.date} at {slot.start_time}.
Please join 15 minutes before the scheduled time.

Instructions for Online:
- Ensure stable internet connection
- Keep your audio/video ready
- Join using the provided meeting link
- Keep necessary documents ready

For any queries or assistance:

Call / WhatsApp:
+91 99226 95424 | +91 82080 30557

Regards,
Abhinav Career Scope.
""".strip()

    # ==========================================
    # 🔹 OFFLINE MESSAGE
    # ==========================================
    else:

        message = f"""
Greetings from Abhinav Career Scope.

Program : {program_name}
Package : {package_name}

{session_label} is scheduled on {slot.date} at {slot.start_time}.
Please reach half an hour before the scheduled time.

Instructions for Offline:
- Reach venue 30 minutes early
- Carry required documents
- Be punctual
- Contact counsellor if delayed

For any queries or assistance:

Call / WhatsApp:
+91 99226 95424 | +91 82080 30557

Regards,
Abhinav Career Scope.
""".strip()

    return {
        "subject": subject,
        "message": message
    }