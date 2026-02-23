from django.db import models
from django.shortcuts import get_object_or_404, render

from lead_registration.models import StudentProfile
from lead_registration.serializers import PaymentDetailSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from django.urls import reverse
from rest_framework import status
from django.db import transaction
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.clickjacking import xframe_options_exempt
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
import mimetypes
import os

from django.db.models import Q, Count, Sum
from accounts.permissions import IsAdmin, IsSuperAdmin
from rest_framework.permissions import IsAuthenticated

from payment.models import Payment, PaymentLog
from payment.serializers import PaymentCreateSerializer, PaymentListSerializer, PaymentLogSerializer, PaymentResponseSerializer, StudentPaymentDetailSerializer
from payment.utils import send_payment_reject_email, send_payment_reject_whatsapp
from program_package.models import Package, UserProgramPackage

class PaymentCreateAPIView(APIView):
    """
    Create Payment (Online / Offline)
    """
    permission_classes = [IsSuperAdmin | IsAdmin ]

    def post(self, request):
        serializer = PaymentCreateSerializer(
            data=request.data,
            context={"request": request}
        )

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            payment = serializer.save()

        # ✅ THIS IS THE KEY LINE
        response_data = PaymentResponseSerializer(
            payment,
            context={"request": request}
        ).data

        return Response(
            {
                "success": True,
                "message": "Payment created successfully",
                "data": response_data
            },
            status=status.HTTP_201_CREATED
        )

    def put(self, request, pk):
        """
        Update Payment (partial update supported)
        """
        payment = get_object_or_404(Payment, pk=pk)

        serializer = PaymentCreateSerializer(
            payment,
            data=request.data,
            partial=True,
            context={"request": request}
        )

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            payment = serializer.save()

        response_data = PaymentResponseSerializer(
            payment,
            context={"request": request}
        ).data

        return Response(
            {
                "success": True,
                "message": "Payment updated successfully",
                "data": response_data
            },
            status=status.HTTP_200_OK
        )
        
    def delete(self, request, pk):
        """
        Delete Payment
        """
        payment = get_object_or_404(Payment, pk=pk)

        with transaction.atomic():
            payment.delete()

        return Response(
            {
                "success": True,
                "message": "Payment deleted successfully"
            },
            status=status.HTTP_200_OK
        )


# class VerifyPaymentAPIView(APIView):
#     """
#     Admin-only API to verify a payment.

#     - Allows approval or rejection of a payment only when its status is
#       `verification_pending`.
#     - On approval, automatically determines whether the payment is
#       `fully_paid` or `partial_paid` based on cumulative payments for the package.
#     - Prevents overpayment: if cumulative payments exceed package price, returns error.
#     - On rejection, resets the payment to `pending` and notifies the user via email and WhatsApp.
#     """
#     permission_classes = [IsAdmin | IsSuperAdmin]  

#     def post(self, request, payment_id):
#         action = request.data.get('action')
#         payment = get_object_or_404(Payment, id=payment_id)

#         if payment.status != 'verification_pending':
#             return Response(
#                 {"error": "Only verification_pending payments can be processed"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         old_status = payment.status   # 🔹 capture old status

#         package_price = payment.package.price

#         total_paid = Payment.objects.filter(
#             user=payment.user,
#             package=payment.package,
#             status__in=['fully_paid', 'partial_paid']
#         ).aggregate(total=Sum('amount'))['total'] or 0

#         cumulative_amount = total_paid + payment.amount

#         # ❌ Prevent overpayment
#         if action == 'approve' and cumulative_amount > package_price:
#             return Response(
#                 {
#                     "success": False,
#                     "error": f"Total payment exceeds package price. Please verify amounts." 
                             
#                 },
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # ✅ APPROVE
#         if action == 'approve':
#             if cumulative_amount >= package_price:
#                 payment.status = 'fully_paid'
#             else:
#                 payment.status = 'partial_paid'

#         # ❌ REJECT
#         elif action == 'reject':
#             payment.status = 'pending'

#         else:
#             return Response(
#                 {"success": False, "error": "Invalid action. Use approve or reject"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # 🔹 Save payment
#         payment.verified_by = request.user
#         payment.save()

#         # 🔹 Create payment log
#         PaymentLog.objects.create(
#             payment=payment,
#             old_status=old_status,
#             new_status=payment.status,
#             changed_by=request.user
#         )

