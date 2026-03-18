from django.shortcuts import get_object_or_404, render
from backend import settings
from counselling_slot.utils import send_booking_created_email, send_booking_updated_email
from lead_registration.models import StudentProfile
from counselling_slot.tasks import create_system_notification, send_booking_cancel_notification
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
from counselling_slot.serializers import AddCounsellorSerializer, BookingCreateSerializer, BookingReadSerializer, CounsellingNoteSerializer, CounsellorListSerializer, CounsellorResponseSerializer, CounsellorStudentBookingSerializer, LeadCounsellorUserSerializer, SlotCreateSerializer, SlotResponseSerializer, SlotUpdateSerializer, StudentBookingSerializer, UserBasicSerializer
 
# ============================ New Code Below =========================

FIXED_SLOTS = [
    ("10:30 AM", "12:30 PM"),
    ("12:30 PM", "02:30 PM"),
    ("03:00 PM", "05:00 PM"),
    ("05:00 PM", "07:00 PM"),
]


class CounsellorListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        counsellors = Counsellor.objects.select_related("user").all()
        serializer = CounsellorListSerializer(counsellors, many=True)
        return Response(serializer.data)
    
# API to create a counselling slot  
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
            for start_time, end_time in FIXED_SLOTS:
                Slot.objects.create(
                    counsellor_id=counsellor_user_id,  # ✅ USER ID ONLY
                    date=date,
                    start_time=start_time,
                    end_time=end_time,
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
        booking_status_map = {
            b["slot_id"]: b["status"]
            for b in Booking.objects.filter(
                slot__in=slots
            ).values("slot_id", "status")
        }

        # =========================
        # 🔹 Response slots
        # =========================
        response_slots = [
            {
                "id": slot.id,
                "date": slot.date,
                "start_time": slot.start_time,
                "end_time": slot.end_time,
                "mode": slot.mode,
                "is_available": slot.is_available,
                "status": booking_status_map.get(slot.id, "available")
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

        # ✅ Correct IDs
        counsellor_table_id = counsellor_obj.id
        counsellor_user_id = counsellor_obj.user_id

        # =========================
        # 🔹 FIXED SLOTS SET
        # =========================
        fixed_slot_set = set(FIXED_SLOTS)

        # =========================
        # 🔹 1. CREATE FIXED SLOTS (ONLY IF NO SLOT EXISTS FOR DATE)
        # =========================

        existing_slots = Slot.objects.filter(
            counsellor_id=counsellor_user_id,
            date=date
        )

        fixed_created = False

        if not existing_slots.exists():
            fixed_created = True

            fixed_slot_objects = [
                Slot(
                    counsellor_id=counsellor_user_id,
                    date=date,
                    start_time=start_time,
                    end_time=end_time,
                    is_available=True
                )
                for start_time, end_time in FIXED_SLOTS
            ]

            Slot.objects.bulk_create(fixed_slot_objects)


        # =========================
        # 🔹 2. CREATE MANUAL SLOTS
        # =========================
        created_manual_slots = []

        for slot in manual_slots:
            start_time = slot.get("start_time")
            end_time = slot.get("end_time")

            if not start_time or not end_time:
                continue

            # 🚫 Skip FIXED slots
            if (start_time, end_time) in fixed_slot_set:
                continue

            obj, created = Slot.objects.get_or_create(
                counsellor_id=counsellor_user_id,   # ✅ USER ID
                date=date,
                start_time=start_time,
                end_time=end_time,
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
            counsellor_id=counsellor_user_id,   # ✅ USER ID
            date=date
        ).order_by("start_time")
        
        # =========================
        # 🔔 SEND NOTIFICATION TO SUPERADMIN (ASYNC)
        # =========================

        from django.db.transaction import on_commit
        from django.contrib.auth import get_user_model
        from counselling_slot.tasks import create_system_notification

        User = get_user_model()

        # Counsellor name
        counsellor_name = f"{counsellor_obj.user.first_name} {counsellor_obj.user.last_name}"

        title = "New Slots Created"

        message = (
            f"Counsellor {counsellor_name} has created slots for date {date}. "
            f"Total slots: {slots.count()}."
        )

        # Get superadmins (or staff)
        admin_users = User.objects.filter(is_superuser=True)  # or is_staff=True

        for admin in admin_users:
            admin_id = admin.id  # ✅ fix lambda issue

            on_commit(lambda admin_id=admin_id: create_system_notification.delay(
                admin_id,
                title,
                message
            ))

        return Response(
            {
                "message": "Slots processed successfully",
                "date": date,

                # 🔹 Return BOTH IDs (clean API)
                "counsellor_id": counsellor_table_id,
                "counsellor_user_id": counsellor_user_id,

                "fixed_slots_created": fixed_created,
                "new_manual_slots_created": len(created_manual_slots),
                "total_slots": slots.count(),
                "data": SlotCreateSerializer(slots, many=True).data
            },
            status=status.HTTP_201_CREATED
        )
        
        
# API to delete a slot
# class SlotDeleteAPIView(APIView):
#     permission_classes = [IsAuthenticated]

#     @transaction.atomic
#     def delete(self, request, slot_id):
#         slot = get_object_or_404(Slot, id=slot_id)

#         # 🚨 Do not allow deleting if booked
#         if Booking.objects.filter(slot=slot).exists():
#             return Response(
#                 {"success": False, "message": "Slot cannot be deleted because it is already booked."},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # ✅ Soft delete only
#         slot.is_deleted = True
#         slot.is_available = False
#         slot.save(update_fields=["is_deleted", "is_available"])

#         return Response(
#             {"success": True, "message": "Slot deleted successfully."},
#             status=status.HTTP_200_OK
#         )

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
                "end_time": slot.end_time,
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

       
class BookingCreateAPIView(APIView):
    # permission_classes = [IsAdmin | IsSuperAdmin | IsCounsellor]
    permission_classes = [IsAuthenticated]

    # def post(self, request):
    #     serializer = BookingCreateSerializer(data=request.data)
    #     serializer.is_valid(raise_exception=True)

    #     student = serializer.validated_data["student_id"]
    #     date = serializer.validated_data["date"]
    #     slots = serializer.validated_data["slots"]
    #     counsellors = serializer.validated_data["counsellors_data"]

    #     created_bookings = []

    #     with transaction.atomic():
    #         for slot in slots:
    #             booking = Booking.objects.create(
    #                 student=student,
    #                 slot=slot,
    #                 date=date,
    #                 status="booked"
    #             )
                
    #             # Send email
    #             send_booking_created_email(student.user, slots, date)

    #             # 🔥 IMPORTANT FIX IS HERE
    #             for item in counsellors:
    #                 counsellor_obj = item["counsellor_id"]  # ✅ already a Counsellor instance

    #                 BookingCounsellor.objects.create(
    #                     booking=booking,
    #                     counsellor=counsellor_obj,
    #                     role=item["role"]
    #                 )

    #             created_bookings.append({
    #                 "booking_id": booking.id,
    #                 "status": booking.status,
    #                 "slot": {
    #                     "id": slot.id,
    #                     "date": slot.date,
    #                     "start_time": slot.start_time,
    #                     "end_time": slot.end_time,
    #                     "mode": slot.mode,
    #                 }
    #             })

    #     return Response(
    #         {
    #             "message": "Booking created successfully",
    #             "data": created_bookings
    #         },
    #         status=status.HTTP_201_CREATED
    #     )
    
    def post(self, request):
        serializer = BookingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        student = serializer.validated_data["student_id"]
        date = serializer.validated_data["date"]
        slots = serializer.validated_data["slots"]
        counsellors = serializer.validated_data["counsellors_data"]

        created_bookings = []

        with transaction.atomic():
            for slot in slots:

                # ✅ Create booking
                booking = Booking.objects.create(
                    student=student,
                    slot=slot,
                    date=date,
                    status="booked"
                )

                # ✅ Send email (optional)
                send_booking_created_email(student.user, slots, date)

                # ✅ Prepare notification data
                student_name = f"{student.user.first_name} {student.user.last_name}"

                title = "New Booking Created"

                message = (
                    f"Student {student_name} has created a counselling slot "
                    f"on {date} ({slot.start_time} - {slot.end_time})."
                )

                # ✅ Send notification to all admins (ASYNC via Celery)
                admin_users = User.objects.filter(is_staff=True)

                for admin in admin_users:
                    on_commit(lambda admin_id=admin.id: create_system_notification.delay(
                        admin_id,
                        title,
                        message
                    ))

                # ✅ Assign counsellors
                for item in counsellors:
                    BookingCounsellor.objects.create(
                        booking=booking,
                        counsellor=item["counsellor_id"],
                        role=item["role"]
                    )

                # ✅ Response data
                created_bookings.append({
                    "booking_id": booking.id,
                    "status": booking.status,
                    "slot": {
                        "id": slot.id,
                        "date": slot.date,
                        "start_time": slot.start_time,
                        "end_time": slot.end_time,
                        "mode": slot.mode,
                    }
                })

        return Response(
            {
                "message": "Booking created successfully",
                "data": created_bookings
            },
            status=status.HTTP_201_CREATED
        )
        
    def put(self, request, booking_id):
        # serializer = BookingCreateSerializer(data=request.data)
        serializer = BookingCreateSerializer(
            data=request.data,
            context={"booking_id": booking_id}
        )
        serializer.is_valid(raise_exception=True)

        student = serializer.validated_data["student_id"]
        date = serializer.validated_data["date"]
        slots = serializer.validated_data["slots"]
        counsellors = serializer.validated_data["counsellors_data"]

        try:
            base_booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response(
                {"message": "Booking not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        created_bookings = []

        with transaction.atomic():
            # 🔥 Remove old counsellors + bookings (same student & date)
            old_bookings = Booking.objects.filter(
                student=base_booking.student,
                date=base_booking.date
            )

            BookingCounsellor.objects.filter(
                booking__in=old_bookings
            ).delete()

            old_bookings.delete()

            # 🔥 Create new bookings
            for slot in slots:
                booking = Booking.objects.create(
                    student=student,
                    slot=slot,
                    date=date,
                    status="booked"
                )

                for item in counsellors:
                    BookingCounsellor.objects.create(
                        booking=booking,
                        counsellor=item["counsellor_id"],
                        role=item["role"]
                    )

                created_bookings.append({
                    "booking_id": booking.id,
                    "status": booking.status,
                    "slot": {
                        "id": slot.id,
                        "date": slot.date,
                        "start_time": slot.start_time,
                        "end_time": slot.end_time,
                        "mode": slot.mode,
                    }
                })
                send_booking_updated_email(
                    student.user,
                    slots,
                    date
                )

        return Response(
            {
                "message": "Booking updated successfully",
                "data": created_bookings
            },
            status=status.HTTP_200_OK
        )
        
    # def get(self, request, booking_id=None):
    #     if booking_id:
    #         # 🔹 Single booking
    #         booking = get_object_or_404(Booking, id=booking_id)

    #         serializer = BookingReadSerializer(booking)
    #         return Response(
    #             {
    #                 "message": "Booking fetched successfully",
    #                 "data": serializer.data
    #             },
    #             status=status.HTTP_200_OK
    #         )

    #     # 🔹 Booking list
    #     bookings = (
    #         Booking.objects
    #         .select_related("student", "slot")
    #         .prefetch_related("bookingcounsellor_set__counsellor__user")
    #         .order_by("-created_at")
    #     )

    #     serializer = BookingReadSerializer(bookings, many=True)
    #     return Response(
    #         {
    #             "message": "Bookings fetched successfully",
    #             "data": serializer.data
    #         },
    #         status=status.HTTP_200_OK
    #     )
    
    def get(self, request, booking_id=None):

        # =============================
        # AUTO UPDATE BOOKING STATUS
        # =============================

        ist = pytz.timezone("Asia/Kolkata")
        now = timezone.now().astimezone(ist)
        print("NOW:", now)

        bookings = Booking.objects.select_related("slot").filter(status="booked")

        for booking in bookings:
            slot = booking.slot

            if not slot:
                continue

            slot_date = slot.date
            end_time = slot.end_time

            # handle time range like "12:30 PM - 02:30 PM"
            if isinstance(end_time, str):

                if "-" in end_time:
                    end_time = end_time.split("-")[1].strip()

                try:
                    end_time = datetime.strptime(end_time.strip(), "%I:%M %p").time()
                except ValueError:
                    try:
                        end_time = datetime.strptime(end_time.strip(), "%H:%M:%S").time()
                    except ValueError:
                        end_time = datetime.strptime(end_time.strip(), "%H:%M").time()

            end_datetime = datetime.combine(slot_date, end_time)

            # convert to IST
            end_datetime = ist.localize(end_datetime)

            print("END:", end_datetime)

            if now >= end_datetime:
                booking.status = "completed"
                booking.save(update_fields=["status"])
                print("UPDATED:", booking.id)

        # =============================
        # SINGLE BOOKING
        # =============================

        if booking_id:
            booking = get_object_or_404(
                Booking.objects.select_related("student", "slot")
                .prefetch_related("bookingcounsellor_set__counsellor__user"),
                id=booking_id
            )

            serializer = BookingReadSerializer(booking)

            return Response({
                "message": "Booking fetched successfully",
                "data": serializer.data
            })

        # =============================
        # ALL BOOKINGS
        # =============================

        bookings = Booking.objects.select_related("student", "slot") \
            .prefetch_related("bookingcounsellor_set__counsellor__user") \
            .order_by("-created_at")

        serializer = BookingReadSerializer(bookings, many=True)

        return Response({
            "message": "Bookings fetched successfully",
            "data": serializer.data
        })  
        
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
            "end_time": str(booking.slot.end_time),
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
            
class SessionDashboardCountAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        period = request.GET.get("period", "monthly")  # weekly | monthly | yearly
        today = now().date()

        bookings = Booking.objects.all()

        # 🔹 Period filter
        if period == "weekly":
            start_date = today - timedelta(days=today.weekday())
            end_date = start_date + timedelta(days=6)
            period_qs = bookings.filter(date__range=[start_date, end_date])

        elif period == "yearly":
            period_qs = bookings.filter(date__year=today.year)

        else:  # monthly (default)
            period_qs = bookings.filter(
                date__year=today.year,
                date__month=today.month
            )

        # 🔹 Total sessions (all time)
        total_sessions = bookings.count()

        # 🔹 Today
        today_qs = bookings.filter(date=today)
        today_completed = today_qs.filter(status="completed").count()
        today_upcoming = today_qs.filter(
            status__in=["booked", "rescheduled"]
        ).count()

        # 🔹 Period sessions
        period_sessions = period_qs.count()

        # 🔹 Completed (all time or period-based – you can choose)
        completed_sessions = bookings.filter(status="completed").count()

        return Response({
            "period": period,

            "total_sessions": total_sessions,

            "today_sessions": {
                "total": today_completed + today_upcoming,
                "completed": today_completed,
                "upcoming": today_upcoming
            },

            "period_sessions": period_sessions,

            "completed_sessions": completed_sessions
        })
   
FIXED_SLOTS = [
    ("10:30 AM", "12:30 PM"),
    ("12:30 PM", "02:30 PM"),
    ("03:00 PM", "05:00 PM"),
    ("05:00 PM", "07:00 PM"),
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
                        end_time=end_time,
                        is_available=True
                    )
                    for start_time, end_time in FIXED_SLOTS
                ]
                Slot.objects.bulk_create(fixed_slot_objects)

                slots = Slot.objects.filter(
                    counsellor_id=counsellor_user_id,
                    date=selected_date,
                    is_deleted=False
                ).order_by("start_time")

            # 🔹 Booking status map
            booking_status_map = {
                b["slot_id"]: b["status"]
                for b in Booking.objects.filter(
                    slot__in=slots
                ).values("slot_id", "status")
            }

            counsellor_slots = [
                {
                    "slot_id": slot.id,
                    "start_time": slot.start_time,
                    "end_time": slot.end_time,
                    "mode": slot.mode,
                    "is_available": slot.is_available,
                    "status": booking_status_map.get(slot.id, "available")
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
        
        
class BookingMarkCompletedAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)

        # Optional validation
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

        # ✅ Update status
        booking.status = "completed"
        booking.save()

        return Response(
            {
                "message": "Booking marked as completed successfully",
                "booking_id": booking.id,
                "status": booking.status,
                "updated_at": booking.updated_at
            },
            status=status.HTTP_200_OK
        )


# class BookingMarkCompletedAPIView(APIView):
#     permission_classes = [IsAuthenticated]

#     def put(self, request, booking_id):
#         booking = get_object_or_404(Booking, id=booking_id)

#         # ❌ Cancelled booking validation
#         if booking.status == "cancelled":
#             return Response(
#                 {"message": "Cancelled booking cannot be marked as completed."},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         slot = booking.slot

#         if not slot or not slot.end_time:
#             return Response(
#                 {"message": "Slot end time not available."},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         try:
#             # Convert slot date + end_time to datetime
#             end_datetime = datetime.strptime(
#                 f"{slot.date} {slot.end_time}",
#                 "%Y-%m-%d %H:%M"
#             )
#             end_datetime = timezone.make_aware(end_datetime)

#             # 30 minutes before end time
#             trigger_time = end_datetime - timedelta(minutes=120)

#             now = timezone.now()

#             if now >= trigger_time:
#                 booking.status = "completed"
#                 booking.save(update_fields=["status"])

#                 return Response(
#                     {
#                         "message": "Booking automatically marked as completed (30 minutes before slot end).",
#                         "booking_id": booking.id,
#                         "status": booking.status,
#                         "updated_at": booking.updated_at
#                     },
#                     status=status.HTTP_200_OK
#                 )

#             else:
#                 return Response(
#                     {
#                         "message": "Booking cannot be marked as completed yet. 30 minutes window not reached.",
#                         "booking_id": booking.id
#                     },
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#         except Exception:
#             return Response(
#                 {"message": "Invalid slot time format."},
#                 status=status.HTTP_400_BAD_REQUEST
#             )


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

class CounsellorStudentBookingListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        bookings = Booking.objects.filter(
            bookingcounsellor__counsellor__user=request.user,
            status__in=["booked", "completed"]
        ).select_related(
            "student__user",
            "slot"
        ).prefetch_related(
            "bookingcounsellor_set__counsellor__user"
        ).distinct().order_by("-date")

        serializer = CounsellorStudentBookingSerializer(
            bookings,
            many=True,
            context={"request": request}
        )
        return Response(serializer.data)


class CounsellorCompletedStudentBookingListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        bookings = Booking.objects.filter(
            bookingcounsellor__counsellor__user=request.user,
            status="completed"
        ).select_related(
            "student__user",
            "slot"
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
        # period = weekly / monthly / yearly

        user = request.user

        # Get Counsellor instance
        try:
            counsellor = Counsellor.objects.get(user=user)
        except Counsellor.DoesNotExist:
            return Response({"error": "Counsellor not found"}, status=404)

        today = timezone.now().date()

        # ============================================
        # 1️⃣ Assigned Students Count
        # ============================================
        assigned_students = BookingCounsellor.objects.filter(
            counsellor=counsellor
        ).values("booking__student").distinct().count()

        # ============================================
        # Base Booking Query For This Counsellor
        # ============================================
        bookings = Booking.objects.filter(
            bookingcounsellor__counsellor=counsellor
        )

        # ============================================
        # Date Filtering
        # ============================================
        if period == "weekly":
            start_date = today - timezone.timedelta(days=today.weekday())
            bookings = bookings.filter(date__gte=start_date)

        elif period == "monthly":
            bookings = bookings.filter(
                date__year=today.year,
                date__month=today.month
            )

        elif period == "yearly":
            bookings = bookings.filter(
                date__year=today.year
            )

        # ============================================
        # 2️⃣ Upcoming Sessions
        # ============================================
        upcoming_sessions = bookings.filter(
            date__gte=today,
            status__in=["booked", "rescheduled"]
        ).count()

        # ============================================
        # 3️⃣ Completed Sessions
        # ============================================
        completed_sessions = bookings.filter(
            status="completed"
        ).count()

        return Response({
            "assigned_students": assigned_students,
            "upcoming_sessions": upcoming_sessions,
            "completed_sessions": completed_sessions,
            "period": period
        }, status=status.HTTP_200_OK)












































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
