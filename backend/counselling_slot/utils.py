from django.core.mail import send_mail
from django.conf import settings


def send_booking_created_email(user, booking_slots, booking_date):
    """
    Email when booking is created
    """

    subject = "Your Counselling Session Has Been Booked"

    slot_details = ""
    for slot in booking_slots:
        slot_details += f"""
Slot Date: {slot.date}
Start Time: {slot.start_time}
End Time: {slot.end_time}
Mode: {slot.mode}
"""

    message = f"""
Dear {user.first_name},

Your counselling session has been successfully booked.

Booking Date: {booking_date}

Session Details:
{slot_details}

Please make sure to join the session on time.

If you need to reschedule, please contact support.

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


def send_booking_updated_email(user, booking_slots, booking_date):
    """
    Email when booking is updated
    """

    subject = "Your Counselling Session Has Been Updated"

    slot_details = ""
    for slot in booking_slots:
        slot_details += f"""
Slot Date: {slot.date}
Start Time: {slot.start_time}
End Time: {slot.end_time}
Mode: {slot.mode}
"""

    message = f"""
Dear {user.first_name},

Your counselling session booking has been updated.

Updated Session Details:

Booking Date: {booking_date}

{slot_details}

Please review the updated session schedule.

If you have any questions, feel free to contact our support team.

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
    
    
def generate_counselling_reminder(slot, student_profile, booking_status):
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

    # ==========================================
    # 🔹 NOT BOOKED
    # ==========================================
    if booking_status == "not_booked":
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