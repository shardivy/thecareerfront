from datetime import timezone
from django.shortcuts import get_object_or_404, render
from exam.service import create_default_exams_for_all_packages
from report.models import Report
from rest_framework.views import APIView
from rest_framework.authentication import (TokenAuthentication)
from django.utils import timezone

from accounts.models import User
from accounts.permissions import IsAdmin, IsCounsellor, IsSuperAdmin
from exam.models import Exam, UserExam
from exam.serializers import ExamCreateSerializer, PackageExamCreateSerializer, PackageExamResponseSerializer, PackageExamUpdateSerializer, UserExamApproveResponseSerializer, UserExamCreateSerializer, UserExamListSerializer
from rest_framework.response import Response
from rest_framework import status
from django.utils.timezone import now

from program_package.models import Package, PackageExam

class ExamCreateAPIView(APIView):
    """
    Admin API to add new exam
    """
    permission_classes = [ IsSuperAdmin]

    def post(self, request):
        serializer = ExamCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        exam = serializer.save()

        return Response(
            {
                "success": True,
                "message": "Exam created successfully",
                "data": {
                    "id": exam.id,
                    "name": exam.name,
                    "provider": exam.provider,
                    "exam_link": exam.exam_link,
                    "is_active": exam.is_active,
                },
            },
            status=status.HTTP_201_CREATED,
        )
        
