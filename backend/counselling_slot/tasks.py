from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
# from backend.celery import app


# @app.task
# def send_booking_cancel_notification(student_email, counsellor_emails, slot_details):

#     print("📢 Sending cancellation notification")
#     print("Student:", student_email)
#     print("Counsellors:", counsellor_emails)
#     print("Slot:", slot_details)

#     return "Notification Sent"


@shared_task
def send_booking_cancel_notification(student_email, counsellor_emails, slot_details):

    subject = "Booking Cancelled"

    message = f"""
    Your booking has been cancelled.

    Date: {slot_details['date']}
    Time: {slot_details['start_time']} - {slot_details['end_time']}
    Mode: {slot_details['mode']}
    """

    # Send to student
    send_mail(
        subject,
        message,
        settings.EMAIL_HOST_USER,
        [student_email],
        fail_silently=False,
    )

    # Send to counsellors
    send_mail(
        subject,
        message,
        settings.EMAIL_HOST_USER,
        counsellor_emails,
        fail_silently=False,
    )

    return "Email notification sent"
