from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from datetime import timedelta
from .models import Event

@shared_task
def send_event_reminder_by_id(event_id):
    print("RUNNING TASK", event_id)
    try:
        event = Event.objects.get(id=event_id)

        if not event.concerned_person_email:
            return "No email found"

        send_mail(
            subject=f"Reminder: {event.seminar_webinar_name}",
            message=f"""
Hello {event.concerned_person_name},

This is a reminder for your event:

Event: {event.seminar_webinar_name}
Date: {event.event_start_date}
Time: {event.event_start_time}

Regards,
Creer Counselling Team
            """,
            from_email='shwetabbamane@gmail.com',
            recipient_list=[event.concerned_person_email],
            fail_silently=False,
        )

        return "Email sent"

    except Event.DoesNotExist:
        return "Event not found"