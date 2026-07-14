import traceback

from django.db.migrations import serializer
from django.shortcuts import get_object_or_404, render
from backend import settings
from payment.models import Payment
from payment.views import PaymentCreateAPIView
from report.models import Report
from counselling_slot.utils import generate_counselling_reminder, send_booking_created_email, send_booking_updated_email
from lead_registration.models import StudentProfile
from counselling_slot.tasks import create_system_notification, send_booking_cancel_notification, send_booking_created_email_task, send_booking_updated_email_task
from django.db.transaction import on_commit
from counselling_slot.services import get_counsellor_slots_by_date
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import transaction
from collections import defaultdict
from datetime import timedelta
from django.utils.timezone import now
from calendar import monthrange
from django.db.models import Count
from django.core.exceptions import ObjectDoesNotExist
from django.core.mail import EmailMessage, get_connection

from datetime import datetime
from django.utils import timezone
from django.core.files.storage import default_storage
from rest_framework.parsers import MultiPartParser, FormParser
import os
import pytz
import mimetypes
from django.db.models import F, ExpressionWrapper, DateTimeField
from django.http import FileResponse
from django.utils.decorators import method_decorator
from django.views.decorators.clickjacking import xframe_options_exempt

from accounts.models import User
from django.db import IntegrityError
from accounts.permissions import IsAdmin, IsCounsellor, IsSuperAdmin
from counselling_slot.models import Booking, BookingCounsellor, CounsellingNote, CounsellingNote, Counsellor, Slot
from counselling_slot.serializers import AddCounsellorSerializer, BookingCreateSerializer, BookingReadSerializer, CounsellingNoteSerializer, CounsellorBookingSerializer, CounsellorListSerializer, CounsellorResponseSerializer, CounsellorStudentBookingSerializer, LeadCounsellorUserSerializer, SlotCreateSerializer, SlotResponseSerializer, SlotUpdateSerializer, StudentBookingSerializer, UserBasicSerializer
 
# ============================ New Code Below =========================

    # ("10:00 AM", "12:00 PM"),
    # ("12:00 PM", "02:00 PM"),
    # ("02:00 PM", "04:00 PM"),
    # ("04:00 PM", "06:00 PM"),