class UserExamCreateAPIView(APIView):
    """
    Assign exam to user / create user_exam entry
    """
    permission_classes = [IsSuperAdmin | IsAdmin | IsCounsellor]

    def post(self, request):
        serializer = UserExamCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_exam = serializer.save()

        if user_exam.status == "completed":
            user_exam.completed_at = timezone.now()
            user_exam.approved_by = request.user
            user_exam.save()

        return Response(
            {
                "success": True,
                "message": "Exam assigned to user successfully",
                "data": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )
        
# POST /student-exams/start
class StartExamAPIView(APIView):
    def post(self, request):
        user_id = request.user.id
        exam_id = request.data.get("exam_id")

        exam = get_object_or_404(Exam, id=exam_id)

        user_exam, created = UserExam.objects.get_or_create(
            user_id=user_id, exam=exam,
            defaults={'status': 'in_progress'}
        )

        if not created:
            return Response({"message": "Exam already started"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = UserExamCreateSerializer(user_exam)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# POST /student-exams/submit
class SubmitExamAPIView(APIView):
    def post(self, request):
        exam_id = request.data.get("exam_id")
        user_exam = get_object_or_404(UserExam, user=request.user, exam_id=exam_id)

        if user_exam.status != "in_progress":
            return Response({"message": "Exam not in progress"}, status=status.HTTP_400_BAD_REQUEST)

        user_exam.status = "pending_approval"
        user_exam.completed_at = request.data.get("completed_at")
        user_exam.save()

        serializer = UserExamCreateSerializer(user_exam)
        return Response(serializer.data, status=status.HTTP_200_OK)


# PATCH /student-exams/{exam_id}/approve
class ApproveExamAPIView(APIView):
    def patch(self, request, exam_id):
        approved_by_id = request.data.get("approved_by_id")
        user_exam = get_object_or_404(UserExam, exam_id=exam_id)
        approved_by = get_object_or_404(User, id=approved_by_id)

        user_exam.status = "completed"
        user_exam.approved_by = approved_by
        user_exam.save()

        serializer = UserExamCreateSerializer(user_exam)
        return Response(serializer.data, status=status.HTTP_200_OK)


# PATCH /student-exams/{exam_id}/override
class OverrideExamAPIView(APIView):
    def patch(self, request, exam_id):
        status_value = request.data.get("status")
        if status_value not in dict(UserExam.STATUS_CHOICES):
            return Response({"message": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)

        user_exam = get_object_or_404(UserExam, exam_id=exam_id)
        user_exam.status = status_value
        user_exam.save()

        serializer = UserExamCreateSerializer(user_exam)
        return Response(serializer.data, status=status.HTTP_200_OK)


# GET /students/{student_id}/exams
class StudentExamsAPIView(APIView):
    def get(self, request, student_id):
        user_exam_qs = UserExam.objects.filter(user_id=student_id)
        serializer = UserExamCreateSerializer(user_exam_qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
 
    
class AddExamToPackageAPIView(APIView):
    """
    POST  -> Create exam + assign to package
    GET   -> List package exams
    PUT   -> Update exam + package exam mapping
    """
    permission_classes = [
        IsSuperAdmin | IsAdmin | IsCounsellor
    ]

    # 🔹 GET – list exams
    # def get(self, request):
    #     package_id = request.query_params.get("package")

    #     qs = (
    #         PackageExam.objects
    #         .select_related("exam", "package__program")
    #         .order_by("sequence_order")
    #     )

    #     if package_id:
    #         qs = qs.filter(package_id=package_id)

    #     serializer = PackageExamResponseSerializer(qs, many=True)
    #     return Response(serializer.data, status=status.HTTP_200_OK)
    
    

    def get(self, request):
        # ✅ Auto-create defaults first
        create_default_exams_for_all_packages()

        # 🔹 Return all package exams
        qs = PackageExam.objects.select_related("exam", "package__program").order_by("sequence_order")
        serializer = PackageExamResponseSerializer(qs, many=True)
        return Response(serializer.data, status=200)


    # 🔹 POST – create
    def post(self, request):
        serializer = PackageExamCreateSerializer(data=request.data)
        if serializer.is_valid():
            package_exam = serializer.save()
            return Response(
                {
                    "message": "Exam created and added to package successfully",
                    "exam_id": package_exam.exam.id,
                    "package_exam_id": package_exam.id
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            {
                "message": "Validation error",
                "errors": serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # 🔹 PUT – update
    def put(self, request, pk=None):
        if not pk:
            return Response(
                {"message": "PackageExam ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        package_exam = get_object_or_404(PackageExam, id=pk)
        serializer = PackageExamUpdateSerializer(
            package_exam, data=request.data, partial=True
        )

        if serializer.is_valid():
            updated = serializer.save()
            response_serializer = PackageExamResponseSerializer(updated)
            return Response(
                {
                    "message": "Package exam updated successfully",
                    "data": response_serializer.data
                },
                status=status.HTTP_200_OK
            )

        return Response(
            {"errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
        
class UserExamListAPIView(APIView):
    permission_classes = [
        IsSuperAdmin | IsAdmin | IsCounsellor
    ]

    def get(self, request):
        user_exams = (
            UserExam.objects
            .select_related("user", "exam", "approved_by")
            .order_by("-created_at")
        )

        serializer = UserExamListSerializer(user_exams, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ApproveUserExamAPIView(APIView):
    """
    Approve a user exam only if exam is successfully completed.
    On approval, initialize a Report entry (without upload info).
    """
    permission_classes = [
        IsSuperAdmin | IsAdmin | IsCounsellor
    ]

    def post(self, request, pk):
        user_exam = get_object_or_404(UserExam, id=pk)

        # 🔴 Already completed
        if user_exam.status == "completed":
            return Response(
                {"message": "Exam already approved"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 🔴 Not eligible
        ALLOWED_STATUSES = ["submitted", "pending_approval", "in_progress"]

        if user_exam.status not in ALLOWED_STATUSES:
            return Response(
                {
                    "message": "Exam is not eligible for approval",
                    "current_status": user_exam.status
                },
                status=status.HTTP_400_BAD_REQUEST
            )


        # ✅ APPROVE EXAM
        user_exam.status = "completed"
        user_exam.approved_by = request.user
        user_exam.completed_at = timezone.now()
        user_exam.save()

        # ✅ INITIALIZE REPORT (NO UPLOAD INFO)
        report, created = Report.objects.get_or_create(
            user=user_exam.user,
            exam=user_exam.exam,
            defaults={
                "report_status": "pending_uploaded",
                "review_required": False,
            }
        )

        serializer = UserExamApproveResponseSerializer(user_exam)

        return Response(
            {
                "message": "Exam approved successfully and report entry created",
                "data": serializer.data,
                "report_id": report.id
            },
            status=status.HTTP_200_OK
        )

        
class RejectUserExamAPIView(APIView):
    """
    Reject a user exam and move it back to in_progress
    """
    permission_classes = [
        IsSuperAdmin | IsAdmin | IsCounsellor 
    ]

    def post(self, request, pk):
        user_exam = get_object_or_404(UserExam, id=pk)

        # 🔴 Already in progress
        if user_exam.status == "in_progress":
            return Response(
                {"message": "Exam is already in progress"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 🔴 Not eligible
        ALLOWED_STATUSES = ["submitted", "pending_approval", "completed"]

        if user_exam.status not in ALLOWED_STATUSES:
            return Response(
                {
                    "message": "Exam is not eligible for approval",
                    "current_status": user_exam.status
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ❌ REJECT
        user_exam.status = "in_progress"
        user_exam.rejected_by = request.user  # optional field
        user_exam.rejected_at = timezone.now()  # optional field
        user_exam.save()

        serializer = UserExamApproveResponseSerializer(user_exam)

        return Response(
            {
                "message": "Exam rejected successfully",
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )
