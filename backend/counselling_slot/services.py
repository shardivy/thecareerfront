from collections import defaultdict
from django.db import transaction
from counselling_slot.models import Booking, Counsellor, Slot

FIXED_SLOTS = [
    # ("10:00 AM", "12:00 PM"),
    # ("12:00 PM", "02:00 PM"),
    # ("02:00 PM", "04:00 PM"),
    # ("04:00 PM", "06:00 PM"),
    "08:00 AM",
    "08:30 AM",
    "09:00 AM",
    "09:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "12:00 PM",
    "12:30 PM",
    "01:00 PM",
    "01:30 PM",
    "02:00 PM",
    "02:30 PM",
    "03:00 PM",
    "03:30 PM",
    "04:00 PM",
    "04:30 PM",
    "05:00 PM",
    "05:30 PM",
    "06:00 PM",
]

@transaction.atomic
def generate_slots_for_date(selected_date):
    counsellors = Counsellor.objects.filter(is_active=True).select_related("user")

    for counsellor in counsellors:
        for start_time in FIXED_SLOTS:
            slot, created = Slot.objects.get_or_create(
                counsellor=counsellor.user,
                date=selected_date,
                start_time=start_time,
                # end_time=end_time,
                defaults={
                    "mode": "online",
                    "is_available": True
                }
            )
            # If slot exists but was soft deleted → DO NOT recreate
            if not created and slot.is_deleted:
                continue


def get_counsellor_slots_by_date(selected_date):
    generate_slots_for_date(selected_date)

    # Get all slots for date
    slots = (
        Slot.objects
        .filter(date=selected_date, is_deleted=False)
        .select_related("counsellor")
        .order_by("start_time")
    )

    # Get all bookings for that date
    bookings = Booking.objects.filter(date=selected_date)

    # Map slot_id -> booking
    booking_map = {booking.slot_id: booking for booking in bookings}

    counsellor_data = defaultdict(list)

    for slot in slots:
        booking = booking_map.get(slot.id)

        counsellor_data[slot.counsellor.id].append({
            "id": slot.id,
            "start_time": slot.start_time,
            # "end_time": slot.end_time,
            "mode": slot.mode,
            "is_available": slot.is_available,
            "booking_status": booking.status if booking else None,
            # "student_id": booking.student_id if booking else None,
        })

    result = []

    for counsellor in Counsellor.objects.filter(is_active=True).select_related("user"):
        result.append({
            "counsellor_id": counsellor.user.id,
            "counsellor_name": f"{counsellor.user.first_name} {counsellor.user.last_name}".strip(),
            "specialization": counsellor.specialization,
            "is_active": counsellor.is_active,
            "slots": counsellor_data.get(counsellor.user.id, [])
        })

    return result