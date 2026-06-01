from django.db.models.signals import post_save
from django.dispatch import receiver

from event.models import HandHoldingParticipant, HandHoldingParticipantSession, HandHoldingSession



@receiver(post_save, sender=HandHoldingSession)
def create_sessions_for_all_participants(sender, instance, created, **kwargs):
    if not created:
        return

    participants = HandHoldingParticipant.objects.all()

    session_number = instance.ordering  # or calculate dynamically

    bulk_data = []

    for participant in participants:
        # Avoid duplicate (important safety)
        if not HandHoldingParticipantSession.objects.filter(
            handholding_participant=participant,
            session_no=session_number
        ).exists():

            bulk_data.append(
                HandHoldingParticipantSession(
                    handholding_participant=participant,
                    handholding_session=instance,
                    session_no=session_number,
                    session_date=instance.created_at,  # or timezone.now()
                    status='not_booked'
                )
            )

    HandHoldingParticipantSession.objects.bulk_create(bulk_data)