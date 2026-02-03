from django.shortcuts import get_object_or_404, render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from accounts.models import User
from django.db import IntegrityError
from accounts.permissions import IsAdmin, IsCounsellor, IsLeadCounsellor, IsSuperAdmin
from counselling_slot.models import Booking, Counsellor, Slot
from counselling_slot.serializers import AddCounsellorSerializer, BookingCreateSerializer, CounsellorResponseSerializer, LeadCounsellorUserSerializer, SlotCreateSerializer, SlotResponseSerializer, SlotUpdateSerializer, UserBasicSerializer

class LeadCounsellorUserListAPIView(APIView):
    permission_classes = [IsAdmin | IsSuperAdmin | IsLeadCounsellor]

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
    permission_classes = [IsAdmin | IsSuperAdmin | IsLeadCounsellor]

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
    permission_classes = [IsAdmin | IsSuperAdmin | IsLeadCounsellor | IsCounsellor]

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
        
class BookingCreateAPIView(APIView):
    """
    API to create or update a counselling booking
    """
    permission_classes = [IsAdmin | IsSuperAdmin | IsLeadCounsellor ]

    def post(self, request):
        serializer = BookingCreateSerializer(data=request.data)
        if serializer.is_valid():
            booking = serializer.save()
            return Response(
                {
                    "message": "Booking created successfully",
                    "data": BookingCreateSerializer(booking).data
                },
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response(
                {"message": "Booking not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = BookingCreateSerializer(
            booking,
            data=request.data,
            partial=True  # allow partial update
        )

        if serializer.is_valid():
            booking = serializer.save()
            return Response(
                {
                    "message": "Booking updated successfully",
                    "data": BookingCreateSerializer(booking).data
                },
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get(self, request):
        bookings = (
            Booking.objects
            .select_related(
                "student",
                "slot",
                "lead_counsellor__user",
                "normal_counsellor__user",
            )
            .order_by("-created_at")
        )

        serializer = BookingCreateSerializer(bookings, many=True)
        return Response(
            {
                "message": "Bookings fetched successfully",
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )
