from datetime import timezone
from email.utils import format_datetime
from django.shortcuts import get_object_or_404, render
from counselling_slot.tasks import create_system_notification
from exam.utils import send_exam_approved_email, send_exam_rejected_email
from counselling_slot.models import Booking
from lead_registration.models import StudentProfile
from django.db import transaction
from exam.service import create_default_exams_for_all_packages
from report.models import Report
from rest_framework.views import APIView
from rest_framework.authentication import (TokenAuthentication)
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from django.utils.timezone import is_naive, localtime, make_aware
from django.db.transaction import on_commit
from django.contrib.auth import get_user_model
from accounts.models import User
from accounts.permissions import IsAdmin, IsCounsellor, IsSuperAdmin
from exam.models import CareerFuturaTest, Exam, UserExam
from exam.serializers import ExamCreateSerializer, PackageExamCreateSerializer, PackageExamResponseSerializer, PackageExamUpdateSerializer, SaveCareerFuturaDetailsSerializer, UserExamApproveResponseSerializer, UserExamCreateSerializer, UserExamListSerializer
from rest_framework.response import Response
from rest_framework import status
from django.utils.timezone import now
from urllib.parse import urlencode
from django.http import HttpResponseRedirect

from program_package.models import Package, PackageExam, UserProgramPackage

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

        # 🔹 Only packages with aptitude_test=True
        qs = (
            PackageExam.objects
            .select_related("exam", "package__program")
            .filter(package__aptitude_test=True)
            .order_by("sequence_order")
        )

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


# class ApproveUserExamAPIView(APIView):
#     """
#     Approve a user exam only if eligible.
#     On approval:
#         - Mark exam completed
#         - Create report entry
#         - Initialize booking (if student profile exists)
#     """
#     permission_classes = [IsAuthenticated]

#     @transaction.atomic
#     def post(self, request, pk):

#         user_exam = get_object_or_404(
#             UserExam.objects.select_related("user", "exam"),
#             id=pk
#         )

#         # 🔴 Already completed
#         if user_exam.status == "completed":
#             return Response(
#                 {"message": "Exam already approved"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # 🔴 Not eligible
#         ALLOWED_STATUSES = [ "pending_approval", "in_progress", "not_started"]

#         if user_exam.status not in ALLOWED_STATUSES:
#             return Response(
#                 {
#                     "message": "Exam is not eligible for approval",
#                     "current_status": user_exam.status
#                 },
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # ✅ APPROVE EXAM
#         user_exam.status = "completed"
#         user_exam.approved_by = request.user
#         user_exam.completed_at = timezone.now()
#         user_exam.save()
        
        
#         # Send email notification
#         send_exam_approved_email(
#             user_exam.user,
#             # user_exam.exam.name,
#             user_exam.completed_at
#         )

#         # ✅ CREATE / GET REPORT
#         report, _ = Report.objects.get_or_create(
#             user=user_exam.user,
#             exam=user_exam.exam,
#             defaults={
#                 "report_status": "not_received",
#                 "review_required": False,
#             }
#         )

#         # ✅ CREATE BOOKING (ONLY IF NOT EXISTS)
#         # student_profile = StudentProfile.objects.filter(
#         #     user=user_exam.user
#         # ).first()

#         # if student_profile:
#         #     Booking.objects.get_or_create(
#         #         student=student_profile,
#         #         defaults={
#         #             "status": "not_booked",
#         #         }
#         #     )

#         serializer = UserExamApproveResponseSerializer(user_exam)

#         return Response(
#             {
#                 "message": "Exam approved successfully and report entry created",
#                 "data": serializer.data,
#                 "report_id": report.id
#             },
#             status=status.HTTP_200_OK
#         )

class ApproveUserExamAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):

        user_exam = get_object_or_404(
            UserExam.objects.select_related("user", "exam", "program", "package"),
            id=pk
        )
        print("Before save:")
        for exam in UserExam.objects.filter(user=user_exam.user):
            print(
                exam.id,
                exam.program,
                exam.package,
                exam.status
            )

        # 🔴 Already completed
        if user_exam.status == "completed":
            return Response(
                {"message": "Exam already approved"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 🔴 Not eligible
        ALLOWED_STATUSES = ["pending_approval", "in_progress", "not_started"]

        if user_exam.status not in ALLOWED_STATUSES:
            return Response(
                {
                    "message": "Exam is not eligible for approval",
                    "current_status": user_exam.status
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # 🔹 Get description from request
        description = request.data.get("description")

        # ✅ APPROVE EXAM
        user_exam.status = "completed"
        user_exam.description = description
        user_exam.approved_by = request.user
        user_exam.completed_at = timezone.now()
        user_exam.save()
        
        print("After save:")
        for exam in UserExam.objects.filter(user=user_exam.user):
            print(
                exam.id,
                exam.program,
                exam.package,
                exam.status
            )

        # ✅ Send email notification
        send_exam_approved_email(
            user_exam.user,
            user_exam.completed_at,
            description
        )
        
        print("user",user_exam.user.id)
        print("exam",user_exam.exam)

        # ✅ CREATE / GET REPORT
        # report, _ = Report.objects.get_or_create(
        #     user=user_exam.user,
        #     exam=user_exam.exam,
        #     defaults={
        #         "report_status": "not_received",
        #         "review_required": False,
        #     }
        # )
        # Create report using actual UserExam program/package
        report, created = Report.objects.get_or_create(
            user=user_exam.user,
            exam=user_exam.exam,
            program=user_exam.program,
            package=user_exam.package,
            defaults={
                "report_status": "not_received",
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
        ALLOWED_STATUSES = [ "pending_approval", "in_progress", "completed"]

        if user_exam.status not in ALLOWED_STATUSES:
            return Response(
                {
                    "message": "Exam is not eligible for approval",
                    "current_status": user_exam.status
                },
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # 🔹 Get description from request
        description = request.data.get("description")
        
        # ✅ store old status
        old_status = user_exam.status

        # ❌ REJECT
        user_exam.status = "in_progress"
        user_exam.description = description
        user_exam.rejected_by = request.user  # optional field
        user_exam.rejected_at = timezone.now()  # optional field
        
        # ✅ FIX: check old status, not current
        if old_status == "completed":
            user_exam.completed_at = None
            user_exam.approved_by = None
                        
        user_exam.save()
        
        # Send email notification
        send_exam_rejected_email(
            user_exam.user,
            # user_exam.exam.name,
            user_exam.rejected_at
        )

        serializer = UserExamApproveResponseSerializer(user_exam)

        return Response(
            {
                "message": "Exam rejected successfully",
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )

def safe_notify(admin_id, title, message):
    try:
        # ✅ Try Celery async
        create_system_notification.delay(admin_id, title, message)
    except Exception as e:
        print("❌ Celery failed, fallback to sync:", str(e))
        try:
            # ✅ Fallback (direct call)
            create_system_notification(admin_id, title, message)
        except Exception as inner_e:
            print("❌ Sync notification failed:", str(inner_e))                                                                                                                                                                                         

class UpdateExamToPendingApprovalAPIView(APIView):
    """
    Update student's latest exam status to pending_approval
    using student_id
    """

    permission_classes = [IsAuthenticated]

    # def post(self, request, student_id):

    #     student = get_object_or_404(StudentProfile, id=student_id)
    #     user = student.user

    #     # 🔹 Get latest completed exam
    #     user_exam = UserExam.objects.filter(
    #         user=user,
    #         status__in=["in_progress", "not_started"]
    #     ).order_by("-created_at").first()

    #     if not user_exam:
    #         return Response(
    #             {"message": "No in_progress exam found for this student"},
    #             status=status.HTTP_404_NOT_FOUND
    #         )

    #     # 🔹 Update status
    #     user_exam.status = "pending_approval"
    #     user_exam.save()
        
    #     # =========================
    #     # 🔔 SEND NOTIFICATION TO SUPERADMIN
    #     # =========================
    #     User = get_user_model()

    #     student_name = f"{user.first_name} {user.last_name}"
    #     exam_name = user_exam.exam.name if user_exam.exam else "Exam"

    #     title = "Exam Approval Request"

    #     message = (
    #         f"Student {student_name} has requested approval "
    #         f"for exam '{exam_name}'."
    #     )

    #     admin_users = User.objects.filter(is_superuser=True)

    #     for admin in admin_users:
    #         admin_id = admin.id  # ✅ fix lambda issue

    #         on_commit(lambda admin_id=admin_id: create_system_notification.delay(
    #             admin_id,
    #             title,
    #             message
    #         ))

    #     return Response(
    #         {
    #             "message": "Exam status updated to pending approval",
    #             "student_id": student.id,
    #             "exam_id": user_exam.id,
    #             "status": user_exam.status
    #         },
    #         status=status.HTTP_200_OK
    #     )
    def post(self, request, student_id):

        student = get_object_or_404(StudentProfile, id=student_id)
        user = student.user

        # 🔹 Get latest exam
        user_exam = UserExam.objects.filter(
            user=user,
            status__in=["in_progress", "not_started"]
        ).order_by("-created_at").first()

        if not user_exam:
            return Response(
                {"message": "No in_progress exam found for this student"},
                status=status.HTTP_404_NOT_FOUND
            )

        # 🔹 Update status
        user_exam.status = "pending_approval"
        user_exam.save()

        # =========================
        # 🔔 SEND NOTIFICATION TO SUPERADMIN (SAFE)
        # =========================
        User = get_user_model()

        student_name = f"{user.first_name} {user.last_name}"
        exam_name = user_exam.exam.name if user_exam.exam else "Exam"

        title = "Exam Approval Request"
        message = f"Student {student_name} has requested approval for exam '{exam_name}'."

        admin_users = User.objects.filter(is_superuser=True)

        for admin in admin_users:
            admin_id = admin.id

            print(f"DEBUG: Sending exam notification to admin_id={admin_id}")

            # ✅ SAFE CALL (no crash)
            on_commit(lambda admin_id=admin_id: safe_notify(
                admin_id,
                title,
                message
            ))

        return Response(
            {
                "message": "Exam status updated to pending approval",
                "student_id": student.id,
                "exam_id": user_exam.id,
                "status": user_exam.status
            },
            status=status.HTTP_200_OK
        ) 
        
     
        
class StartExamAPIView(APIView):
    """
    Update student's latest exam status to 'in_progress'
    if current status is 'not_started'.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, student_id):

        # 🔹 Get student profile
        student = get_object_or_404(StudentProfile, id=student_id)
        user = student.user
        
        program_id = request.query_params.get("program_id")
        package_id = request.query_params.get("package_id")

        if not program_id or not package_id:
            return Response(
                {"message": "program_id and package_id are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 🔹 Get latest exam with allowed statuses
        user_exam = UserExam.objects.filter(
            user=user,
            program_id=program_id,
            package_id=package_id,
            status__in=["not_started"]
        ).order_by("-created_at").first()

        if not user_exam:
            return Response(
                {"message": "No not_started exam found for this student"},
                status=status.HTTP_404_NOT_FOUND
            )

        # 🔹 Update status
        user_exam.status = "in_progress"
        user_exam.save()

        return Response(
            {
                "message": "Exam started successfully",
                "student_id": student.id,
                "exam_id": user_exam.id,
                "status": user_exam.status
            },
            status=status.HTTP_200_OK
        )
        
class FetchStudentExamStatusAPIView(APIView):
    """
    Fetch the latest exam status for a student using student_id.
    """

    permission_classes = [IsAuthenticated]

    # def get(self, request, student_id):

    #     # 🔹 Get student profile
    #     student = get_object_or_404(StudentProfile, id=student_id)
    #     user = student.user

    #     # 🔹 Get latest exam
    #     user_exam = UserExam.objects.filter(
    #         user=user
    #     ).order_by("-created_at").first()

    #     if not user_exam:
    #         return Response(
    #             {"message": "No exam found for this student"},
    #             status=status.HTTP_404_NOT_FOUND
    #         )

    #     return Response(
    #         {
    #             "student_id": student.id,
    #             "exam_id": user_exam.id,
    #             "status": user_exam.status,
    #             "description": user_exam.description,
    #             # "completed_at": user_exam.completed_at,
    #             "created_at": user_exam.created_at
    #         },
    #         status=status.HTTP_200_OK
    #     )
    
    def get(self, request, student_id):

        student = get_object_or_404(StudentProfile, id=student_id)
        user = student.user

        program_id = request.query_params.get("program_id")
        package_id = request.query_params.get("package_id")

        if not program_id or not package_id:
            return Response(
                {"message": "program_id and package_id are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user_exam = (
            UserExam.objects.filter(
                user=user,
                program_id=program_id,
                package_id=package_id
            )
            .order_by("-created_at")
            .first()
        )

        if not user_exam:
            return Response(
                {"message": "No exam found for this program/package"},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response({
            "student_id": student.id,
            "exam_id": user_exam.id,
            "program_id": user_exam.program_id,
            "package_id": user_exam.package_id,
            "status": user_exam.status,
            "description": user_exam.description,
            "created_at": user_exam.created_at
        }, status=status.HTTP_200_OK)
            
class ExamTrackerAPIView(APIView):

    permission_classes = [IsAuthenticated]
    
    def format_datetime(dt):
        if dt is None:
            return None

        if is_naive(dt):
            dt = make_aware(dt)

        return localtime(dt).strftime("%Y-%m-%d %H:%M")

    # def get(self, request, student_id):

        student = get_object_or_404(StudentProfile, id=student_id)
        user = student.user

        user_exam = (
            UserExam.objects
            .filter(user=user)
            .order_by("-created_at")
            .first()
        )

        if not user_exam:
            return Response(
                {"message": "No exam record found for this student"},
                status=status.HTTP_404_NOT_FOUND
            )

        status_value = user_exam.status

        # ✅ Progressive Step Logic
        exam_started_status = status_value in [
            "in_progress", "pending_approval", "received_unlocked", "completed"
        ]

        exam_submitted_status = status_value in [
            "pending_approval", "received_unlocked", "completed"
        ]
        awaiting_approval_status = status_value in [
            "received_unlocked", "completed"
        ]

         # ✅ Get actual report record
        report = Report.objects.filter(
            user=user,
            exam=user_exam.exam
        ).order_by("-uploaded_at").first()

        report_status_value = report.report_status if report else None

        report_generation_status = report_status_value in ["received_locked", "received_unlocked", "not_received"]

        return Response({
            "student_id": student_id,
            "exam_started": {
                "status": exam_started_status,
                "date": format_datetime(user_exam.created_at) if exam_started_status else None
            },
            "exam_submitted": {
                "status": exam_submitted_status,
                "date": format_datetime(user_exam.completed_at) if exam_submitted_status and user_exam.completed_at else None
            },
            "awaiting_approval": {
                "status": awaiting_approval_status
            },
            "report_generation": {
                "status": report_generation_status,
                "report_status": report_status_value
            }
        })
        
    def get(self, request, student_id):

        student = get_object_or_404(StudentProfile, id=student_id)
        user = student.user

        # 🔥 REQUIRED INPUTS
        program_id = request.query_params.get("program_id")
        package_id = request.query_params.get("package_id")

        if not program_id or not package_id:
            return Response(
                {"message": "program_id and package_id are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # =========================
        # 1. USER EXAM (STRICT FILTER)
        # =========================
        user_exam = (
            UserExam.objects
            .filter(
                user=user,
                program_id=program_id,
                package_id=package_id
            )
            .order_by("-created_at")   # still safe for multiple attempts
            .first()
        )

        if not user_exam:
            return Response(
                {"message": "No exam found for this program/package"},
                status=status.HTTP_404_NOT_FOUND
            )

        # =========================
        # 2. REPORT (STRICT FILTER)
        # =========================
        report = (
            Report.objects
            .filter(
                user=user,
                program_id=program_id,
                package_id=package_id
            )
            .order_by("-uploaded_at")
            .first()
        )

        status_value = user_exam.status

        exam_started_status = status_value in [
            "in_progress", "pending_approval", "received_unlocked", "completed"
        ]

        exam_submitted_status = status_value in [
            "pending_approval", "received_unlocked", "completed"
        ]

        awaiting_approval_status = status_value in [
            "received_unlocked", "completed"
        ]

        report_status_value = report.report_status if report else None

        report_generation_status = report_status_value in [
            "received_locked", "received_unlocked", "not_received"
        ]

        return Response({
            "student_id": student_id,
            "program_id": program_id,
            "package_id": package_id,

            "exam_started": {
                "status": exam_started_status,
                "date": format_datetime(user_exam.created_at)
            },
            "exam_submitted": {
                "status": exam_submitted_status,
                "date": format_datetime(user_exam.completed_at) if user_exam.completed_at else None
            },
            "awaiting_approval": {
                "status": awaiting_approval_status
            },
            "report_generation": {
                "status": report_generation_status,
                "report_status": report_status_value
            }
        })
        
# class SaveCareerFuturaDetailsAPIView(APIView):

#     @transaction.atomic
#     def post(self, request, student_id):

#         serializer = SaveCareerFuturaDetailsSerializer(
#             data=request.data
#         )

#         serializer.is_valid(raise_exception=True)

#         student = get_object_or_404(
#             StudentProfile.objects.select_related("user"),
#             id=student_id
#         )

#         user = student.user
#         data = serializer.validated_data

#         # -------------------------------
#         # Update User
#         # -------------------------------

#         user.first_name = data["first_name"]
#         user.last_name = data.get("last_name", "")
#         user.email = data["email"]
#         user.phone = data["phone"]

#         # Store original password
#         user.original_password = data["password"]

#         # Store hashed password
#         user.set_password(data["password"])

#         user.save()

#         # -------------------------------
#         # Update Student Profile
#         # -------------------------------

#         student.study_class = data["study_class"]
#         student.qualification_status = data["qualification_status"]
#         student.type = data["type"]

#         student.save()
        
#         # -------------------------------
#         # Save CareerFutura Test Details
#         # -------------------------------

#         CareerFuturaTest.objects.create(
#             student=student,
#             first_name=data["first_name"],
#             last_name=data.get("last_name", ""),
#             email=data["email"],
#             phone=data["phone"],
#             password=data["password"],
#         )

#         return Response(
#             {
#                 "message": "Student details saved successfully."
#             },
#             status=status.HTTP_200_OK
#         )        
 
class SaveCareerFuturaDetailsAPIView(APIView):

    @transaction.atomic
    def post(self, request, student_id):

        serializer = SaveCareerFuturaDetailsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        student = get_object_or_404(StudentProfile, id=student_id)

        data = serializer.validated_data

        # Save only in CareerFuturaTest model
        CareerFuturaTest.objects.create(
            student=student,
            first_name=data["first_name"],
            last_name=data.get("last_name", ""),
            email=data["email"],
            phone=data["phone"],
            password=data["password"],
            study_class=data["study_class"],
            qualification_status=data["qualification_status"],
            type=data["type"],
        )

        return Response(
            {
                "message": "CareerFutura details saved successfully.",
                "test_id": CareerFuturaTest.objects.filter(student=student).latest('id').id
            },
            status=status.HTTP_201_CREATED
        ) 
        
        
# class LaunchTestAPIView(APIView):

#     def get(self, request, student_id):
#         try:
#             student = StudentProfile.objects.select_related("user").get(id=student_id)
#             user = student.user

#             missing_fields = []

#             if not user.first_name:
#                 missing_fields.append("name")

#             if not user.email:
#                 missing_fields.append("email")

#             if not user.original_password:
#                 missing_fields.append("original_password")

#             if not user.phone:
#                 missing_fields.append("phone")

#             if not student.study_class:
#                 missing_fields.append("study_class")

#             if not student.qualification_status:
#                 missing_fields.append("qualification_status")

#             if not student.type:
#                 missing_fields.append("type")

#             if missing_fields:
#                 return Response(
#                     {
#                         "message": "Required fields are missing.",
#                         "missing_fields": missing_fields
#                     },
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             params = {
#                 "id": "1090",               # Fixed ID
#                 "pass": "Uxor2kwB",         # Fixed Pass
#                 "name": user.first_name,
#                 "email": user.email,
#                 "passw": user.original_password,
#                 "mob": user.phone,
#                 "qual": student.study_class,
#                 "qual_status": student.qualification_status,
#                 "type": student.type,
#             }

#             url = (
#                 "http://www.careerfutura.com/business-associate-link?"
#                 + urlencode(params)
#             )
            
#             # return HttpResponseRedirect(url)

#             return Response({
#                 "url": url
#             })

#         except StudentProfile.DoesNotExist:
#             return Response(
#                 {"message": "Student not found"},
#                 status=status.HTTP_404_NOT_FOUND
#             )

class LaunchTestAPIView(APIView):

    def get(self, request, student_id, test_id):
        try:
            student = StudentProfile.objects.get(id=student_id)

            test = CareerFuturaTest.objects.get(
                id=test_id,
                student=student
            )

            params = {
                "id": "1090",
                "pass": "Uxor2kwB",
                "name": test.first_name,
                "email": test.email,
                "passw": test.password,
                "mob": test.phone,
                "qual": test.study_class,
                "qual_status": test.qualification_status,
                "type": test.type,
            }

            url = (
                f"http://www.careerfutura.com/business-associate-link?"
                f"id=1090"
                f"&&pass=Uxor2kwB"
                f"&&name={test.first_name}"
                f"&&email={test.email}"
                f"&&passw={test.password}"
                f"&&mob={test.phone}"
                f"&&qual={test.study_class}"
                f"&&qual_status={test.qualification_status}"
                f"&&type={test.type}"
            )

            return Response({"url": url})

        except StudentProfile.DoesNotExist:
            return Response(
                {"message": "Student not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        except CareerFuturaTest.DoesNotExist:
            return Response(
                {"message": "CareerFutura test details not found"},
                status=status.HTTP_404_NOT_FOUND
            )




        
        