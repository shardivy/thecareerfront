import traceback

from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

from django.utils import timezone
from accounts.models import User
from counselling_slot.models import Booking
from counselling_slot.utils import send_booking_created_email, send_booking_updated_email
from notification.models import Notification, NotificationLog
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
    Time: {slot_details['start_time']} 
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

# ========================================================================

@shared_task
def create_system_notification(user_id, title, message):

    user = User.objects.get(id=user_id)

    notification = Notification.objects.create(
        user=user,
        type="system",
        title=title,
        message=message,
        is_sent=True
    )

    NotificationLog.objects.create(
        notification=notification,
        status="sent",
        sent_at=timezone.now()
    )
    
@shared_task
def send_email_task(subject, message, recipient):
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [recipient],
        fail_silently=False
    )

    
@shared_task
def send_booking_created_email_task(booking_ids):

    bookings = Booking.objects.filter(id__in=booking_ids)

    for booking in bookings:
        send_booking_created_email(
            user=booking.student.user,
            booking=booking,
            booking_slots=[booking.slot],
            booking_date=booking.date,
            send_email_func=send_email_task   # 👈 PASS FUNCTION
        )
    
# @shared_task
# def send_booking_updated_email_task(booking_ids):

#     bookings = Booking.objects.filter(id__in=booking_ids)

#     for booking in bookings:
#         send_booking_updated_email(
#             user=booking.student.user,
#             booking=booking,
#             booking_slots=[booking.slot],
#             booking_date=booking.date,
#             send_email_func=send_email_task   # 👈 PASS FUNCTION
#         )
@shared_task
def send_booking_updated_email_task(booking_ids):
    try:
        bookings = Booking.objects.filter(id__in=booking_ids)

        for booking in bookings:
            try:
                send_booking_updated_email(
                    user=booking.student.user,
                    booking=booking,
                    booking_slots=[booking.slot],
                    booking_date=booking.date,
                    send_email_func=send_email_task
                )
                print(f"✅ Email sent for booking {booking.id}")

            except Exception as e:
                print(f"❌ Email failed for booking {booking.id}")
                print(str(e))
                traceback.print_exc()

    except Exception as e:
        print("❌ Task failed")
        print(str(e))
        traceback.print_exc()