FIXED_SLOTS = [   
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


class CounsellorListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # counsellors = Counsellor.objects.select_related("user").all()
        counsellors = Counsellor.objects.select_related("user").exclude(
            user__first_name__icontains="Reena",
            user__last_name__icontains="Bhutada"
        )
        serializer = CounsellorListSerializer(counsellors, many=True)
        return Response(serializer.data)
    
class AllCounsellorListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        counsellors = Counsellor.objects.select_related("user").all()
        serializer = CounsellorListSerializer(counsellors, many=True)
        return Response(serializer.data)
    
class ReenaCounsellorAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        counsellors = Counsellor.objects.select_related("user").filter(
            user__first_name__icontains="Reena",
            user__last_name__icontains="Bhutada"
        )

        serializer = CounsellorListSerializer(
            counsellors,
            many=True
        )

        return Response(serializer.data)
    
       
# API to create a counselling slot  

# class SlotCreateAPIView(APIView):
#     permission_classes = [IsAuthenticated]

#     @transaction.atomic
#     def get(self, request, date, counsellor):
#         """
#         counsellor → COUNSELLOR TABLE ID from URL
#         """

#         # =========================
#         # 🔹 Fetch Counsellor
#         # =========================
#         counsellor_obj = Counsellor.objects.select_related("user").filter(
#             id=counsellor
#         ).first()

#         if not counsellor_obj:
#             return Response(
#                 {"message": "Counsellor not found"},
#                 status=status.HTTP_404_NOT_FOUND
#             )

#         # ✅ CORRECT IDs
#         counsellor_table_id = counsellor_obj.id
#         counsellor_user_id = counsellor_obj.user_id
#         counsellor_is_active = counsellor_obj.is_active

#         # =========================
#         # 🔹 Check existing slots
#         # =========================
#         existing_slots_qs = Slot.objects.filter(
#         counsellor_id=counsellor_user_id,
#         date=date,
#         # is_deleted=False  
#     )


#         slots_created = False

#         if not existing_slots_qs.exists():
#             for start_time, end_time in FIXED_SLOTS:
#                 Slot.objects.create(
#                     counsellor_id=counsellor_user_id,  # ✅ USER ID ONLY
#                     date=date,
#                     start_time=start_time,
#                     end_time=end_time,
#                     mode="offline",
#                     is_available=True
#                 )
#             slots_created = True

#         # =========================
#         # 🔹 Fetch slots
#         # =========================
#         slots = Slot.objects.filter(
#             counsellor_id=counsellor_user_id,
#             date=date,
#             is_deleted=False   # ✅ hide deleted slots
#         ).order_by("start_time")


#         # =========================
#         # 🔹 Booking status map
#         # =========================
#         # booking_status_map = {
#         #     b["slot_id"]: b["status"]
#         #     for b in Booking.objects
#         #     .filter(slot__in=slots)
#         #     .exclude(status="cancelled")
#         #     .values("slot_id", "status")
#         # }
#         bookings = (
#             Booking.objects
#             .filter(
#                 slot__date=date,
#                 bookingcounsellor__counsellor=counsellor_obj
#             )
#             .exclude(status="cancelled")
#         )

#         booking_status_map = {
#             (booking.slot.start_time, booking.slot.end_time): booking.status
#             for booking in bookings
#         }

#         # =========================
#         # 🔹 Response slots
#         # =========================
#         response_slots = [
#             {
#                 "id": slot.id,
#                 "date": slot.date,
#                 "start_time": slot.start_time,
#                 "end_time": slot.end_time,
#                 "mode": slot.mode,
#                 "is_available": slot.is_available,
#                 # "status": booking_status_map.get(slot.id, "available")
#                 "status": booking_status_map.get(
#                     (slot.start_time, slot.end_time),
#                     "available"
#                 )
#             }
#             for slot in slots
#         ]

#         return Response(
#             {
#                 "message": (
#                     "Slots generated and fetched successfully"
#                     if slots_created
#                     else "Slots already exist, fetched successfully"
#                 ),
#                 "date": date,

#                 # 🔹 BOTH IDs (clean API)
#                 "counsellor_id": counsellor_table_id,
#                 "counsellor_user_id": counsellor_user_id,

#                 "counsellor_first_name": counsellor_obj.user.first_name,
#                 "counsellor_last_name": counsellor_obj.user.last_name,
#                 "counsellor_is_active": counsellor_is_active,

#                 "data": response_slots
#             },
#             status=status.HTTP_200_OK
#         )



#     # @transaction.atomic
#     # def post(self, request, date, counsellor):
#     #     """
#     #     counsellor → COUNSELLOR TABLE ID from URL
#     #     """

#     #     manual_slots = request.data.get("slots", [])

#     #     # =========================
#     #     # 🔹 Fetch Counsellor
#     #     # =========================
#     #     # counsellor_obj = Counsellor.objects.select_related("user").filter(
#     #     #     id=counsellor
#     #     # ).first()
#     #     # if not counsellor_obj:
#     #     #     return Response(
#     #     #         {"message": "Counsellor not found"},
#     #     #         status=status.HTTP_404_NOT_FOUND
#     #     #     )

#     #     # # ✅ Correct IDs
#     #     # counsellor_table_id = counsellor_obj.id
#     #     # counsellor_user_id = counsellor_obj.user_id
        
#     #     # =========================
#     #     # 🔹 Fetch Counsellors
#     #     # =========================
#     #     # counsellor_ids = request.data.get("counsellors", [counsellor])
#     #     counsellor_ids = request.data.get("counsellor_id", [counsellor])

#     #     counsellors = Counsellor.objects.select_related("user").filter(
#     #         id__in=counsellor_ids
#     #     )

#     #     if not counsellors.exists():
#     #         return Response(
#     #             {"message": "Counsellor not found"},
#     #             status=status.HTTP_404_NOT_FOUND
#     #         )

        

#     #     # =========================
#     #     # 🔹 FIXED SLOTS SET
#     #     # =========================
#     #     fixed_slot_set = set(FIXED_SLOTS)

#     #     # =========================
#     #     # 🔹 1. CREATE FIXED SLOTS (ONLY IF NO SLOT EXISTS FOR DATE)
#     #     # =========================

#     #     # existing_slots = Slot.objects.filter(
#     #     #     counsellor_id=counsellor_user_id,
#     #     #     date=date
#     #     # )

#     #     # fixed_created = False

#     #     # if not existing_slots.exists():
#     #     #     fixed_created = True

#     #     #     fixed_slot_objects = [
#     #     #         Slot(
#     #     #             counsellor_id=counsellor_user_id,
#     #     #             date=date,
#     #     #             start_time=start_time,
#     #     #             end_time=end_time,
#     #     #             is_available=True
#     #     #         )
#     #     #         for start_time, end_time in FIXED_SLOTS
#     #     #     ]

#     #     #     Slot.objects.bulk_create(fixed_slot_objects)
        
#     #     created_manual_slots = []
#     #     fixed_created = False

#     #     for counsellor_obj in counsellors:

#     #         counsellor_table_id = counsellor_obj.id
#     #         counsellor_user_id = counsellor_obj.user_id

#     #         existing_slots = Slot.objects.filter(
#     #             counsellor_id=counsellor_user_id,
#     #             date=date
#     #         )

#     #         if not existing_slots.exists():
#     #             fixed_created = True

#     #             fixed_slot_objects = [
#     #                 Slot(
#     #                     counsellor_id=counsellor_user_id,
#     #                     date=date,
#     #                     start_time=start_time,
#     #                     end_time=end_time,
#     #                     is_available=True
#     #                 )
#     #                 for start_time, end_time in FIXED_SLOTS
#     #             ]

#     #             Slot.objects.bulk_create(fixed_slot_objects)

#     #         for slot in manual_slots:

#     #             start_time = slot.get("start_time")
#     #             end_time = slot.get("end_time")

#     #             if not start_time or not end_time:
#     #                 continue

#     #             if (start_time, end_time) in fixed_slot_set:
#     #                 continue

#     #             obj, created = Slot.objects.get_or_create(
#     #                 counsellor_id=counsellor_user_id,
#     #                 date=date,
#     #                 start_time=start_time,
#     #                 end_time=end_time,
#     #                 defaults={
#     #                     "is_available": True
#     #                 }
#     #             )

#     #             if created:
#     #                 created_manual_slots.append(obj)


#     #     # =========================
#     #     # 🔹 2. CREATE MANUAL SLOTS
#     #     # =========================
#     #     created_manual_slots = []

#     #     for slot in manual_slots:
#     #         start_time = slot.get("start_time")
#     #         end_time = slot.get("end_time")

#     #         if not start_time or not end_time:
#     #             continue

#     #         # 🚫 Skip FIXED slots
#     #         if (start_time, end_time) in fixed_slot_set:
#     #             continue

#     #         obj, created = Slot.objects.get_or_create(
#     #             counsellor_id=counsellor_user_id,   # ✅ USER ID
#     #             date=date,
#     #             start_time=start_time,
#     #             end_time=end_time,
#     #             defaults={
#     #                 "is_available": True
#     #             }
#     #         )

#     #         if created:
#     #             created_manual_slots.append(obj)

#     #     # =========================
#     #     # 🔹 3. FETCH ALL SLOTS
#     #     # =========================
#     #     # slots = Slot.objects.filter(
#     #     #     counsellor_id=counsellor_user_id,   # ✅ USER ID
#     #     #     date=date
#     #     # ).order_by("start_time")
#     #     slots = Slot.objects.filter(
#     #         counsellor_id__in=[c.user_id for c in counsellors],
#     #         date=date
#     #     ).order_by("start_time")
        
#     #     # =========================
#     #     # 🔔 SEND NOTIFICATION TO SUPERADMIN (ASYNC)
#     #     # =========================

#     #     from django.db.transaction import on_commit
#     #     from django.contrib.auth import get_user_model
#     #     from counselling_slot.tasks import create_system_notification

#     #     User = get_user_model()

#     #     # Counsellor name
#     #     counsellor_name = f"{counsellor_obj.user.first_name} {counsellor_obj.user.last_name}"

#     #     title = "New Slots Created"

#     #     message = (
#     #         f"Counsellor {counsellor_name} has created slots for date {date}. "
#     #         f"Total slots: {slots.count()}."
#     #     )

#     #     # Get superadmins (or staff)
#     #     admin_users = User.objects.filter(is_superuser=True)  # or is_staff=True

#     #     for admin in admin_users:
#     #         admin_id = admin.id  # ✅ fix lambda issue

#     #         on_commit(lambda admin_id=admin_id: create_system_notification.delay(
#     #             admin_id,
#     #             title,
#     #             message
#     #         ))

#     #     return Response(
#     #         {
#     #             "message": "Slots processed successfully",
#     #             "date": date,

#     #             # 🔹 Return BOTH IDs (clean API)
#     #             "counsellor_id": counsellor_table_id,
#     #             "counsellor_user_id": counsellor_user_id,

#     #             "fixed_slots_created": fixed_created,
#     #             "new_manual_slots_created": len(created_manual_slots),
#     #             "total_slots": slots.count(),
#     #             "data": SlotCreateSerializer(slots, many=True).data
#     #         },
#     #         status=status.HTTP_201_CREATED
#     #     )
#     @transaction.atomic
#     def post(self, request, date, counsellor):
#         """
#         counsellor → COUNSELLOR TABLE ID from URL
#         """

#         manual_slots = request.data.get("slots", [])

#         # =========================
#         # 🔹 Fetch Counsellors
#         # =========================
#         counsellor_ids = request.data.get("counsellor_id", [counsellor])

#         # ✅ FIX: ensure iterable for id__in
#         if isinstance(counsellor_ids, int):
#             counsellor_ids = [counsellor_ids]

#         counsellors = Counsellor.objects.select_related("user").filter(
#             id__in=counsellor_ids
#         )

#         if not counsellors.exists():
#             return Response(
#                 {"message": "Counsellor not found"},
#                 status=status.HTTP_404_NOT_FOUND
#             )

#         # =========================
#         # 🔹 FIXED SLOTS SET
#         # =========================
#         fixed_slot_set = set(FIXED_SLOTS)

#         created_manual_slots = []
#         fixed_created = False

#         # =========================
#         # 🔹 CREATE FIXED + MANUAL SLOTS PER COUNSELLOR
#         # =========================
#         for counsellor_obj in counsellors:

#             counsellor_table_id = counsellor_obj.id
#             counsellor_user_id = counsellor_obj.user_id

#             existing_slots = Slot.objects.filter(
#                 counsellor_id=counsellor_user_id,
#                 date=date
#             )

#             if not existing_slots.exists():
#                 fixed_created = True

#                 fixed_slot_objects = [
#                     Slot(
#                         counsellor_id=counsellor_user_id,
#                         date=date,
#                         start_time=start_time,
#                         end_time=end_time,
#                         is_available=True
#                     )
#                     for start_time, end_time in FIXED_SLOTS
#                 ]

#                 Slot.objects.bulk_create(fixed_slot_objects)

#             for slot in manual_slots:

#                 start_time = slot.get("start_time")
#                 end_time = slot.get("end_time")

#                 if not start_time or not end_time:
#                     continue

#                 if (start_time, end_time) in fixed_slot_set:
#                     continue

#                 obj, created = Slot.objects.get_or_create(
#                     counsellor_id=counsellor_user_id,
#                     date=date,
#                     start_time=start_time,
#                     end_time=end_time,
#                     defaults={
#                         "is_available": True
#                     }
#                 )

#                 if created:
#                     created_manual_slots.append(obj)

#         # =========================
#         # 🔹 2. CREATE MANUAL SLOTS
#         # =========================
#         created_manual_slots = []

#         for slot in manual_slots:
#             start_time = slot.get("start_time")
#             end_time = slot.get("end_time")

#             if not start_time or not end_time:
#                 continue

#             # 🚫 Skip FIXED slots
#             if (start_time, end_time) in fixed_slot_set:
#                 continue

#             obj, created = Slot.objects.get_or_create(
#                 counsellor_id=counsellor_user_id,   # ✅ USER ID
#                 date=date,
#                 start_time=start_time,
#                 end_time=end_time,
#                 defaults={
#                     "is_available": True
#                 }
#             )

#             if created:
#                 created_manual_slots.append(obj)

#         # =========================
#         # 🔹 3. FETCH ALL SLOTS
#         # =========================
#         slots = Slot.objects.filter(
#             counsellor_id__in=[c.user_id for c in counsellors],
#             date=date
#         ).order_by("start_time")

#         # =========================
#         # 🔔 SEND NOTIFICATION TO SUPERADMIN (ASYNC)
#         # =========================

#         from django.db.transaction import on_commit
#         from django.contrib.auth import get_user_model
#         from counselling_slot.tasks import create_system_notification

#         User = get_user_model()

#         counsellor_name = f"{counsellor_obj.user.first_name} {counsellor_obj.user.last_name}"

#         title = "New Slots Created"

#         message = (
#             f"Counsellor {counsellor_name} has created slots for date {date}. "
#             f"Total slots: {slots.count()}."
#         )

#         admin_users = User.objects.filter(is_superuser=True)

#         # for admin in admin_users:
#         #     admin_id = admin.id

#         #     on_commit(
#         #         lambda admin_id=admin_id, title=title, message=message:
#         #         create_system_notification.delay(
#         #             admin_id,
#         #             title,
#         #             message
#         #         )
#         #     )
#         for admin in admin_users:
#             admin_id = admin.id

#             def send_notification(admin_id=admin_id):
#                 try:
#                     create_system_notification.delay(
#                         admin_id,
#                         title,
#                         message
#                     )
#                 except Exception as e:
#                     print("NOTIFICATION ERROR:", str(e))

#             on_commit(send_notification)

#         return Response(
#             {
#                 "message": "Slots processed successfully",
#                 "date": date,

#                 "counsellor_id": counsellor_table_id,
#                 "counsellor_user_id": counsellor_user_id,

#                 "fixed_slots_created": fixed_created,
#                 "new_manual_slots_created": len(created_manual_slots),
#                 "total_slots": slots.count(),
#                 "data": SlotCreateSerializer(slots, many=True).data
#             },
#             status=status.HTTP_201_CREATED
#         )  
 
class SlotCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def get(self, request, date, counsellor):
        """
        counsellor → COUNSELLOR TABLE ID from URL
        """

        # =========================
        # 🔹 Fetch Counsellor
        # =========================
        counsellor_obj = Counsellor.objects.select_related("user").filter(
            id=counsellor
        ).first()

        if not counsellor_obj:
            return Response(
                {"message": "Counsellor not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # ✅ CORRECT IDs
        counsellor_table_id = counsellor_obj.id
        counsellor_user_id = counsellor_obj.user_id
        counsellor_is_active = counsellor_obj.is_active

        # =========================
        # 🔹 Check existing slots
        # =========================
        existing_slots_qs = Slot.objects.filter(
        counsellor_id=counsellor_user_id,
        date=date,
        # is_deleted=False  
    )


        slots_created = False

        if not existing_slots_qs.exists():
            for start_time in FIXED_SLOTS:
                Slot.objects.create(
                    counsellor_id=counsellor_user_id,  # ✅ USER ID ONLY
                    date=date,
                    start_time=start_time,
                    mode="offline",
                    is_available=True
                )
            slots_created = True

        # =========================
        # 🔹 Fetch slots
        # =========================
        slots = Slot.objects.filter(
            counsellor_id=counsellor_user_id,
            date=date,
            is_deleted=False   # ✅ hide deleted slots
        ).order_by("start_time")


        # =========================
        # 🔹 Booking status map
        # =========================
        # booking_status_map = {
        #     b["slot_id"]: b["status"]
        #     for b in Booking.objects
        #     .filter(slot__in=slots)
        #     .exclude(status="cancelled")
        #     .values("slot_id", "status")
        # }
        bookings = (
            Booking.objects
            .filter(
                slot__date=date,
                bookingcounsellor__counsellor=counsellor_obj
            )
            .exclude(status="cancelled")
        )

        booking_status_map = {
            (booking.slot.start_time): booking.status
            for booking in bookings
        }

        # =========================
        # 🔹 Response slots
        # =========================
        response_slots = [
            {
                "id": slot.id,
                "date": slot.date,
                "start_time": slot.start_time,
                # "end_time": slot.end_time,
                "mode": slot.mode,
                "is_available": slot.is_available,
                # "status": booking_status_map.get(slot.id, "available")
                "status": booking_status_map.get(
                    (slot.start_time),
                    "available"
                )
            }
            for slot in slots
        ]

        return Response(
            {
                "message": (
                    "Slots generated and fetched successfully"
                    if slots_created
                    else "Slots already exist, fetched successfully"
                ),
                "date": date,

                # 🔹 BOTH IDs (clean API)
                "counsellor_id": counsellor_table_id,
                "counsellor_user_id": counsellor_user_id,

                "counsellor_first_name": counsellor_obj.user.first_name,
                "counsellor_last_name": counsellor_obj.user.last_name,
                "counsellor_is_active": counsellor_is_active,

                "data": response_slots
            },
            status=status.HTTP_200_OK
        )

    @transaction.atomic
    def post(self, request, date, counsellor):
        """
        counsellor → COUNSELLOR TABLE ID from URL
        """

        manual_slots = request.data.get("slots", [])

        # =========================
        # 🔹 Fetch Counsellors
        # =========================
        counsellor_ids = request.data.get("counsellor_id", [counsellor])

        # ✅ FIX: ensure iterable for id__in
        if isinstance(counsellor_ids, int):
            counsellor_ids = [counsellor_ids]

        counsellors = Counsellor.objects.select_related("user").filter(
            id__in=counsellor_ids
        )

        if not counsellors.exists():
            return Response(
                {"message": "Counsellor not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # =========================
        # 🔹 FIXED SLOTS SET
        # =========================
        fixed_slot_set = set(FIXED_SLOTS)

        created_manual_slots = []
        fixed_created = False

        # =========================
        # 🔹 CREATE FIXED + MANUAL SLOTS PER COUNSELLOR
        # =========================
        for counsellor_obj in counsellors:

            counsellor_table_id = counsellor_obj.id
            counsellor_user_id = counsellor_obj.user_id

            existing_slots = Slot.objects.filter(
                counsellor_id=counsellor_user_id,
                date=date
            )

            if not existing_slots.exists():
                fixed_created = True

                fixed_slot_objects = [
                    Slot(
                        counsellor_id=counsellor_user_id,
                        date=date,
                        start_time=start_time,
                        # end_time=end_time,
                        is_available=True
                    )
                    for start_time in FIXED_SLOTS
                ]

                Slot.objects.bulk_create(fixed_slot_objects)

            for slot in manual_slots:

                start_time = slot.get("start_time")
                # end_time = slot.get("end_time")

                if not start_time :
                    continue

                if (start_time) in fixed_slot_set:
                    continue

                obj, created = Slot.objects.get_or_create(
                    counsellor_id=counsellor_user_id,
                    date=date,
                    start_time=start_time,
                    # end_time=end_time,
                    defaults={
                        "is_available": True
                    }
                )

                if created:
                    created_manual_slots.append(obj)

        # =========================
        # 🔹 2. CREATE MANUAL SLOTS
        # =========================
        created_manual_slots = []

        for slot in manual_slots:
            start_time = slot.get("start_time")
            # end_time = slot.get("end_time")

            if not start_time :
                continue

            # 🚫 Skip FIXED slots
            if (start_time) in fixed_slot_set:
                continue

            obj, created = Slot.objects.get_or_create(
                counsellor_id=counsellor_user_id,   # ✅ USER ID
                date=date,
                start_time=start_time,
                # end_time=end_time,
                defaults={
                    "is_available": True
                }
            )

            if created:
                created_manual_slots.append(obj)

        # =========================
        # 🔹 3. FETCH ALL SLOTS
        # =========================
        slots = Slot.objects.filter(
            counsellor_id__in=[c.user_id for c in counsellors],
            date=date
        ).order_by("start_time")

        # =========================
        # 🔔 SEND NOTIFICATION TO SUPERADMIN (ASYNC)
        # =========================

        from django.db.transaction import on_commit
        from django.contrib.auth import get_user_model
        from counselling_slot.tasks import create_system_notification

        User = get_user_model()

        counsellor_name = f"{counsellor_obj.user.first_name} {counsellor_obj.user.last_name}"

        title = "New Slots Created"

        message = (
            f"Counsellor {counsellor_name} has created slots for date {date}. "
            f"Total slots: {slots.count()}."
        )

        admin_users = User.objects.filter(is_superuser=True)

        # for admin in admin_users:
        #     admin_id = admin.id

        #     on_commit(
        #         lambda admin_id=admin_id, title=title, message=message:
        #         create_system_notification.delay(
        #             admin_id,
        #             title,
        #             message
        #         )
        #     )
        for admin in admin_users:
            admin_id = admin.id

            def send_notification(admin_id=admin_id):
                try:
                    create_system_notification.delay(
                        admin_id,
                        title,
                        message
                    )
                except Exception as e:
                    print("NOTIFICATION ERROR:", str(e))

            on_commit(send_notification)

        return Response(
            {
                "message": "Slots processed successfully",
                "date": date,

                "counsellor_id": counsellor_table_id,
                "counsellor_user_id": counsellor_user_id,

                "fixed_slots_created": fixed_created,
                "new_manual_slots_created": len(created_manual_slots),
                "total_slots": slots.count(),
                "data": SlotCreateSerializer(slots, many=True).data
            },
            status=status.HTTP_201_CREATED
        )  
 
 
        
# Add debugging to verify your delete method is being called
class SlotDeleteAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def delete(self, request, slot_id):
        print(f"Soft delete called for slot {slot_id}")  # Debug line
        slot = get_object_or_404(Slot, id=slot_id)

        if Booking.objects.filter(slot=slot).exists():
            return Response(
                {"success": False, "message": "Slot cannot be deleted because it is already booked."},
                status=status.HTTP_400_BAD_REQUEST
            )

        slot.is_deleted = True
        slot.is_available = False
        slot.save(update_fields=["is_deleted", "is_available"])
        
        print(f"Slot {slot_id} soft deleted successfully")  # Debug line

        return Response(
            {"success": True, "message": "Slot deleted successfully."},
            status=status.HTTP_200_OK
        )   

        
class UpdateCounsellorStatusAPIView(APIView):
    """
    Update counsellor is_active status
    """

    @transaction.atomic
    def patch(self, request, counsellor):
        is_active = request.data.get("is_active")

        # 🔴 Validation
        if is_active is None:
            return Response(
                {"message": "is_active field is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not isinstance(is_active, bool):
            return Response(
                {"message": "is_active must be true or false"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 🔹 Fetch counsellor (via user_id)
        counsellor_obj = get_object_or_404(
            Counsellor,
            user_id=counsellor
        )

        # 🔹 Update
        counsellor_obj.is_active = is_active
        counsellor_obj.save(update_fields=["is_active"])

        return Response(
            {
                "message": "Counsellor status updated successfully",
                "counsellor_id": counsellor,
                "is_active": counsellor_obj.is_active
            },
            status=status.HTTP_200_OK
        )

# API to get counsellor wise slots (with counsellor active status)
# class DateWiseSlotListAPIView(APIView):

#     def get(self, request):
#         slots = (
#             Slot.objects
#             .select_related("counsellor")
#             .order_by("date", "counsellor_id", "start_time")
#         )

#         date_map = defaultdict(lambda: {
#             "date": None,
#             "counsellors": {}
#         })

#         counsellor_status_map = {
#             c.user_id: c.is_active
#             for c in Counsellor.objects.all()
#         }

#         for slot in slots:
#             date_key = slot.date
#             counsellor_id = slot.counsellor.id

#             date_data = date_map[date_key]
#             date_data["date"] = date_key

#             if counsellor_id not in date_data["counsellors"]:
#                 date_data["counsellors"][counsellor_id] = {
#                     "counsellor_id": counsellor_id,
#                     "counsellor_name": f"{slot.counsellor.first_name} {slot.counsellor.last_name}",
#                     "counsellor_is_active": counsellor_status_map.get(counsellor_id, False),
#                     "slots": []
#                 }

#             date_data["counsellors"][counsellor_id]["slots"].append({
#                 "id": slot.id,
#                 "start_time": slot.start_time,
#                 "end_time": slot.end_time,
#                 "mode": slot.mode,
#                 "is_available": slot.is_available
#             })

#         response_data = []
#         for date_info in date_map.values():
#             date_info["counsellors"] = list(date_info["counsellors"].values())
#             response_data.append(date_info)

#         return Response(
#             {
#                 "message": "Date-wise counsellor slots fetched successfully",
#                 "data": response_data
#             },
#             status=status.HTTP_200_OK
#         )
   
class DateWiseSlotListAPIView(APIView):

    def _build_response(self):

        # =========================
        # 🔹 Fetch ALL slots
        # Slot.counsellor → User
        # =========================
        slots = (
            Slot.objects
            .select_related("counsellor")
            .order_by("date", "counsellor_id", "start_time")
        )

        # =========================
        # 🔹 Counsellor map
        # key = USER ID → Counsellor object
        # =========================
        counsellor_map = {
            c.user_id: c
            for c in Counsellor.objects.select_related("user")
        }

        # =========================
        # 🔹 Booking status map
        # =========================
        booking_status_map = {
            b.slot_id: b.status
            for b in Booking.objects.filter(slot__in=slots)
        }

        # =========================
        # 🔹 Date-wise grouping
        # =========================
        date_map = defaultdict(lambda: {
            "date": None,
            "counsellors": {}
        })

        for slot in slots:
            user = slot.counsellor                  # User object
            user_id = user.id                       # USER TABLE ID
            counsellor_obj = counsellor_map.get(user_id)

            counsellor_id = counsellor_obj.id if counsellor_obj else None
            counsellor_is_active = counsellor_obj.is_active if counsellor_obj else False

            date_key = slot.date
            date_map[date_key]["date"] = date_key

            if user_id not in date_map[date_key]["counsellors"]:
                date_map[date_key]["counsellors"][user_id] = {
                    "counsellor_id": counsellor_id,          # ✅ Counsellor table ID
                    "counsellor_user_id": user_id,           # ✅ User table ID
                    "counsellor_name": f"{user.first_name} {user.last_name}",
                    "is_active": counsellor_is_active,
                    "slots": []
                }

            date_map[date_key]["counsellors"][user_id]["slots"].append({
                "slot_id": slot.id,
                "start_time": slot.start_time,
                # "end_time": slot.end_time,
                "mode": slot.mode,
                "is_available": slot.is_available,
                "status": booking_status_map.get(slot.id, "available")
            })

        # =========================
        # 🔹 Convert dict → list
        # =========================
        response_data = []
        for date_info in date_map.values():
            date_info["counsellors"] = list(
                date_info["counsellors"].values()
            )
            response_data.append(date_info)

        return response_data

    def get(self, request):
        return Response(
            {
                "message": "Date-wise counsellor slots fetched successfully",
                "data": self._build_response()
            },
            status=status.HTTP_200_OK
        )

    @transaction.atomic
    def put(self, request):
        """
        counsellor_id → COUNSELLOR TABLE ID
        """

        counsellor_id = request.data.get("counsellor_id")
        date = request.data.get("date")
        is_active = request.data.get("is_active")

        if counsellor_id is None or not date or is_active is None:
            return Response(
                {"message": "counsellor_id, date and is_active are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # =========================
        # 🔹 Fetch Counsellor (TABLE ID)
        # =========================
        counsellor_obj = Counsellor.objects.select_related("user").filter(
            id=counsellor_id
        ).first()

        if not counsellor_obj:
            return Response(
                {"message": "Counsellor not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # ✅ Correct IDs
        counsellor_table_id = counsellor_obj.id
        counsellor_user_id = counsellor_obj.user_id

        # =========================
        # 🔹 1. Update counsellor (GLOBAL)
        # =========================
        counsellor_obj.is_active = is_active
        counsellor_obj.save()

        # =========================
        # 🔹 2. Update slots (DATE-WISE)
        # =========================
        updated_slots = Slot.objects.filter(
            counsellor_id=counsellor_user_id,   # ✅ USER ID
            date=date
        ).update(is_available=is_active)

        return Response(
            {
                "message": "Counsellor status and date-wise slots updated successfully",

                # 🔹 Return both IDs for clarity
                "counsellor_id": counsellor_table_id,
                "counsellor_user_id": counsellor_user_id,

                "is_active": counsellor_obj.is_active,
                "date": date,
                "updated_slots": updated_slots
            },
            status=status.HTTP_200_OK
        )

def safe_notify(admin_id, title, message):
    try:
        create_system_notification.delay(admin_id, title, message)
    except Exception as e:
        print("❌ Celery failed, fallback:", str(e))
        try:
            create_system_notification(admin_id, title, message)
        except Exception as inner_e:
            print("❌ Sync notify failed:", str(inner_e))
       
class BookingCreateAPIView(APIView):
    # permission_classes = [IsAdmin | IsSuperAdmin | IsCounsellor]
    permission_classes = [IsAuthenticated]
    
    
    def post(self, request):
        serializer = BookingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        student = serializer.validated_data["student_id"]
        program = serializer.validated_data["program"]
        package = serializer.validated_data["package"]
        date = serializer.validated_data["date"]
        slots = serializer.validated_data["slots"]
        counsellors = serializer.validated_data["counsellors_data"]

        created_bookings = []
        booking_ids = []

        with transaction.atomic():

            for slot in slots:
# =========================================================================================================
                # Lock slot row
                locked_slot = Slot.objects.select_for_update().get(id=slot.id)

                # Check whether slot already booked/rescheduled
                already_booked = Booking.objects.filter(
                    slot=locked_slot,
                    status__in=["booked", "rescheduled"]
                ).exists()

                if already_booked:
                    return Response(
                        {
                            "message": f"Slot {locked_slot.date} {locked_slot.start_time} is already booked."
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
# ================================================================================================================================
                for item in counsellors:

                    booking = Booking.objects.create(
                        student=student,
                        program=program,
                        package=package,
                        slot=slot,
                        date=date,
                        status="booked"
                    )
                    booking_ids.append(booking.id)

                    BookingCounsellor.objects.create(
                        booking=booking,
                        counsellor=item["counsellor_id"],
                        role=item["role"]
                    )

                    created_bookings.append({
                        "booking_id": booking.id,
                        "counsellor_id": item["counsellor_id"].id,
                        "status": booking.status,
                        "slot": {
                            "id": slot.id,
                            "date": slot.date,
                            "start_time": slot.start_time,
                            "end_time": slot.end_time,
                            "mode": slot.mode,
                        }
                    })

            # send email once
            # send_booking_created_email(student.user, slots, date)
            # send_booking_created_email(
            #     user=student.user,
            #     booking=booking,
            #     booking_slots=slots,
            #     booking_date=date
            # )
            booking_ids_copy = booking_ids.copy()

            def send_email():
                try:
                    send_booking_created_email_task.delay(booking_ids_copy)
                    print("✅ Booking created email task queued successfully")
                except Exception as e:
                    print(f"❌ Error while queueing booking created email task: {str(e)}")

            transaction.on_commit(send_email)

            student_name = f"{student.user.first_name} {student.user.last_name}"

            title = "New Booking Created"

            message = (
                f"Student {student_name} has created a counselling slot on {date}."
            )

            admin_users = User.objects.filter(is_staff=True)

            for admin in admin_users:
                on_commit(lambda admin_id=admin.id: create_system_notification.delay(
                    admin_id,
                    title,
                    message
                ))

        return Response(
            {
                "message": "Booking created successfully",
                "data": created_bookings
            },
            status=status.HTTP_201_CREATED
        ) 
    # def post(self, request):
    #     serializer = BookingCreateSerializer(data=request.data)
    #     serializer.is_valid(raise_exception=True)

    #     student = serializer.validated_data["student_id"]
    #     date = serializer.validated_data["date"]
    #     slots = serializer.validated_data["slots"]
    #     counsellors = serializer.validated_data["counsellors_data"]

    #     created_bookings = []
        
    #     fixed_lead_counsellor = Counsellor.objects.get(
    #         user__first_name="Reena",
    #         user__last_name="Bhutada"
    #     )

    #     with transaction.atomic():

    #         for slot in slots:
    #             for item in counsellors:

    #                 booking = Booking.objects.create(
    #                     student=student,
    #                     slot=slot,
    #                     date=date,
    #                     status="booked"
    #                 )

    #                 if item["role"].strip().lower() == "lead":
    #                     assigned_counsellor = fixed_lead_counsellor
    #                 else:
    #                     assigned_counsellor = item["counsellor_id"]

    #                 BookingCounsellor.objects.create(
    #                     booking=booking,
    #                     counsellor=assigned_counsellor,
    #                     role=item["role"]
    #                 )

    #                 created_bookings.append({
    #                     "booking_id": booking.id,
    #                     # "counsellor_id": item["counsellor_id"].id,
    #                     "counsellor_id": assigned_counsellor.id,
    #                     "counsellor_name": f"{assigned_counsellor.user.first_name} {assigned_counsellor.user.last_name}",
    #                     "status": booking.status,
    #                     "slot": {
    #                         "id": slot.id,
    #                         "date": slot.date,
    #                         "start_time": slot.start_time,
    #                         # "end_time": slot.end_time,
    #                         "mode": slot.mode,
    #                     }
    #                 })

    #         # =========================
    #         # 📧 EMAIL
    #         # =========================
    #         try:
    #             send_booking_created_email(student.user, slots, date)
    #         except Exception as e:
    #             print("❌ Email error:", str(e))

    #         # =========================
    #         # 🔔 NOTIFICATION (FIXED)
    #         # =========================
    #         student_name = f"{student.user.first_name} {student.user.last_name}"

    #         title = "New Booking Created"
    #         message = f"Student {student_name} has created a counselling slot on {date}."

    #         admin_users = User.objects.filter(is_staff=True)

    #         for admin in admin_users:
    #             admin_id = admin.id  # ✅ FIXED (capture here)

    #             print(f"DEBUG: Sending booking notification to {admin_id}")

    #             on_commit(lambda admin_id=admin_id: safe_notify(
    #                 admin_id,
    #                 title,
    #                 message
    #             ))

    #     return Response(
    #         {
    #             "message": "Booking created successfully",
    #             "data": created_bookings
    #         },
    #         status=status.HTTP_201_CREATED
    #     )
        
    
    def put(self, request, booking_id):

        serializer = BookingCreateSerializer(
            data=request.data,
            context={"booking_id": booking_id}
        )
        serializer.is_valid(raise_exception=True)

        student = serializer.validated_data["student_id"]
        date = serializer.validated_data["date"]
        slots = serializer.validated_data["slots"]
        counsellors = serializer.validated_data["counsellors_data"]
        
        # =============================
        # CHECK COUNSELLOR SLOT CONFLICT
        # =============================
        for slot in slots:
            for item in counsellors:

                counsellor = item["counsellor_id"]

                conflict_booking = Booking.objects.filter(
                    slot__date=date,
                    slot__start_time=slot.start_time,
                    # slot__end_time=slot.end_time,
                    bookingcounsellor__counsellor=counsellor
                ).exclude(
                    status="cancelled"
                ).exclude(
                    id=booking_id   # ignore current booking
                ).select_related("slot").first()

                if conflict_booking:
                    counsellor_name = f"{counsellor.user.first_name} {counsellor.user.last_name}"

                    return Response(
                        {
                            "message": f"{counsellor_name} slot is already booked in another counselling session for this date."
                            "Choose another slot or continue with only one counsellor."
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

        try:
            base_booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response(
                {"message": "Booking not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        created_bookings = []
        updated_booking_ids = []

        with transaction.atomic():

            # =============================
            # NOT_BOOKED → BOOKED
            # =============================
            if base_booking.status == "not_booked":

                slot = slots[0]

                base_booking.student = student
                base_booking.slot = slot
                base_booking.date = date
                base_booking.status = "booked"
                base_booking.save()

                # assign counsellors
                for item in counsellors:
                    BookingCounsellor.objects.create(
                        booking=base_booking,
                        counsellor=item["counsellor_id"],
                        role=item["role"]
                    )
                    

                created_bookings.append({
                    "booking_id": base_booking.id,
                    "status": base_booking.status,
                    "slot": {
                        "id": slot.id,
                        "date": slot.date,
                        "start_time": slot.start_time,
                        # "end_time": slot.end_time,
                        "mode": slot.mode,
                    }
                })
                updated_booking_ids.append(base_booking.id)

                # send_booking_updated_email(
                #     student.user,
                #     slots,
                #     date
                # )
                # send_booking_updated_email(
                #     user=student.user,
                #     booking_slots=slots,
                #     booking_date=date
                # )
                

                updated_booking_ids_copy = updated_booking_ids.copy()

                def send_update_email():
                    try:
                        send_booking_updated_email_task.delay(updated_booking_ids_copy)
                        print("✅ Booking update email task queued successfully")
                    except Exception as e:
                        print("❌ Error while sending booking update email:", str(e))

                transaction.on_commit(send_update_email)

                return Response(
                    {
                        "message": "Booking created successfully",
                        "data": created_bookings
                    },
                    status=status.HTTP_200_OK
                )

            # =============================
            # RESCHEDULE LOGIC
            # =============================
            new_slot = slots[0]

            is_slot_changed = (
                base_booking.date != date
                or base_booking.slot_id != new_slot.id
            )
            
            for slot in slots:

                existing_counsellors = list(
                    BookingCounsellor.objects.filter(
                        booking=base_booking
                    )
                )

            # =====================================
            # PENDING → UPDATE SAME BOOKING
            # =====================================
            if base_booking.status == "pending":

                base_booking.student = student
                base_booking.slot = slot
                base_booking.date = date
                base_booking.status = "booked"
                base_booking.save()

                BookingCounsellor.objects.filter(
                    booking=base_booking
                ).delete()

                for item in counsellors:
                    BookingCounsellor.objects.create(
                        booking=base_booking,
                        counsellor=item["counsellor_id"],
                        role=item["role"]
                    )

                created_bookings.append({
                    "booking_id": base_booking.id,
                    "status": base_booking.status,
                    "slot": {
                        "id": slot.id,
                        "date": slot.date,
                        "start_time": slot.start_time,
                        "mode": slot.mode,
                    }
                })
                updated_booking_ids.append(base_booking.id)

            # =====================================
            # BOOKED/COMPLETED → CANCEL + NEW ENTRY
            # =====================================
            elif is_slot_changed:

                # old booking cancelled
                base_booking.status = "cancelled"
                base_booking.save(update_fields=["status"])
# =========================================================================================================
                locked_slot = Slot.objects.select_for_update().get(id=slot.id)

                already_booked = Booking.objects.filter(
                    slot=locked_slot,
                    status__in=["booked", "rescheduled"]
                ).exclude(
                    id=booking_id
                ).exists()

                if already_booked:
                    return Response(
                        {
                            "message": "This slot is already booked by another student."
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
# ==========================================================================================================
                # new rescheduled booking
                new_booking = Booking.objects.create(
                    student=student,
                    program=base_booking.program,
                    package=base_booking.package,
                    slot=slot,
                    date=date,
                    status="rescheduled"
                )

                for item in counsellors:
                    BookingCounsellor.objects.create(
                        booking=new_booking,
                        counsellor=item["counsellor_id"],
                        role=item["role"]
                    )

                created_bookings.append({
                    "booking_id": new_booking.id,
                    "status": new_booking.status,
                    "slot": {
                        "id": slot.id,
                        "date": slot.date,
                        "start_time": slot.start_time,
                        "mode": slot.mode,
                    }
                })
                updated_booking_ids.append(new_booking.id)
                
            else:
                # Only counsellor changed → keep same booking

                base_booking.student = student
                base_booking.save()

                BookingCounsellor.objects.filter(
                    booking=base_booking
                ).delete()

                for item in counsellors:
                    BookingCounsellor.objects.create(
                        booking=base_booking,
                        counsellor=item["counsellor_id"],
                        role=item["role"]
                    )

                created_bookings.append({
                    "booking_id": base_booking.id,
                    "status": base_booking.status,
                    "slot": {
                        "id": base_booking.slot.id,
                        "date": base_booking.slot.date,
                        "start_time": base_booking.slot.start_time,
                        "mode": base_booking.slot.mode,
                    }
                })

            updated_booking_ids_copy = updated_booking_ids.copy()

            def send_update_email():
                try:
                    send_booking_updated_email_task.delay(updated_booking_ids_copy)
                except Exception as e:
                    print("Queue Error:", str(e))

            transaction.on_commit(send_update_email)

        return Response(
            {
                "message": "Booking updated successfully",
                "data": created_bookings
            },
            status=status.HTTP_200_OK
        )  
    
    # def put(self, request, booking_id):

    #     serializer = BookingCreateSerializer(
    #         data=request.data,
    #         context={"booking_id": booking_id}
    #     )
    #     serializer.is_valid(raise_exception=True)

    #     student = serializer.validated_data["student_id"]
    #     date = serializer.validated_data["date"]
    #     slots = serializer.validated_data["slots"]
    #     counsellors = serializer.validated_data["counsellors_data"]
        
    #     # =============================
    #     # CHECK COUNSELLOR SLOT CONFLICT
    #     # =============================
    #     for slot in slots:
    #         for item in counsellors:

    #             if item["role"].strip().lower() == "lead":
    #                 counsellor = fixed_lead_counsellor
    #             else:
    #                 counsellor = item["counsellor_id"]

    #             conflict_booking = Booking.objects.filter(
    #                 slot__date=date,
    #                 slot__start_time=slot.start_time,
    #                 # slot__end_time=slot.end_time,
    #                 bookingcounsellor__counsellor=counsellor
    #             ).exclude(
    #                 status="cancelled"
    #             ).exclude(
    #                 id=booking_id   # ignore current booking
    #             ).select_related("slot").first()

    #             if conflict_booking:
    #                 counsellor_name = f"{counsellor.user.first_name} {counsellor.user.last_name}"

    #                 return Response(
    #                     {
    #                         "message": f"{counsellor_name} slot is already booked in another counselling session for this date."
    #                         "Choose another slot or continue with only one counsellor."
    #                     },
    #                     status=status.HTTP_400_BAD_REQUEST
    #                 )

    #     try:
    #         base_booking = Booking.objects.get(id=booking_id)
    #     except Booking.DoesNotExist:
    #         return Response(
    #             {"message": "Booking not found"},
    #             status=status.HTTP_404_NOT_FOUND
    #         )

    #     created_bookings = []
        
    #     fixed_lead_counsellor = Counsellor.objects.get(
    #         user__first_name="Reena",
    #         user__last_name="Bhutada"
    #     )

    #     with transaction.atomic():

    #         # =============================
    #         # NOT_BOOKED → BOOKED
    #         # =============================
    #         if base_booking.status == "not_booked":

    #             slot = slots[0]

    #             base_booking.student = student
    #             base_booking.slot = slot
    #             base_booking.date = date
    #             base_booking.status = "booked"
    #             base_booking.save()

    #             # assign counsellors
    #             for item in counsellors:
    #                 if item["role"].strip().lower() == "lead":
    #                     assigned_counsellor = fixed_lead_counsellor
    #                 else:
    #                     assigned_counsellor = item["counsellor_id"]

    #                 BookingCounsellor.objects.create(
    #                     booking=base_booking,
    #                     counsellor=assigned_counsellor,
    #                     role=item["role"]
    #                 )

    #             created_bookings.append({
    #                 "booking_id": base_booking.id,
    #                 "status": base_booking.status,
    #                 "slot": {
    #                     "id": slot.id,
    #                     "date": slot.date,
    #                     "start_time": slot.start_time,
    #                     # "end_time": slot.end_time,
    #                     "mode": slot.mode,
    #                 }
    #             })

    #             send_booking_updated_email(
    #                 student.user,
    #                 slots,
    #                 date
    #             )

    #             return Response(
    #                 {
    #                     "message": "Booking created successfully",
    #                     "data": created_bookings
    #                 },
    #                 status=status.HTTP_200_OK
    #             )

    #         # =============================
    #         # RESCHEDULE LOGIC
    #         # booked / rescheduled / completed
    #         # =============================
    #         for slot in slots:

    #             # get existing counsellors
    #             # existing_counsellors = list(
    #             #     BookingCounsellor.objects.filter(booking=base_booking)
    #             # )

    #             # # ✅ ADD THIS CONDITION
    #             # if base_booking.status != "pending":
    #             #     # create cancelled history
    #             #     cancelled_booking = Booking.objects.create(
    #             #         student=base_booking.student,
    #             #         slot=base_booking.slot,
    #             #         date=base_booking.date,
    #             #         status="cancelled"
    #             #     )

    #             #     # copy counsellors to cancelled booking
    #             #     for c in existing_counsellors:
    #             #         BookingCounsellor.objects.create(
    #             #             booking=cancelled_booking,
    #             #             counsellor=c.counsellor,
    #             #             role=c.role
    #             #         )

    #             # # update existing booking
    #             # base_booking.student = student
    #             # base_booking.slot = slot
    #             # base_booking.date = date

    #             # # ✅ keep status logic clean
    #             # if base_booking.status == "pending":
    #             #     base_booking.status = "booked"   # or "rescheduled" if your flow requires
    #             # else:
    #             #     base_booking.status = "rescheduled"

    #             # base_booking.save()
                
    #             # get existing counsellors
    #             existing_counsellors = list(
    #                 BookingCounsellor.objects.filter(booking=base_booking)
    #             )

    #             # =============================
    #             # STEP 1 → CREATE CANCELLED ENTRY FIRST
    #             # =============================
    #             if base_booking.status != "pending":

    #                 cancelled_booking = Booking.objects.create(
    #                     student=base_booking.student,
    #                     slot=base_booking.slot,
    #                     date=base_booking.date,
    #                     status="cancelled"
    #                 )

    #                 # copy old counsellors
    #                 for c in existing_counsellors:
    #                     BookingCounsellor.objects.create(
    #                         booking=cancelled_booking,
    #                         counsellor=c.counsellor,
    #                         role=c.role
    #                     )

    #             # =============================
    #             # STEP 2 → UPDATE CURRENT BOOKING
    #             # =============================
    #             base_booking.student = student
    #             base_booking.slot = slot
    #             base_booking.date = date

    #             if base_booking.status == "pending":
    #                 base_booking.status = "booked"
    #             else:
    #                 base_booking.status = "rescheduled"

    #             base_booking.save()

    #             # remove old counsellors
    #             BookingCounsellor.objects.filter(
    #                 booking=base_booking
    #             ).delete()

    #             # add counsellors
    #             for item in counsellors:
    #                 if item["role"].strip().lower() == "lead":
    #                     assigned_counsellor = fixed_lead_counsellor
    #                 else:
    #                     assigned_counsellor = item["counsellor_id"]

    #                 BookingCounsellor.objects.create(
    #                     booking=base_booking,
    #                     counsellor=assigned_counsellor,
    #                     role=item["role"]
    #                 )

    #             created_bookings.append({
    #                 "booking_id": base_booking.id,
    #                 "status": base_booking.status,
    #                 "slot": {
    #                     "id": slot.id,
    #                     "date": slot.date,
    #                     "start_time": slot.start_time,
    #                     # "end_time": slot.end_time,
    #                     "mode": slot.mode,
    #                 }
    #             })

    #         send_booking_updated_email(
    #             student.user,
    #             slots,
    #             date
    #         )

    #     return Response(
    #         {
    #             "message": "Booking updated successfully",
    #             "data": created_bookings
    #         },
    #         status=status.HTTP_200_OK
    #     )  
    
    
    
    # def get(self, request, booking_id=None):

    #     # =============================
    #     # AUTO UPDATE BOOKING STATUS
    #     # =============================

    #     ist = pytz.timezone("Asia/Kolkata")
    #     now = timezone.now().astimezone(ist)
    #     print("NOW:", now)

    #     bookings = Booking.objects.select_related("slot").filter(status__in=["booked", "rescheduled"])

    #     for booking in bookings:
    #         slot = booking.slot

    #         if not slot:
    #             continue

    #         slot_date = slot.date
    #         end_time = slot.end_time

    #         # handle time range like "12:30 PM - 02:30 PM"
    #         if isinstance(end_time, str):

    #             if "-" in end_time:
    #                 end_time = end_time.split("-")[1].strip()

    #             try:
    #                 end_time = datetime.strptime(end_time.strip(), "%I:%M %p").time()
    #             except ValueError:
    #                 try:
    #                     end_time = datetime.strptime(end_time.strip(), "%H:%M:%S").time()
    #                 except ValueError:
    #                     end_time = datetime.strptime(end_time.strip(), "%H:%M").time()

    #         end_datetime = datetime.combine(slot_date, end_time)

    #         # convert to IST
    #         end_datetime = ist.localize(end_datetime)

    #         print("END:", end_datetime)

    #         if now >= end_datetime:
    #             booking.status = "completed"
    #             booking.save(update_fields=["status"])
    #             print("UPDATED:", booking.id)

    #     # =============================
    #     # SINGLE BOOKING
    #     # =============================

    #     if booking_id:
    #         booking = get_object_or_404(
    #             Booking.objects.select_related("student", "slot")
    #             .prefetch_related("bookingcounsellor_set__counsellor__user"),
    #             id=booking_id
    #         )

    #         serializer = BookingReadSerializer(booking)

    #         return Response({
    #             "message": "Booking fetched successfully",
    #             "data": serializer.data
    #         })

    #     # =============================
    #     # ALL BOOKINGS
    #     # =============================

    #     bookings = Booking.objects.select_related("student", "slot") \
    #         .prefetch_related("bookingcounsellor_set__counsellor__user") \
    #         .order_by("-created_at")

    #     serializer = BookingReadSerializer(bookings, many=True)

    #     return Response({
    #         "message": "Bookings fetched successfully",
    #         "data": serializer.data
    #     }) 
    
    def get(self, request, booking_id=None):

        # =============================
        # AUTO UPDATE BOOKING STATUS
        # =============================

        ist = pytz.timezone("Asia/Kolkata")
        now = timezone.now().astimezone(ist)

        bookings = Booking.objects.select_related("slot").filter(
            status__in=["booked", "rescheduled"]
        )

        for booking in bookings:
            slot = booking.slot

            if not slot:
                continue

            slot_date = slot.date
            start_time = slot.start_time

            if isinstance(start_time, str):
                try:
                    start_time = datetime.strptime(start_time.strip(), "%I:%M %p").time()
                except ValueError:
                    try:
                        start_time = datetime.strptime(start_time.strip(), "%H:%M:%S").time()
                    except ValueError:
                        start_time = datetime.strptime(start_time.strip(), "%H:%M").time()

            start_datetime = datetime.combine(slot_date, start_time)
            start_datetime = ist.localize(start_datetime)

            auto_complete_time = start_datetime + timedelta(hours=1, minutes=30)

            if now >= auto_complete_time:
                booking.status = "completed"
                booking.save(update_fields=["status"])
                
                # latest_payment = (
                #     Payment.objects
                #     .filter(user=booking.student.user)
                #     .order_by("-created_at")
                #     .first()
                # )

                # if latest_payment:
                #     PaymentCreateAPIView().unlock_report_if_paid(
                #         latest_payment
                #     )
                
        # =============================
        # SINGLE BOOKING
        # =============================

        if booking_id:
            booking = get_object_or_404(
                Booking.objects.select_related("student", "slot", "program", "package")
                .prefetch_related(
                    "bookingcounsellor_set__counsellor__user"
                ),
                id=booking_id
            )

            serializer = BookingReadSerializer(booking)

            return Response(
                {
                    "message": "Booking fetched successfully",
                    "data": serializer.data
                },
                status=status.HTTP_200_OK
            )

        # =============================
        # ALL BOOKINGS
        # =============================

        bookings = Booking.objects.select_related(
            "student", "slot", "program", "package"
        ).prefetch_related(
            "bookingcounsellor_set__counsellor__user"
        ).order_by("-created_at")

        serializer = BookingReadSerializer(bookings, many=True)

        return Response(
            {
                "message": "Bookings fetched successfully",
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        ) 
        
    def delete(self, request, booking_id):

        try:
            booking = Booking.objects.select_related(
                "student", "slot"
            ).prefetch_related(
                "bookingcounsellor_set__counsellor__user"
            ).get(id=booking_id)

        except Booking.DoesNotExist:
            return Response(
                {"message": "Booking not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Collect before delete
        student_email = booking.student.user.email

        counsellor_emails = [
            bc.counsellor.user.email
            for bc in booking.bookingcounsellor_set.all()
        ]

        slot_details = {
            "date": str(booking.slot.date),
            "start_time": str(booking.slot.start_time),
            # "end_time": str(booking.slot.end_time),
            "mode": booking.slot.mode,
        }

        booking.delete()

        # Trigger celery after commit
        on_commit(lambda: send_booking_cancel_notification.delay(
            student_email,
            counsellor_emails,
            slot_details
        ))

        return Response(
            {"message": "Booking deleted successfully"},
            status=status.HTTP_200_OK
        )

# class CancelBookingAPIView(APIView):

#     def post(self, request, booking_id):

#         try:
#             booking = Booking.objects.get(id=booking_id)
#         except Booking.DoesNotExist:
#             return Response(
#                 {"message": "Booking not found"},
#                 status=status.HTTP_404_NOT_FOUND
#             )

#         with transaction.atomic():

#             # get counsellors
#             existing_counsellors = list(
#                 BookingCounsellor.objects.filter(booking=booking)
#             )

#             # create cancelled history entry
#             cancelled_booking = Booking.objects.create(
#                 student=booking.student,
#                 slot=booking.slot,
#                 date=booking.date,
#                 status="cancelled"
#             )

#             # copy counsellors to cancelled booking
#             for c in existing_counsellors:
#                 BookingCounsellor.objects.create(
#                     booking=cancelled_booking,
#                     counsellor=c.counsellor,
#                     role=c.role
#                 )

#             # update existing booking to pending
#             booking.status = "pending"
#             booking.save()

#         return Response(
#             {
#                 "message": "Booking cancelled successfully",
#                 "data": {
#                     "cancelled_booking_id": cancelled_booking.id,
#                     "updated_booking_id": booking.id,
#                     "updated_status": booking.status
#                 }
#             },
#             status=status.HTTP_200_OK
#         )

class CancelBookingAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, booking_id):

        try:
            with transaction.atomic():

                # =========================
                # 🔹 GET CURRENT BOOKING
                # =========================
                booking = Booking.objects.select_related(
                    "student",
                    "slot"
                ).get(id=booking_id)

                # =========================
                # 🔒 STATUS CHECK
                # =========================
                if booking.status not in ["booked", "confirmed", "rescheduled", "completed", "in_progress"]:
                    return Response(
                        {
                            "message": f"Cannot cancel booking with status '{booking.status}'"
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # =========================
                # 🔹 GET OLD COUNSELLORS
                # =========================
                old_counsellors = BookingCounsellor.objects.filter(booking=booking)

                # =========================
                # 🔹 CREATE CANCELLED BOOKING COPY
                # =========================
                cancelled_booking = Booking.objects.create(
                    student=booking.student,
                    program=booking.program,
                    package=booking.package,
                    slot=booking.slot,
                    date=booking.date,
                    status="cancelled"
                )

                # =========================
                # 🔹 COPY COUNSELLORS TO CANCELLED BOOKING
                # =========================
                for counsellor in old_counsellors:
                    BookingCounsellor.objects.create(
                        booking=cancelled_booking,
                        counsellor=counsellor.counsellor,
                        role=counsellor.role
                    )
                    
                # =========================
                # 🔹 DELETE COUNSELLING NOTES & FILES
                # =========================
                notes = CounsellingNote.objects.filter(booking=booking)

                for note in notes:
                    if note.file1:
                        note.file1.delete(save=False)
                    if note.file2:
                        note.file2.delete(save=False)
                    if note.file3:
                        note.file3.delete(save=False)
                    if note.file4:
                        note.file4.delete(save=False)
                    if note.file5:
                        note.file5.delete(save=False)

                notes.delete()

                # =========================
                # 🔹 FREE SLOT
                # =========================
                if booking.slot:
                    booking.slot.is_available = True
                    booking.slot.save(update_fields=["is_available"])

                # =========================
                # ❌ REMOVE COUNSELLORS FROM ORIGINAL BOOKING
                # =========================
                old_counsellors.delete()

                # =========================
                # 🔹 RESET ORIGINAL BOOKING TO PENDING
                # =========================
                booking.status = "pending"
                booking.date = None
                booking.slot = None
                booking.save(update_fields=["status", "date", "slot"])

                # =========================
                # 🔹 RESPONSE
                # =========================
                return Response(
                    {
                        "message": "Booking cancelled successfully, cancelled history created, and original moved to pending",
                        "data": {
                            "original_booking_id": booking.id,
                            "cancelled_booking_id": cancelled_booking.id,
                            "pending_status": booking.status
                        }
                    },
                    status=status.HTTP_200_OK
                )

        except Booking.DoesNotExist:
            return Response(
                {"message": "Booking not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception as e:
            return Response(
                {
                    "message": "Something went wrong",
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
            
class SessionDashboardCountAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        period = request.GET.get("period", "monthly")
        today = now().date()

        bookings = Booking.objects.all()

        # 🔹 Period filter using session date
        if period == "today":
            period_qs = bookings.filter(date=today)

        elif period == "weekly":
            start_date = today - timedelta(days=today.weekday())
            end_date = start_date + timedelta(days=6)

            period_qs = bookings.filter(
                date__range=[start_date, end_date]
            )

        elif period == "yearly":
            period_qs = bookings.filter(
                date__year=today.year
            )

        else:  # monthly
            period_qs = bookings.filter(
                date__year=today.year,
                date__month=today.month
            )

        # 🔹 Total sessions (exclude cancelled)
        total_sessions = period_qs.filter(
            status__in=["booked", "rescheduled", "pending", "completed"]
        ).count()

        # 🔹 Completed sessions
        completed_sessions = period_qs.filter(status="completed").count()

        # 🔹 Pending sessions
        pending_sessions = period_qs.filter(status="pending").count()

        # 🔹 Today's sessions
        today_qs = bookings.filter(date=today)

        today_completed = today_qs.filter(status="completed").count()

        today_upcoming = today_qs.filter(
            status__in=["booked", "rescheduled"]
        ).count()

        return Response({
            "period": period,

            "total_sessions": total_sessions,

            "today_sessions": {
                "total": today_completed + today_upcoming,
                "completed": today_completed,
                "upcoming": today_upcoming
            },

            "pending_sessions": pending_sessions,

            "completed_sessions": completed_sessions
        })       



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

class CounsellorSlotByDateAPIView(APIView):
    permission_classes = [IsAuthenticated]
    """
    Fetch slots for a given date.
    Also creates missing slots in Slot table for each counsellor.
    """

    def get(self, request, date):
        try:
            selected_date = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            return Response(
                {"message": "Invalid date format. Use YYYY-MM-DD"},
                status=status.HTTP_400_BAD_REQUEST
            )

        counsellors = Counsellor.objects.select_related("user").all()
        response_data = []

        for counsellor in counsellors:

            counsellor_user_id = counsellor.user_id

            # 🔹 Fetch all slots (fixed + manual)
            slots = Slot.objects.filter(
                counsellor_id=counsellor_user_id,
                date=selected_date,
                is_deleted=False
            ).order_by("start_time")

            # 🔹 If no slots exist → create fixed slots
            if not slots.exists():
                fixed_slot_objects = [
                    Slot(
                        counsellor_id=counsellor_user_id,
                        date=selected_date,
                        start_time=start_time,
                        is_available=True
                    )
                    for start_time in FIXED_SLOTS
                ]
                # Slot.objects.bulk_create(fixed_slot_objects)
                Slot.objects.bulk_create(
                    fixed_slot_objects,
                    ignore_conflicts=True
                )

                slots = Slot.objects.filter(
                    counsellor_id=counsellor_user_id,
                    date=selected_date,
                    is_deleted=False
                ).order_by("start_time")

            # 🔹 Booking status map
            # booking_status_map = {
            #     b["slot_id"]: b["status"]
            #     for b in Booking.objects.filter(
            #         slot__in=slots
            #     ).values("slot_id", "status")
            # }
            bookings = (
                Booking.objects
                .filter(
                    slot__date=selected_date,
                    bookingcounsellor__counsellor=counsellor
                )
                .exclude(status="cancelled")
            )

            # booking_status_map = {
            #     booking.slot_id: booking.status
            #     for booking in bookings
            # }
            booking_status_map = {
                (booking.slot.start_time): booking.status
                for booking in bookings
            }

            counsellor_slots = [
                {
                    "slot_id": slot.id,
                    "start_time": slot.start_time,
                    "mode": slot.mode,
                    "is_available": slot.is_available,
                    "status": booking_status_map.get(
                        slot.start_time,
                        "available"
                    )
                }
                for slot in slots
            ]

            response_data.append({
                "counsellor_id": counsellor.id,
                "counsellor_name": f"{counsellor.user.first_name} {counsellor.user.last_name}".strip(),
                "is_active": counsellor.is_active,
                "total_slots": len(counsellor_slots),
                "slots": counsellor_slots
            })

        return Response({
            "message": "All slots fetched successfully",
            "date": selected_date,
            "data": response_data
        })



class SlotAvailabilityUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def put(self, request, slot_id):

        slot = get_object_or_404(Slot, id=slot_id, is_deleted=False)

        is_available = request.data.get("is_available")

        # Validate input
        if is_available is None:
            return Response(
                {
                    "success": False,
                    "message": "is_available field is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not isinstance(is_available, bool):
            return Response(
                {
                    "success": False,
                    "message": "is_available must be true or false."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        slot.is_available = is_available
        slot.save(update_fields=["is_available"])

        return Response(
            {
                "success": True,
                "message": "Slot availability updated successfully.",
                "slot_id": slot.id,
                "is_available": slot.is_available
            },
            status=status.HTTP_200_OK
        )
        
        
# class BookingMarkCompletedAPIView(APIView):
#     permission_classes = [IsAuthenticated]

#     def put(self, request, booking_id):
#         booking = get_object_or_404(Booking, id=booking_id)

#         # Optional validation
#         if booking.status == "cancelled":
#             return Response(
#                 {"message": "Cancelled booking cannot be marked as completed."},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         if booking.status == "completed":
#             return Response(
#                 {"message": "Booking is already completed."},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # ✅ Update status
#         booking.status = "completed"
#         booking.save()

#         return Response(
#             {
#                 "message": "Booking marked as completed successfully",
#                 "booking_id": booking.id,
#                 "status": booking.status,
#                 "updated_at": booking.updated_at
#             },
#             status=status.HTTP_200_OK
#         )

class BookingMarkCompletedAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)

        if booking.status == "cancelled":
            return Response(
                {"message": "Cancelled booking cannot be marked as completed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if booking.status == "completed":
            return Response(
                {"message": "Booking is already completed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Only update booking status
        booking.status = "completed"
        booking.save(update_fields=["status"])
        
        # =====================================
        # ✅ Check latest payment
        # =====================================
        latest_payment = (
            Payment.objects
            .filter(user=booking.student.user)
            .order_by("-created_at")
            .first()
        )

        updated_count = 0

        # =====================================
        # ✅ Report Unlock Logic
        # =====================================
        if latest_payment:

            if latest_payment.status == "fully_paid":

                updated_count = Report.objects.filter(
                    user=booking.student.user,
                    report_status="received_locked"
                ).update(
                    report_status="received_unlocked"
                )

            else:
                # partial_paid / not_paid
                Report.objects.filter(
                    user=booking.student.user,
                    report_status="received_unlocked"
                ).update(
                    report_status="received_locked"
                )
        
        report = Report.objects.filter(
            user=booking.student.user
        ).first()

        return Response(
            {
                "message": "Booking marked as completed successfully",
                "booking_id": booking.id,
                "status": booking.status,
                "payment_status": (
                    latest_payment.status
                    if latest_payment else None
                ),
                "report_status": (
                    report.report_status
                    if report else None
                ),
                "updated_at": booking.updated_at
            },
            status=status.HTTP_200_OK
        )


# ================= Student Booking List API (with slot & counsellor details) ================

# class StudentBookingListAPIView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request, student_id):

#         # 🔹 Get student profile
#         student_profile = get_object_or_404(StudentProfile, id=student_id)

#         # 🔹 Fetch bookings
#         bookings = Booking.objects.filter(
#             student=student_profile
#         ).select_related(
#             "slot",
#             "slot__counsellor"
#         ).order_by("-created_at")

#         serializer = StudentBookingSerializer(bookings, many=True)

#         return Response({
#             "count": bookings.count(),
#             "data": serializer.data
#         })
      
      
class StudentBookingListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):

        student_profile = get_object_or_404(StudentProfile, id=student_id)

        bookings = list(
            Booking.objects.filter(
                student=student_profile
            ).select_related(
                "slot",
                "slot__counsellor"
            ).order_by("-created_at")
        )

        serializer = StudentBookingSerializer(bookings, many=True)

        return Response({
            "count": len(bookings),
            "data": serializer.data
        })

        
# ================== Counsellor Dashboard API ==================

# class CounsellorStudentBookingListAPIView(APIView):
#     permission_classes = [IsAuthenticated]
    
#     def auto_complete_bookings(self):
#         now = timezone.now()

#         bookings = Booking.objects.filter(
#             status="booked",
#             slot__isnull=False
#         ).select_related("slot")

#         for booking in bookings:

#             end_time = booking.slot.end_time

#             # convert string → time safely
#             if isinstance(end_time, str):
#                 try:
#                     end_time = datetime.strptime(end_time, "%I:%M %p").time()
#                 except ValueError:
#                     end_time = datetime.strptime(end_time, "%H:%M:%S").time()

#             # combine date + time
#             end_datetime = datetime.combine(booking.date, end_time)

#             # 🔥 IMPORTANT FIX: always convert using Django timezone utility safely
#             end_datetime = timezone.make_aware(end_datetime, timezone.get_current_timezone())

#             # 🔥 SAFE comparison (extra protection)
#             if timezone.is_naive(now):
#                 now = timezone.make_aware(now, timezone.get_current_timezone())

#             if now >= (end_datetime - timedelta(minutes=30)):
#                 booking.status = "completed"
#                 booking.save(update_fields=["status"])

#     def get(self, request):
        
#         # 🔥 AUTO UPDATE CALL HERE
#         self.auto_complete_bookings()
        
#         bookings = Booking.objects.filter(
#             bookingcounsellor__counsellor__user=request.user,
#             status__in=["booked", "completed", "rescheduled"]
#         ).select_related(
#             "student__user",
#             "slot"
#         ).prefetch_related(
#             "bookingcounsellor_set__counsellor__user"
#         ).distinct().order_by("-date")

#         serializer = CounsellorStudentBookingSerializer(
#             bookings,
#             many=True,
#             context={"request": request}
#         )
#         return Response(serializer.data)

class CounsellorStudentBookingListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def auto_complete_bookings(self):
        now = timezone.now()

        bookings = Booking.objects.filter(
            status="booked",
            slot__isnull=False
        ).select_related("slot")

        for booking in bookings:

            start_time = booking.slot.start_time

            # convert string → time safely
            if isinstance(start_time, str):
                try:
                    start_time = datetime.strptime(
                        start_time,
                        "%I:%M %p"
                    ).time()
                except ValueError:
                    try:
                        start_time = datetime.strptime(
                            start_time,
                            "%H:%M:%S"
                        ).time()
                    except ValueError:
                        start_time = datetime.strptime(
                            start_time,
                            "%H:%M"
                        ).time()

            start_datetime = datetime.combine(
                booking.date,
                start_time
            )

            # Convert only if naive
            if timezone.is_naive(start_datetime):
                start_datetime = timezone.make_aware(
                    start_datetime,
                    timezone.get_current_timezone()
                )

            # auto complete after 1.5 hours
            auto_complete_time = start_datetime + timedelta(
                hours=1,
                minutes=30
            )

            now = timezone.now()

            if timezone.is_naive(now):
                now = timezone.make_aware(
                    now,
                    timezone.get_current_timezone()
                )

            if now >= auto_complete_time:
                booking.status = "completed"
                booking.save(update_fields=["status"])

    

    def get(self, request):

        # ==========================================
        # 🔹 AUTO UPDATE
        # ==========================================
        self.auto_complete_bookings()

        bookings = Booking.objects.filter(
            bookingcounsellor__counsellor__user=request.user,
            status__in=["booked", "completed", "rescheduled"]
        ).select_related(
            "student__user",
            "slot",
            "program",
            "package"
        ).prefetch_related(
            "bookingcounsellor_set__counsellor__user"
        ).distinct().order_by("-date")

        # ==========================================
        # 🔹 SERIALIZER DATA
        # ==========================================
        serializer = CounsellorStudentBookingSerializer(
            bookings,
            many=True,
            context={"request": request}
        )

        response_data = serializer.data

        # ==========================================
        # 🔹 ADD FILE DETAILS WITHOUT CHANGING RESPONSE
        # ==========================================
        for item, booking in zip(response_data, bookings):

            report = (
                Report.objects
                .filter(user=booking.student.user)
                .order_by("-uploaded_at")
                .first()
            )

            # file_url = None
            # file_name = None

            # if report and report.file_path:
            #     try:
            #         # Actual uploaded filename
            #         file_name = os.path.basename(
            #             report.file_path.name
            #         )

            #         # File extension
            #         file_extension = os.path.splitext(
            #             file_name
            #         )[1].lower()

            #         # ==========================================
            #         # PDF → Preview
            #         # ==========================================
            #         if file_extension == ".pdf":
            #             file_url = request.build_absolute_uri(
            #                 f"/api/report/report/pdf/{report.id}/"
            #             )

            #         # ==========================================
            #         # Other files → Direct media
            #         # ==========================================
            #         else:
            #             file_url = request.build_absolute_uri(
            #                 report.file_path.url
            #             )

            #     except Exception:
            #         file_url = None
            #         file_name = None
            
            file_url = None
            file_name = None

            if report and report.file_path:
                try:
                    # ✅ Actual uploaded file name
                    file_name = os.path.basename(report.file_path.name)

                    # ✅ ALL FILE TYPES use same API
                    file_url = request.build_absolute_uri(
                        f"/api/report/report/pdf/{report.id}/"
                    )

                except Exception:
                    file_url = None
                    file_name = None

            # ==========================================
            # 🔹 APPEND TO EXISTING RESPONSE
            # ==========================================
            item["file_path"] = file_url
            item["file_name"] = file_name

        return Response(response_data)


class CounsellorCompletedStudentBookingListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        bookings = Booking.objects.filter(
            bookingcounsellor__counsellor__user=request.user,
            status="completed"
        ).select_related(
            "student__user",
            "slot",
            "program",
            "package"
        ).prefetch_related(
            "bookingcounsellor_set__counsellor__user"
        ).distinct().order_by("-date")

        serializer = CounsellorStudentBookingSerializer(
            bookings,
            many=True,
            context={"request": request}
        )

        return Response(serializer.data)
    
# class DashboardCounsellorCompletedStudentBookingListAPIView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         bookings = Booking.objects.filter(
#             bookingcounsellor__counsellor__user=request.user,
#             status__in=["completed", "booked"]
#         ).select_related(
#             "student__user",
#             "slot"
#         ).prefetch_related(
#             "bookingcounsellor_set__counsellor__user"
#         ).distinct().order_by("-date")

#         serializer = CounsellorStudentBookingSerializer(
#             bookings,
#             many=True,
#             context={"request": request}
#         )

#         return Response(serializer.data)
    
class AllCounsellorStudentBookingListAPIView(APIView):
    """
    Fetch all counselling session bookings for all counsellors
    where booking status is either 'booked' or 'completed'.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        bookings = (
            Booking.objects.filter(
                status__in=[ "completed"]
            )
            .select_related(
                "student__user",
                "slot"
            )
            .prefetch_related(
                "bookingcounsellor_set__counsellor__user"
            )
            .distinct()
            .order_by("-date")
        )

        serializer = CounsellorStudentBookingSerializer(
            bookings,
            many=True,
            context={"request": request}
        )

        return Response({
            "message": "All counsellor booking list fetched successfully",
            "total_bookings": bookings.count(),
            "data": serializer.data
        })

# views.py

class CounsellingNoteCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)

        notes = CounsellingNote.objects.filter(booking=booking)

        serializer = CounsellingNoteSerializer(
            notes,
            many=True,
            context={"request": request}
        )

        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)

        serializer = CounsellingNoteSerializer(
            data=request.data,
            context={
                "request": request,
                "booking": booking
            }
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)

        return Response(serializer.errors, status=400)
    
    def put(self, request, booking_id, note_id):

        booking = get_object_or_404(Booking, id=booking_id)
        note = get_object_or_404(CounsellingNote, id=note_id, booking=booking)

        serializer = CounsellingNoteSerializer(
            note,
            data=request.data,
            partial=True,
            context={"request": request, "booking": booking}
        )

        if serializer.is_valid():
            note = serializer.save()

            # Delete specific file
            delete_file = request.data.get("delete_file")

            if delete_file in ["file1", "file2", "file3", "file4", "file5"]:
                file_field = getattr(note, delete_file)

                if file_field:
                    file_field.delete(save=False)

                setattr(note, delete_file, None)
                note.save()

            return Response(
                CounsellingNoteSerializer(note, context={"request": request}).data
            )

        return Response(serializer.errors, status=400)
    
class StudentCounsellingNoteAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):

        student = get_object_or_404(StudentProfile, id=student_id)

        notes = (
            CounsellingNote.objects
            .filter(booking__student=student)
            .select_related("booking", "counsellor", "program", "package")
            .order_by("-created_at")
        )

        serializer = CounsellingNoteSerializer(
            notes,
            many=True,
            context={"request": request}
        )

        return Response(serializer.data, status=status.HTTP_200_OK)
    
@method_decorator(xframe_options_exempt, name="dispatch")
class CounsellingNoteFileView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, note_id, file_field):

        note = get_object_or_404(CounsellingNote, id=note_id)

        if file_field not in ["file1", "file2", "file3", "file4", "file5"]:
            return Response({"error": "Invalid file"}, status=404)

        file = getattr(note, file_field)

        if not file:
            return Response({"error": "File not found"}, status=404)

        response = FileResponse(file.open("rb"))
        response["Content-Disposition"] = "inline"
        return response
    
class CounsellingNoteFileDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, booking_id, note_id, file_field):

        booking = get_object_or_404(Booking, id=booking_id)
        note = get_object_or_404(CounsellingNote, id=note_id, booking=booking)

        valid_fields = ["file1", "file2", "file3", "file4", "file5"]

        if file_field not in valid_fields:
            return Response(
                {"error": "Invalid file field"},
                status=status.HTTP_400_BAD_REQUEST
            )

        file = getattr(note, file_field)

        if not file:
            return Response(
                {"error": "File not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # delete file from storage
        file.delete(save=False)

        # remove reference from DB
        setattr(note, file_field, None)
        note.save()

        return Response(
            {"message": f"{file_field} deleted successfully"},
            status=status.HTTP_200_OK
        )
    

class CounsellorDashboardCountAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        period = request.query_params.get("period", "monthly")

        user = request.user

        try:
            counsellor = Counsellor.objects.get(user=user)
        except Counsellor.DoesNotExist:
            return Response({"error": "Counsellor not found"}, status=404)

        today = timezone.now().date()

        # Base booking query (exclude cancelled)
        bookings = Booking.objects.filter(
            bookingcounsellor__counsellor=counsellor,
            status__in=["booked", "rescheduled", "completed"]
        ).distinct()

        # Date filtering
        if period == "weekly":
            start_date = today - timezone.timedelta(days=today.weekday())
            bookings = bookings.filter(date__gte=start_date)

        elif period == "monthly":
            bookings = bookings.filter(
                date__year=today.year,
                date__month=today.month
            )

        elif period == "yearly":
            bookings = bookings.filter(date__year=today.year)

        # Assigned students (unique)
        assigned_students = bookings.values("student").distinct().count()

        # Upcoming sessions
        upcoming_sessions = bookings.filter(
            date__gte=today,
            status__in=["booked", "rescheduled"]
        ).count()

        # Completed sessions
        completed_sessions = bookings.filter(
            status="completed"
        ).count()

        return Response({
            "assigned_students": assigned_students,
            "upcoming_sessions": upcoming_sessions,
            "completed_sessions": completed_sessions,
            "period": period
        }, status=status.HTTP_200_OK)

class CounsellorMonthAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            year = int(request.GET.get("year"))
            month = int(request.GET.get("month"))
        except (TypeError, ValueError):
            return Response({
                "success": False,
                "message": "Invalid year or month parameters"
            }, status=400)

        start_date = datetime(year, month, 1).date()
        end_day = monthrange(year, month)[1]
        end_date = datetime(year, month, end_day).date()

        # STEP 1: Get ALL bookings via BookingCounsellor with optimized queries
        booking_links = BookingCounsellor.objects.select_related(
            "booking__student__user",
            "booking__slot",
            "counsellor__user"
        ).filter(
            booking__slot__date__range=[start_date, end_date],
            booking__status__in=["booked", "rescheduled"]
        ).exclude(
            booking__slot__isnull=True  # Use exclude instead of filter with isnull=False
        )

        # Debug: Print query info (remove in production)
        print(f"Found {booking_links.count()} booking links for period {start_date} to {end_date}")
        
        # STEP 2: DATA MAP (date → counsellor → bookings)
        data_map = defaultdict(lambda: defaultdict(list))
        
        # Store counsellor objects to avoid repeated DB queries
        counsellor_cache = {}

        for link in booking_links:
            booking = link.booking
            slot = booking.slot
            
            if not slot:  # Skip if slot is None
                continue
                
            counsellor = link.counsellor
            
            # Cache counsellor object
            if counsellor.id not in counsellor_cache:
                counsellor_cache[counsellor.id] = counsellor
            
            date = slot.date
            
            # Get student name safely
            student_name = "Unknown"
            if booking.student and booking.student.user:
                student_name = f"{booking.student.user.first_name} {booking.student.user.last_name}".strip()
                if not student_name:
                    student_name = booking.student.user.email or "No Name"
            
            data_map[date][counsellor.id].append({
                "booking_id": booking.id,
                "student_name": student_name,
                "student_email": booking.student.user.email if booking.student and booking.student.user else "N/A",
                "preferred_mode": booking.student.preferred_counselling_mode if booking.student else "Not specified",
                "status": booking.status,
                "start_time": slot.start_time,
                "end_time": slot.end_time,
                "slot_mode": slot.mode,  # Added slot mode
                "meeting_link": booking.meeting_link,  # Added meeting link
            })

        # STEP 3: FINAL RESPONSE
        response_data = []

        for day in range(1, end_day + 1):
            current_date = datetime(year, month, day).date()
            
            counsellors_data = []
            
            # Get counsellors for this date
            for counsellor_id, bookings_list in data_map.get(current_date, {}).items():
                counsellor = counsellor_cache.get(counsellor_id)
                
                if not counsellor:
                    try:
                        counsellor = Counsellor.objects.select_related("user").get(id=counsellor_id)
                        counsellor_cache[counsellor_id] = counsellor
                    except ObjectDoesNotExist:
                        continue
                
                counsellor_name = "Unknown"
                if counsellor.user:
                    counsellor_name = f"{counsellor.user.first_name} {counsellor.user.last_name}".strip()
                    if not counsellor_name:
                        counsellor_name = counsellor.user.email or f"Counsellor {counsellor_id}"
                
                # Sort bookings by start_time if available
                bookings_list_sorted = sorted(bookings_list, key=lambda x: x.get('start_time', ''))
                
                counsellors_data.append({
                    "counsellor_id": counsellor.id,
                    "counsellor_name": counsellor_name,
                    "total_bookings": len(bookings_list_sorted),
                    "bookings": bookings_list_sorted
                })
            
            # Sort counsellors by name
            counsellors_data.sort(key=lambda x: x['counsellor_name'])
            
            total_bookings = sum(c["total_bookings"] for c in counsellors_data)
            
            response_data.append({
                "date": current_date,
                "total_counsellors": len(counsellors_data),
                "total_bookings": total_bookings,
                "counsellors": counsellors_data
            })

        return Response({
            "success": True,
            "data": response_data,
            "debug_info": {  # Optional: remove in production
                "total_booking_links_found": booking_links.count(),
                "date_range": f"{start_date} to {end_date}"
            }
        })

























# ================================== Old Code Below ==================================
class LeadCounsellorUserListAPIView(APIView):
    permission_classes = [IsAdmin | IsSuperAdmin | IsCounsellor]

    def get(self, request):
        users = User.objects.filter(
            role__name='lead_counsellor',
            is_active=True
        )

        serializer = LeadCounsellorUserSerializer(users, many=True)

        return Response({
            "success": True,
            "message": "Lead counsellor users fetched successfully",
            "data": serializer.data
        })
        
class NormalCounsellorUserListAPIView(APIView):
    permission_classes = [IsAdmin | IsSuperAdmin | IsCounsellor]

    def get(self, request):
        users = User.objects.filter(
            role__name='counsellor',
            is_active=True
        )

        serializer = LeadCounsellorUserSerializer(users, many=True)

        return Response({
            "success": True,
            "message": "Normal counsellor users fetched successfully",
            "data": serializer.data
        })


        
class AddCounsellorAPIView(APIView):
    """
        Creates or updates a counsellor.
        - POST: Add a counsellor
        - PUT: Update counsellor specialization or status
        Only accessible to Admin and Super Admin users.
    """
    permission_classes = [IsAdmin | IsSuperAdmin]

    def post(self, request):
        user_id = request.data.get('user_id')

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"message": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = AddCounsellorSerializer(
            instance=user,
            data=request.data,
            context={'user': user}
        )

        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            {
                "message": "User promoted to counsellor successfully",
                "data": UserBasicSerializer(user).data
            },
            status=status.HTTP_200_OK
        )

        
    # 🔹 PUT – Update counsellor
    def put(self, request, id):
        try:
            counsellor = Counsellor.objects.get(id=id)
        except Counsellor.DoesNotExist:
            return Response(
                {"message": "Counsellor not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = AddCounsellorSerializer(
            counsellor,
            data=request.data,
            partial=True
        )

        if not serializer.is_valid():
            return Response(
                {
                    "message": "Validation error",
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        counsellor = serializer.save()
        response_data = CounsellorResponseSerializer(counsellor).data

        return Response(
            {
                "message": "Counsellor updated successfully",
                "data": response_data
            },
            status=status.HTTP_200_OK
        )
        
class CreateSlotAPIView(APIView):
    """
    Creates a counselling slot with lead counsellor, optional normal counsellor,
    date, time, mode, and duration.
    Only accessible to Admin / Super Admin.
    """
    permission_classes = [IsAdmin | IsSuperAdmin | IsCounsellor]

 # -------------------- POST --------------------
    def post(self, request):
        serializer = SlotCreateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    "message": "Validation error",
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            slot = serializer.save(is_available=True)
            response_data = SlotResponseSerializer(slot).data

            return Response(
                {
                    "message": "Slot created successfully",
                    "data": response_data
                },
                status=status.HTTP_201_CREATED
            )

        except IntegrityError:
            return Response(
                {
                    "message": "Failed to create slot",
                    "errors": ["Database error occurred."]
                },
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # -------------------- PUT --------------------
    def put(self, request, pk):
        slot = get_object_or_404(Slot, pk=pk)

        # partial=True allows updating only the fields sent in the request
        serializer = SlotUpdateSerializer(slot, data=request.data, partial=True)

        if not serializer.is_valid():
            return Response({
                "message": "Validation error",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            slot = serializer.save()
            response_data = SlotResponseSerializer(slot).data
            return Response({
                "message": "Slot updated successfully",
                "data": response_data
            }, status=status.HTTP_200_OK)
        except IntegrityError:
            return Response({
                "message": "Failed to update slot",
                "errors": ["Database error occurred."]
            }, status=status.HTTP_400_BAD_REQUEST)

            
    # -------------------- GET --------------------
    def get(self, request, pk=None):
        """
        GET /slots/        -> return all slots
        GET /slots/<pk>/   -> return specific slot
        """
        if pk:
            try:
                slot = Slot.objects.get(pk=pk)
            except Slot.DoesNotExist:
                return Response(
                    {"message": "Slot not found."},
                    status=status.HTTP_404_NOT_FOUND
                )
            response_data = SlotResponseSerializer(slot).data
            return Response(
                {"message": "Slot retrieved successfully", "data": response_data},
                status=status.HTTP_200_OK
            )

        # If no pk, return all slots
        slots = Slot.objects.all().order_by('-date', '-start_time')
        response_data = SlotResponseSerializer(slots, many=True).data
        return Response(
            {"message": "Slots retrieved successfully", "data": response_data},
            status=status.HTTP_200_OK
        )

    # -------------------- DELETE --------------------
    def delete(self, request, pk=None):
        if not pk:
            return Response(
                {"message": "Slot ID is required for deletion."},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            slot = Slot.objects.get(pk=pk)
        except Slot.DoesNotExist:
            return Response(
                {"message": "Slot not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        slot.delete()
        return Response(
            {"message": "Slot deleted successfully."},
            status=status.HTTP_200_OK
        )
        
# views.py

# class SendReminderAPIView(APIView):
#     """
#     Send reminder email using provided booking_id,
#     but always fetch FIRST booking entry of that student
#     """

#     permission_classes = [IsAuthenticated]

#     def post(self, request, booking_id):

#         # ==========================================
#         # 🔹 GET CURRENT BOOKING
#         # ==========================================
#         current_booking = get_object_or_404(
#             Booking,
#             id=booking_id
#         )

#         student_profile = current_booking.student
#         user = student_profile.user

#         # ==========================================
#         # 🔹 EMAIL CHECK
#         # ==========================================
#         if not user.email:
#             return Response(
#                 {
#                     "message": "Student email not found"
#                 },
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # ==========================================
#         # 🔹 GET FIRST BOOKING ENTRY OF STUDENT
#         # ==========================================
#         booking = (
#             Booking.objects
#             .filter(
#                 student=student_profile
#             )
#             .select_related("slot")
#             .order_by("id")   # ✅ FIRST booking entry
#             .first()
#         )

#         if not booking:
#             return Response(
#                 {
#                     "message": "No booking found for this student"
#                 },
#                 status=status.HTTP_404_NOT_FOUND
#             )

#         booking_status = booking.status

#         # ==========================================
#         # 🔹 SLOT VALIDATION
#         # ==========================================
#         slot = booking.slot if booking.slot else None

#         if booking_status in ["booked", "rescheduled"]:

#             if not slot or slot.is_deleted:
#                 return Response(
#                     {
#                         "message": "Valid slot not found for booked/rescheduled status"
#                     },
#                     status=status.HTTP_404_NOT_FOUND
#                 )

#         # ==========================================
#         # 🔹 GENERATE REMINDER
#         # ==========================================
#         reminder_data = generate_counselling_reminder(
#             slot,
#             student_profile,
#             booking_status
#         )

#         # ==========================================
#         # 🔹 SEND EMAIL
#         # ==========================================
#         try:
#             email = EmailMessage(
#                 subject=reminder_data["subject"],
#                 body=reminder_data["message"],
#                 from_email=settings.DEFAULT_FROM_EMAIL,
#                 to=[user.email],
#             )

#             email.send(fail_silently=False)

#             print("========== REMINDER EMAIL SENT ==========")
#             print("Requested Booking ID:", booking_id)
#             print("First Booking ID:", booking.id)
#             print("Student ID:", student_profile.id)
#             print("Booking Status:", booking_status)
#             print("Recipient:", user.email)
#             print("=========================================")

#         except Exception as e:
#             print("EMAIL ERROR:", str(e))

#             return Response(
#                 {
#                     "message": "Failed to send reminder email",
#                     "error": str(e)
#                 },
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )

#         # ==========================================
#         # 🔹 RESPONSE
#         # ==========================================
#         return Response(
#             {
#                 "message": "Reminder email sent successfully",
#                 "requested_booking_id": booking_id,
#                 "first_booking_id": booking.id,
#                 "booking_status": booking.status,
#                 "student_id": student_profile.id,
#                 "student_name": f"{user.first_name} {user.last_name}",
#                 "email": user.email,
#                 "phone": user.phone,
#                 "preferred_counselling_mode": (
#                     student_profile.preferred_counselling_mode
#                 ),
#                 "slot_id": slot.id if slot else None,
#                 "slot_date": slot.date if slot else None,
#                 "slot_start_time": slot.start_time if slot else None,
#                 "slot_end_time": slot.end_time if slot else None,
#                 "slot_mode": slot.mode if slot else None,
#                 "subject": reminder_data["subject"],
#                 "reminder_text": reminder_data["message"]
#             },
#             status=status.HTTP_200_OK
#         )

class SendReminderAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, booking_id):
        try:
            # ==========================================
            # GET CURRENT BOOKING
            # ==========================================
            current_booking = get_object_or_404(
                Booking.objects.select_related("student__user"),
                id=booking_id
            )

            student_profile = current_booking.student
            user = student_profile.user

            if not user.email:
                return Response(
                    {"message": "Student email not found"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # ==========================================
            # GET FIRST BOOKING OF STUDENT
            # ==========================================
            # booking = (
            #     Booking.objects
            #     .filter(student=student_profile)
            #     .select_related("slot")
            #     .order_by("id")
            #     .first()
            # )

            # if not booking:
            #     return Response(
            #         {"message": "No booking found"},
            #         status=status.HTTP_404_NOT_FOUND
            #     )
            
            booking = current_booking
            booking_status = booking.status
            slot = booking.slot
            program = booking.program
            package = booking.package

            booking_status = booking.status
            slot = booking.slot

            # ==========================================
            # SLOT VALIDATION
            # ==========================================
            if booking_status in ["booked", "rescheduled"]:
                if not slot:
                    return Response(
                        {"message": "Slot not assigned"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if slot.is_deleted:
                    return Response(
                        {"message": "Slot is deleted"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # ==========================================
            # GENERATE REMINDER
            # ==========================================
            # reminder_data = generate_counselling_reminder(
            #     slot,
            #     student_profile,
            #     booking_status
            # )
            reminder_data = generate_counselling_reminder(
                slot=slot,
                student_profile=student_profile,
                booking_status=booking_status,
                program=booking.program,
                package=booking.package,
            )

            # ==========================================
            # SEND EMAIL
            # ==========================================
            email = EmailMessage(
                subject=reminder_data["subject"],
                body=reminder_data["message"],
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
            )

            email.send(fail_silently=False)

            return Response(
                {
                    "message": "Reminder email sent successfully"
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            print(traceback.format_exc())

            return Response(
                {
                    "message": "Failed to send reminder",
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



      
        
        
# class BookingCreateAPIView(APIView):
#     """
#     API to create or update a counselling booking
#     """
#     permission_classes = [IsAdmin | IsSuperAdmin | IsCounsellor ]

#     def post(self, request):
#         serializer = BookingCreateSerializer(data=request.data)
#         if serializer.is_valid():
#             booking = serializer.save()
#             return Response(
#                 {
#                     "message": "Booking created successfully",
#                     "data": BookingCreateSerializer(booking).data
#                 },
#                 status=status.HTTP_201_CREATED
#             )

#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
#     def put(self, request, booking_id):
#         try:
#             booking = Booking.objects.get(id=booking_id)
#         except Booking.DoesNotExist:
#             return Response(
#                 {"message": "Booking not found"},
#                 status=status.HTTP_404_NOT_FOUND
#             )

#         serializer = BookingCreateSerializer(
#             booking,
#             data=request.data,
#             partial=True  # allow partial update
#         )

#         if serializer.is_valid():
#             booking = serializer.save()
#             return Response(
#                 {
#                     "message": "Booking updated successfully",
#                     "data": BookingCreateSerializer(booking).data
#                 },
#                 status=status.HTTP_200_OK
#             )

#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
#     def get(self, request):
#         bookings = (
#             Booking.objects
#             .select_related(
#                 "student",
#                 "slot",
#                 "lead_counsellor__user",
#                 "normal_counsellor__user",
#             )
#             .order_by("-created_at")
#         )

#         serializer = BookingCreateSerializer(bookings, many=True)
#         return Response(
#             {
#                 "message": "Bookings fetched successfully",
#                 "data": serializer.data
#             },
#             status=status.HTTP_200_OK
#         )