#         # 🔹 Assign program/package on approval
#         if action == 'approve':
#             UserProgramPackage.objects.get_or_create(
#                 user=payment.user,
#                 program=payment.package.program,
#                 package=payment.package,
#                 defaults={'assigned_by': request.user.email}
#             )

#             return Response({
#                 "success": True,
#                 "message": "Payment approved successfully",
#                 "payment_status": payment.status,
#                 "cumulative_amount": cumulative_amount,
#                 "package_price": package_price
#             })

#         # 🔹 Notify on rejection
#         send_payment_reject_email(payment.user.email)
#         send_payment_reject_whatsapp(payment.user.phone)

#         return Response({
#             "success": True,
#             "message": "Payment rejected and user notified",
#             "payment_id": payment.id
#         })
        
        
class VerifyPaymentAPIView(APIView):
    """
    Admin-only API to verify a payment.

    - Approve:
        • Calculates cumulative payments
        • Sets status to fully_paid / partial_paid
        • Prevents overpayment
        • Assigns program/package if fully paid

    - Reject:
        • Sends email & WhatsApp notification
        • Logs the action
        • Permanently deletes the payment record
    """

    # permission_classes = [IsAdmin | IsSuperAdmin]
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, payment_id):

        action = request.data.get('action')
        payment = get_object_or_404(Payment, id=payment_id)

        if action not in ['approve', 'reject']:
            return Response(
                {"success": False, "error": "Invalid action. Use approve or reject"},
                status=status.HTTP_400_BAD_REQUEST
            )

        old_status = payment.status
        package_price = payment.package.price

        # Calculate total paid excluding current payment
        total_paid = Payment.objects.filter(
            user=payment.user,
            package=payment.package,
            status__in=['fully_paid', 'partial_paid']
        ).exclude(id=payment.id).aggregate(
            total=Sum('amount')
        )['total'] or 0

        cumulative_amount = total_paid + payment.amount

        # ======================================
        # ✅ APPROVE LOGIC
        # ======================================
        if action == 'approve':

            # Prevent overpayment
            if cumulative_amount > package_price:
                return Response(
                    {
                        "success": False,
                        "error": "Total payment exceeds package price."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Determine payment status
            if cumulative_amount >= package_price:
                payment.status = 'fully_paid'
            else:
                payment.status = 'partial_paid'

            payment.verified_by = request.user
            payment.save()

            # Log status change
            PaymentLog.objects.create(
                payment=payment,
                old_status=old_status,
                new_status=payment.status,
                changed_by=request.user
            )

            # Assign program/package if fully paid
            if payment.status == 'fully_paid':
                UserProgramPackage.objects.get_or_create(
                    user=payment.user,
                    program=payment.package.program,
                    package=payment.package,
                    defaults={'assigned_by': request.user.email}
                )

            return Response({
                "success": True,
                "message": "Payment approved successfully",
                "payment_status": payment.status,
                "cumulative_amount": cumulative_amount,
                "package_price": package_price
            })

        # ======================================
        # ❌ REJECT LOGIC (DELETE RECORD)
        # ======================================
        elif action == 'reject':

            # Send notifications before deletion
            send_payment_reject_email(payment.user.email)
            send_payment_reject_whatsapp(payment.user.phone)

            # Log deletion
            PaymentLog.objects.create(
                payment=payment,
                old_status=old_status,
                new_status='deleted',
                changed_by=request.user
            )

            # Delete payment
            payment.delete()

            return Response({
                "success": True,
                "message": "Payment rejected and removed from database"
            })
# =================================================================================

class PaymentListAPIView(APIView):
    """
    Get all payments with user, package, status
    + payment proof file
    + total_paid
    + remaining_amount
    + last_payment_amount
    """
    # permission_classes = [IsAdmin | IsSuperAdmin]
    permission_classes = [IsAuthenticated]

    def get(self, request):

        unique_payments = (
            Payment.objects
            .values("user", "package")
            .distinct()
        )

        response_data = []

        for item in unique_payments:
            user_id = item["user"]
            package_id = item["package"]

            payments_qs = Payment.objects.filter(
                user_id=user_id,
                package_id=package_id
            ).select_related(
                'user',
                'user__student_profile',
                'package',
                'package__program'
            ).order_by('-created_at')

            latest_payment = payments_qs.first()

            if not latest_payment:
                continue

            # ✅ Total paid
            total_paid = payments_qs.aggregate(
                total=Sum("amount")
            )["total"] or 0

            package_price = latest_payment.package.price if latest_payment.package else 0
            remaining_amount = max(package_price - total_paid, 0)

            # ✅ Correct payment status logic
            if latest_payment.status in ["verification_pending", "rejected"]:
                payment_status = latest_payment.status
            else:
                payment_status = (
                    "fully_paid" if remaining_amount == 0 else "partial_paid"
                )

            proof_url = None
            if latest_payment.proof_file:
                url = reverse(
                    "payment-report-image",
                    kwargs={"payment_id": latest_payment.id}
                )
                proof_url = request.build_absolute_uri(url)

            response_data.append({
                "user_id": latest_payment.user.id,
                "student_id": (
                    latest_payment.user.student_profile.id
                    if getattr(latest_payment.user, "student_profile", None)
                    else None
                ),
                "user_name": f"{latest_payment.user.first_name} {latest_payment.user.last_name}",
                "email": latest_payment.user.email,

                # 🔥 Payment Summary
                "total_paid": total_paid,
                "remaining_amount": remaining_amount,
                "package_price": package_price,

                # 🔥 NEW FIELD (Last payment amount)
                "amount": latest_payment.amount,

                "program_id": (
                    latest_payment.package.program.id
                    if latest_payment.package and latest_payment.package.program
                    else None
                ),
                "program": (
                    latest_payment.package.program.name
                    if latest_payment.package else None
                ),
                "package_id": latest_payment.package.id if latest_payment.package else None,
                "package": latest_payment.package.name if latest_payment.package else None,

                # Latest transaction details
                "payment_id": latest_payment.id,
                "created_at": latest_payment.created_at,
                "payment_date": latest_payment.payment_date,
                "transaction_id": latest_payment.transaction_id,
                "payment_status": payment_status,
                "method": latest_payment.method,

                "proof_file_url": proof_url,
            })

        return Response(
            {
                "success": True,
                "count": len(response_data),
                "data": response_data
            },
            status=status.HTTP_200_OK
        )

        
@method_decorator(xframe_options_exempt, name="dispatch")
class PaymentProofFileView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, payment_id):
        payment = get_object_or_404(Payment, id=payment_id)

        if not payment.proof_file:
            raise Http404("Proof file not found")

        content_type, _ = mimetypes.guess_type(payment.proof_file.name)

        if content_type not in [
            "image/png",
            "image/jpeg",
            "application/pdf"
        ]:
            raise Http404("Unsupported file type")

        response = FileResponse(
            payment.proof_file.open("rb"),
            content_type=content_type
        )
        response["Content-Disposition"] = "inline"
        response["X-Frame-Options"] = "ALLOWALL"
        return response


class PaymentStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        # 🔹 FULLY PAID USERS
        fully_paid_user_ids = Payment.objects.filter(
            status='fully_paid'
        ).values_list('user_id', flat=True).distinct()

        # ==============================
        # 🔹 TOTAL EXPECTED COLLECTION
        # ==============================

        # Unique user-package combinations
        user_packages = Payment.objects.values(
            'user_id', 'package_id', 'package__price'
        ).distinct()

        total_users = user_packages.count()

        total_expected = sum(
            item['package__price'] for item in user_packages
        ) if user_packages else 0

        # ==============================
        # 🔹 TOTAL COLLECTED
        # ==============================

        total_collected = Payment.objects.aggregate(
            collected=Sum(
                'amount',
                filter=Q(status__in=['fully_paid', 'partial_paid'])
            )
        )['collected'] or 0

        # ==============================
        # 🔹 PARTIAL PAID
        # ==============================

        partial_queryset = Payment.objects.filter(
            status='partial_paid'
        ).exclude(
            user_id__in=fully_paid_user_ids
        )

        partial_data = partial_queryset.aggregate(
            total_amount=Sum('amount'),
            total_payments=Count('id'),
            total_users=Count('user', distinct=True)
        )

        # ==============================
        # 🔹 FULLY PAID
        # ==============================

        fully_queryset = Payment.objects.filter(status='fully_paid')

        fully_data = fully_queryset.aggregate(
            total_amount=Sum('amount'),
            total_payments=Count('id'),
            total_users=Count('user', distinct=True)
        )

        # ==============================
        # 🔹 VERIFICATION PENDING
        # ==============================

        pending_queryset = Payment.objects.filter(status='verification_pending')

        pending_data = pending_queryset.aggregate(
            total_amount=Sum('amount'),
            total_payments=Count('id'),
            total_users=Count('user', distinct=True)
        )

        # ==============================
        # 🔹 FINAL RESPONSE
        # ==============================

        return Response({
            "success": True,
            "data": {

                "total_expected_collection": {
                    "total_users": total_users,
                    "expected_amount": total_expected
                },

                "total_collected": total_collected,

                "partial_paid": {
                    "total_users": partial_data['total_users'] or 0,
                    "total_payments": partial_data['total_payments'] or 0,
                    "total_amount": partial_data['total_amount'] or 0
                },

                "fully_paid": {
                    "total_users": fully_data['total_users'] or 0,
                    "total_payments": fully_data['total_payments'] or 0,
                    "total_amount": fully_data['total_amount'] or 0
                },

                "verification_pending": {
                    "total_users": pending_data['total_users'] or 0,
                    "total_payments": pending_data['total_payments'] or 0,
                    "total_amount": pending_data['total_amount'] or 0
                }
            }
        })

        
class PaymentLogListAPIView(APIView):
    """
    Fetch all status change logs for a payment
    """
    permission_classes = [IsAdmin | IsSuperAdmin]

    def get(self, request, payment_id):
        payment = get_object_or_404(Payment, id=payment_id)

        logs = PaymentLog.objects.filter(
            payment=payment
        ).order_by("-created_at")

        serializer = PaymentLogSerializer(logs, many=True)

        return Response({
            "success": True,
            "payment_id": payment.id,
            "total_logs": logs.count(),
            "data": serializer.data
        })
        
class StudentPaymentListAPIView(APIView):
    """
    Fetch all payments of a student using student_id
    """

    def get(self, request, student_id):
        student = get_object_or_404(StudentProfile, id=student_id)
        user = student.user

        payments = Payment.objects.filter(user=user).order_by("-created_at")


        serializer = PaymentDetailSerializer(
            payments,
            many=True,
            context={
                "request": request,
                "payments": payments
            }
        )


        return Response(
            {
                "message": "Student payment list fetched successfully",
                "student_id": student.id,
                "user_id": user.id,
                "total_payments": payments.count(),
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )

        
class StudentPackagePaymentSummaryAPIView(APIView):
    """
    Get payment summary by student_id + package_id
    """
    permission_classes = [IsAdmin | IsSuperAdmin]

    def get(self, request, student_id, package_id):

        # Get student
        student = get_object_or_404(StudentProfile, id=student_id)
        user = student.user

        # Get package
        package = get_object_or_404(Package, id=package_id)

        # Get all payments for this student + package
        payments = Payment.objects.filter(
            user=user,
            package=package
        )

        if not payments.exists():
            return Response(
                {
                    "success": False,
                    "message": "No payment found for this student and package."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        total_paid = payments.aggregate(
            total=Sum("amount")
        )["total"] or 0

        package_price = package.price
        remaining_amount = max(package_price - total_paid, 0)

        # Latest payment status
        latest_payment = payments.order_by("-created_at").first()

        return Response(
            {
                "success": True,
                "data": {
                    "student_id": student.id,
                    "student_name": f"{user.first_name} {user.last_name}",
                    "package_id": package.id,
                    "package_name": package.name,
                    "package_price": package_price,
                    "total_paid": total_paid,
                    "remaining_amount": remaining_amount,
                    "payment_status": latest_payment.status
                }
            },
            status=status.HTTP_200_OK
        )
        
class UpdatePaymentStatusAPIView(APIView):
    """
    Update payment status anytime
    """
    permission_classes = [IsAuthenticated]  # Add role permissions if needed

    @transaction.atomic
    def post(self, request, pk):

        payment = get_object_or_404(Payment, id=pk)

        new_status = request.data.get("status")

        # ✅ Validate status
        VALID_STATUSES = [
            "fully_paid",
            "partial_paid",
            "verification_pending"
        ]

        if new_status not in VALID_STATUSES:
            return Response(
                {
                    "success": False,
                    "message": f"Status must be one of {VALID_STATUSES}"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ Update payment
        payment.status = new_status
        payment.verified_by = request.user
        payment.save(update_fields=["status", "verified_by", "updated_at"])

        return Response(
            {
                "success": True,
                "message": "Payment status updated successfully",
                "payment_id": payment.id,
                "new_status": payment.status,
                "verified_by": request.user.id
            },
            status=status.HTTP_200_OK
        )
        
# =================================== Student Payment Summary API ===================================

class StudentPaymentDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        student = get_object_or_404(
            StudentProfile.objects.select_related("user"),
            id=student_id
        )

        serializer = StudentPaymentDetailSerializer(student)
        return Response(serializer.data)