from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from datetime import timedelta

from django.conf import settings
from .models import Event

@shared_task(bind=True)
def send_event_reminder_by_id(self, event_id):
    import traceback
    print("EMAIL_HOST:", settings.EMAIL_HOST)
    print("EMAIL_PORT:", settings.EMAIL_PORT)
    print("EMAIL_HOST_USER:", settings.EMAIL_HOST_USER)

    print("RUNNING TASK", event_id)

    try:
        event = Event.objects.get(id=event_id)

        print("EMAIL:", event.concerned_person_email)
        print("SMTP HOST:", settings.EMAIL_HOST)

        send_mail(
            subject=f"Reminder: {event.seminar_webinar_name}",
            message=f"""
Dear {event.concerned_person_name},

This is a reminder for your event:

Event: {event.seminar_webinar_name}
Date: {event.event_start_date}
Time: {event.event_start_time}

Regards,
Career Counselling Team
            """,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[event.concerned_person_email],
            fail_silently=False,
        )

        print("EMAIL SENT SUCCESS")
        return "Email sent"

    except Exception as e:
        print("FULL ERROR:", traceback.format_exc())
        raise self.retry(exc=e, countdown=60, max_retries=3)