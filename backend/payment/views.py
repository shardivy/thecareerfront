from django.db import models
from django.shortcuts import get_object_or_404, render

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction

from django.db.models import Sum
from accounts.permissions import IsAdmin, IsSuperAdmin
from payment.models import Payment, PaymentLog
from payment.serializers import PaymentCreateSerializer, PaymentListSerializer, PaymentLogSerializer, PaymentResponseSerializer
from payment.utils import send_payment_reject_email, send_payment_reject_whatsapp
from program_package.models import UserProgramPackage

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


# class PaymentUpdateAPIView(APIView):
#     """
#     Admin updates payment status / verification
#     """

#     def put(self, request, payment_id):
#         try:
#             payment = Payment.objects.select_for_update().get(id=payment_id)
#         except Payment.DoesNotExist:
#             return Response(
#                 {"message": "Payment not found"},
#                 status=status.HTTP_404_NOT_FOUND
#             )

#         old_status = payment.status
#         data = request.data

#         for field in [
#             "amount",
#             "payment_type",
#             "method",
#             "status",
#             "transaction_id",
#             "proof_file",
#         ]:
#             if field in data:
#                 setattr(payment, field, data[field])

#         if "status" in data:
#             payment.verified_by = request.user

#         payment.save()

#         return Response(
#             {
#                 "success": True,
#                 "message": "Payment updated successfullyyyyyyyyyyyy",
#                 "old_status": old_status,
#                 "new_status": payment.status,
#                 "data": PaymentResponseSerializer(payment).data
#             },
#             status=status.HTTP_200_OK
#         )


class VerifyPaymentAPIView(APIView):
    """
    Admin-only API to verify a payment.

    - Allows approval or rejection of a payment only when its status is
      `verification_pending`.
    - On approval, automatically determines whether the payment is
      `fully_paid` or `partial_paid` based on cumulative payments for the package.
    - Prevents overpayment: if cumulative payments exceed package price, returns error.
    - On rejection, resets the payment to `pending` and notifies the user via email and WhatsApp.
    """
    permission_classes = [IsAdmin | IsSuperAdmin]  

    def post(self, request, payment_id):
        action = request.data.get('action')
        payment = get_object_or_404(Payment, id=payment_id)

        if payment.status != 'verification_pending':
            return Response(
                {"error": "Only verification_pending payments can be processed"},
                status=status.HTTP_400_BAD_REQUEST
            )

        old_status = payment.status   # 🔹 capture old status

        package_price = payment.package.price

        total_paid = Payment.objects.filter(
            user=payment.user,
            package=payment.package,
            status__in=['fully_paid', 'partial_paid']
        ).aggregate(total=Sum('amount'))['total'] or 0

        cumulative_amount = total_paid + payment.amount

        # ❌ Prevent overpayment
        if action == 'approve' and cumulative_amount > package_price:
            return Response(
                {
                    "success": False,
                    "error": f"Total payment exceeds package price. Please verify amounts." 
                             
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ APPROVE
        if action == 'approve':
            if cumulative_amount >= package_price:
                payment.status = 'fully_paid'
            else:
                payment.status = 'partial_paid'

        # ❌ REJECT
        elif action == 'reject':
            payment.status = 'pending'

        else:
            return Response(
                {"success": False, "error": "Invalid action. Use approve or reject"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 🔹 Save payment
        payment.verified_by = request.user
        payment.save()

        # 🔹 Create payment log
        PaymentLog.objects.create(
            payment=payment,
            old_status=old_status,
            new_status=payment.status,
            changed_by=request.user
        )

        # 🔹 Assign program/package on approval
        if action == 'approve':
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

        # 🔹 Notify on rejection
        send_payment_reject_email(payment.user.email)
        send_payment_reject_whatsapp(payment.user.phone)

        return Response({
            "success": True,
            "message": "Payment rejected and user notified"
        })
        
class PaymentListAPIView(APIView):
    """
    Get all payments with user, package price, and status details.
    """
    permission_classes = [IsAdmin | IsSuperAdmin]  

    def get(self, request):
        payments = Payment.objects.select_related(
            'user',
            'package',
            'package__program',
            'verified_by'
        ).order_by('-created_at')

        serializer = PaymentListSerializer(
            payments,
            many=True,
            context={'request': request}
        )

        return Response(
            {
                "success": True,
                "count": payments.count(),
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )


class PaymentStatsAPIView(APIView):
    """
    API to fetch payment amount statistics
    """
    permission_classes = [IsAdmin | IsSuperAdmin]

    def get(self, request):
        payments = Payment.objects.aggregate(
            total_collected=Sum(
                'amount',
                filter=models.Q(status__in=['fully_paid', 'partial_paid'])
            ),
            pending_verification=Sum(
                'amount',
                filter=models.Q(status='verification_pending')
            ),
            partial_paid=Sum(
                'amount',
                filter=models.Q(status='partial_paid')
            ),
            pending=Sum(
                'amount',
                filter=models.Q(status='pending')
            )
        )

        # Replace None with 0
        data = {key: value or 0 for key, value in payments.items()}

        return Response({
            "success": True,
            "data": data
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