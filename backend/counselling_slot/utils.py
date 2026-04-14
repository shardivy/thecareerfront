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