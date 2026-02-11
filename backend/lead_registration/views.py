import random
import string
from urllib import request
from xml.parsers.expat import errors
from django.shortcuts import get_object_or_404, render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from django.db import IntegrityError, transaction
from django.contrib.auth.hashers import make_password
import logging
from accounts.constants import PROGRAM_PREFIX_MAP

from accounts.models import Role, User
from accounts.permissions import IsAdmin, IsSuperAdmin
from accounts.services.whatsapp_service import send_whatsapp_message, send_whatsapp_otp
from accounts.utils import generate_otp, generate_password, generate_role_id, send_credentials_email, send_otp_email
from exam.models import UserExam
from lead_registration.models import Hobby, Lead, ParentProfile, Stream, StudentAcademicHistory, StudentHobby, StudentProfile, StudentStream, StudentSubjectPreference, Subject
from lead_registration.serializers import AddUserSerializer, HobbySerializer, LeadSerializer, ParentDetailSerializer, PaymentDetailSerializer, StreamSerializer, StudentAcademicHistorySerializer, StudentHobbySerializer, StudentProfileDetailSerializer, StudentRegistrationSerializer, StudentStreamSerializer, StudentSubjectPreferenceSerializer, SubjectSerializer, UserDetailSerializer, UserProgramPackageDetailSerializer, UserProgramPackageResponseSerializer
from payment.models import Payment, PaymentLog
from program_package.models import UserProgramPackage
from report.models import Report


logger = logging.getLogger('lead_registration')

# # class StudentRegisterAPIView(APIView):
# #     permission_classes = [AllowAny]

# #     @transaction.atomic
# #     def post(self, request):
# #         data = request.data

# #         email = data.get("email")
# #         password = data.get("password")

# #         # -----------------------------
# #         # 1. REQUIRED VALIDATION
# #         # -----------------------------
# #         if not email or not password:
# #             return Response(
# #                 {"error": "Email and password are required"},
# #                 status=400
# #             )

# #         if User.objects.filter(email=email).exists():
# #             return Response(
# #                 {"error": "Email already registered"},
# #                 status=400
# #             )

# #         # -----------------------------
# #         # 2. GET STUDENT ROLE
# #         # -----------------------------
# #         try:
# #             student_role = Role.objects.get(name="student")
# #         except Role.DoesNotExist:
# #             return Response(
# #                 {"error": "Student role not configured"},
# #                 status=500
# #             )

# #         # -----------------------------
# #         # 3. GENERATE STUDENT USER ID
# #         # -----------------------------
# #         student_public_id = generate_role_id(
# #             "student",
# #             User,
# #             "public_id"
# #         )

# #         # -----------------------------
# #         # 4. CREATE USER
# #         # -----------------------------
# #         user = User.objects.create_user(
# #             email=email,
# #             password=password,
# #             role=student_role,
# #             public_id=student_public_id,  # 👈 AUTO ID
# #             first_name=data.get("first_name"),
# #             last_name=data.get("last_name"),
# #             phone=data.get("phone"),
# #             is_active=True
# #         )

# #         # -----------------------------
# #         # 5. CREATE STUDENT PROFILE
# #         # -----------------------------
# #         StudentProfile.objects.create(
# #             user=user,
# #             parent_id=data.get("parent_id"),
# #             study_class=data.get("study_class"),
# #             current_academic_stage=data.get("current_academic_stage"),
# #             current_academic_year=data.get("current_academic_year"),
# #             school_college=data.get("school_college"),
# #             city=data.get("city")
# #         )

# #         return Response({
# #             "message": "Student registered successfully",
# #             "student_id": user.public_id,
# #             "email": user.email
# #         }, status=201)



# class ParentSendOTPAPIView(APIView):
#     permission_classes = [AllowAny]

#     def post(self, request):
#         phone = request.data.get("phone")

#         if not phone:
#             return Response(
#                 {"error": "Phone number is required"},
#                 status=400
#             )

#         # -----------------------------
#         # 1. GET PARENT ROLE (SAFE)
#         # -----------------------------
#         parent_role = Role.objects.filter(name="parent").first()
#         if not parent_role:
#             return Response(
#                 {"error": "Parent role not configured"},
#                 status=500
#             )

#         try:
#             # -----------------------------
#             # 2. FIND OR CREATE USER
#             # -----------------------------
#             parent_user = User.objects.filter(
#                 phone=phone,
#                 role=parent_role
#             ).first()

#             if not parent_user:
#                 # ✅ Extra safety check
#                 if User.objects.filter(phone=phone).exists():
#                     return Response(
#                         {"error": "Phone number already registered"},
#                         status=400
#                     )

#                 parent_user = User.objects.create(
#                     phone=phone,
#                     role=parent_role,
#                     is_active=False
#                 )

#             # -----------------------------
#             # 3. FIND OR CREATE PROFILE
#             # -----------------------------
#             parent_profile, _ = ParentProfile.objects.get_or_create(
#                 user=parent_user
#             )

#             # -----------------------------
#             # 4. GENERATE & SAVE OTP
#             # -----------------------------
#             otp = generate_otp()
#             parent_profile.set_otp(otp)

#             # -----------------------------
#             # 5. SEND OTP
#             # -----------------------------
#             send_whatsapp_otp(phone, otp)

#             return Response({
#                 "message": "OTP sent successfully on WhatsApp",
#                 "phone": phone
#             }, status=200)

#         except IntegrityError:
#             return Response(
#                 {"error": "Phone number already exists"},
#                 status=400
#             )
    
        
# class ParentVerifyOTPAPIView(APIView):
#     permission_classes = [AllowAny]

#     @transaction.atomic
#     def post(self, request):
#         data = request.data

#         phone = data.get("phone")
#         otp = data.get("otp")

#         if not phone or not otp:
#             return Response(
#                 {"error": "Phone and OTP are required"},
#                 status=400
#             )

#         parent_profile = ParentProfile.objects.filter(
#             user__phone=phone
#         ).select_related("user").first()

#         if not parent_profile:
#             return Response(
#                 {"error": "Parent not found"},
#                 status=404
#             )

#         # -----------------------------
#         # 1. VERIFY OTP
#         # -----------------------------
#         if not parent_profile.verify_otp(otp):
#             return Response(
#                 {"error": "Invalid or expired OTP"},
#                 status=400
#             )

#         user = parent_profile.user

#         # -----------------------------
#         # 2. SAVE USER DATA (OPTIONAL)
#         # -----------------------------
#         user.first_name = data.get("first_name", user.first_name)
#         user.last_name = data.get("last_name", user.last_name)
#         user.email = data.get("email", user.email)

#         password = data.get("password")
#         if password:
#             user.set_password(password)

#         # -----------------------------
#         # 3. GENERATE PARENT ID
#         # -----------------------------
#         if not user.public_id:
#             user.public_id = generate_role_id(
#                 "parent",
#                 User,
#                 "public_id"
#             )

#         user.is_active = True
#         user.save()

#         # -----------------------------
#         # 4. SAVE PARENT PROFILE DATA
#         # -----------------------------
#         parent_profile.profession = data.get(
#             "profession",
#             parent_profile.profession
#         )
#         parent_profile.organization_name = data.get(
#             "organization_name",
#             parent_profile.organization_name
#         )
#         parent_profile.education_level = data.get(
#             "education_level",
#             parent_profile.education_level
#         )
#         parent_profile.background = data.get(
#             "background",
#             parent_profile.background
#         )
#         parent_profile.annual_income_range = data.get(
#             "annual_income_range",
#             parent_profile.annual_income_range
#         )
#         parent_profile.expectations_from_student = data.get(
#             "expectations_from_student",
#             parent_profile.expectations_from_student
#         )

#         parent_profile.save()

#         return Response({
#             "message": "OTP verified successfully. Parent registered successfully.",
#             "parent_id": user.public_id,
#             "phone": user.phone,
#             "email": user.email
#         }, status=200)
        

class AddEnquiryAPIView(APIView):
    """
    API to create a new enquiry (POST) and update an existing enquiry (PUT).
    """
    permission_classes = [IsSuperAdmin | IsAdmin]

    def post(self, request):
        try:
            serializer = LeadSerializer(data=request.data)

            if serializer.is_valid():
                lead = serializer.save()

                logger.info(
                    f"New enquiry created | Lead ID: {lead.id} | "
                    f"Name: {lead.first_name} {lead.last_name}"
                )

                return Response(
                    {
                        "message": "Enquiry created successfully",
                        "data": serializer.data
                    },
                    status=status.HTTP_201_CREATED
                )

            logger.warning(
                f"Enquiry validation failed | Errors: {serializer.errors}"
            )

            return Response(
                {
                    "message": "Validation error",
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            logger.error(f"Enquiry creation failed | Error: {str(e)}")

            return Response(
                {
                    "message": "Something went wrong while creating enquiry",
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )  
            
    def put(self, request, pk):
        """
        API to update an existing enquiry using lead ID.
        """
        try:
            try:
                lead = Lead.objects.get(pk=pk)
            except Lead.DoesNotExist:
                return Response(
                    {"message": "Enquiry not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            serializer = LeadSerializer(lead, data=request.data, partial=True) 

            if serializer.is_valid():
                lead = serializer.save()

                logger.info(
                    f"Enquiry updated | Lead ID: {lead.id} | "
                    f"Updated by user: {request.user}"
                )

                return Response(
                    {
                        "message": "Enquiry updated successfully",
                        "data": serializer.data
                    },
                    status=status.HTTP_200_OK
                )

            logger.warning(
                f"Enquiry update validation failed | Lead ID: {pk} | "
                f"Errors: {serializer.errors}"
            )

            return Response(
                {
                    "message": "Validation error",
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            logger.error(
                f"Enquiry update failed | Lead ID: {pk} | Error: {str(e)}"
            )

            return Response(
                {
                    "message": "Something went wrong while updating enquiry",
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    def delete(self, request, pk):
        lead = get_object_or_404(Lead, id=pk)
        lead.delete()

        return Response(
            {"message": "Lead deleted successfully"},
            status=status.HTTP_200_OK
        )
            
  
class LeadListAPIView(APIView):
    """
    API to fetch all leads for lead table.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        print(">>> LeadListAPIView GET HIT <<<")
        try:
            leads = Lead.objects.select_related('program').order_by('-created_at')

            serializer = LeadSerializer(leads, many=True)

            logger.info(f"Leads fetched successfully | Count: {leads.count()}")

            return Response(
                {
                    "message": "Leads fetched successfully",
                    "count": leads.count(),
                    "data": serializer.data
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            logger.error(f"Failed to fetch leads | Error: {str(e)}")

            return Response(
                {
                    "message": "Something went wrong while fetching leads",
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
            
class AddUserAPIView(APIView):
     
    """
    Creates a new student user with profile details, assigns a program and package,
    generates login credentials, and sends them via email.
    Only accessible to Admin and Super Admin users.
    """
    
    permission_classes = [IsAdmin | IsSuperAdmin]

    def post(self, request):
        serializer = AddUserSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    "message": "Validation error",
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():

                # 🔹 Role & password
                student_role = Role.objects.get(name="student")
                password = generate_password()

                # 🔹 Create user
                # 🔹 Program-based prefix logic
                program = serializer.validated_data["program"]
                program_name = program.name

                prefix = PROGRAM_PREFIX_MAP.get(program_name)

                original_first_name = serializer.validated_data["first_name"]

                # Avoid double prefix
                if prefix and not original_first_name.startswith(prefix):
                    final_first_name = f"{prefix} - {original_first_name}"
                else:
                    final_first_name = original_first_name

                # 🔹 Create user with prefixed name
                user = User.objects.create(
                    first_name=final_first_name,
                    last_name=serializer.validated_data["last_name"],
                    email=serializer.validated_data["email"],
                    phone=serializer.validated_data.get("phone") or None,
                    role=student_role,
                    is_active=True
                )
                user.set_password(password)
                user.save()


                # 🔹 Create student profile
                StudentProfile.objects.create(
                    user=user,
                    study_class=serializer.validated_data.get("study_class"),
                    current_academic_stage=serializer.validated_data.get("current_academic_stage"),
                    current_academic_year=serializer.validated_data.get("current_academic_year"),
                    school_college=serializer.validated_data.get("school_college"),
                    city=serializer.validated_data.get("city"),
                    preferred_counselling_mode=serializer.validated_data.get(
                        "preferred_counselling_mode"
                    ),
                )

                # 🔹 Assign program & package
                upp = UserProgramPackage.objects.create(
                    user=user,
                    program=serializer.validated_data["program"],
                    package=serializer.validated_data["package"],
                    assigned_by=request.user.email
                )

                # 🔹 Create payment (OPTIONAL)
                payment = None
                amount = serializer.validated_data.get("amount")
                proof_file = serializer.validated_data.get("proof_file")

                if amount is not None or proof_file:
                    payment = Payment.objects.create(
                        user=user,
                        package=serializer.validated_data["package"],
                        amount=amount,
                        payment_type=serializer.validated_data.get("payment_type"),
                        method=serializer.validated_data.get("method"),
                        transaction_id=serializer.validated_data.get("transaction_id"),
                        proof_file=proof_file,
                        status="verification_pending"
                    )

                # 🔹 Send credentials email
                try:
                    send_credentials_email(user.email, password)
                except Exception as e:
                    print("Email sending failed:", e)

                # 🔹 Prepare response
                response_data = UserProgramPackageResponseSerializer(upp).data

                payment_data = None
                if payment:
                    proof_url = None

                    if payment.proof_file:
                        proof_url = request.build_absolute_uri(
                            payment.proof_file.url
                        )

                    payment_data = {
                        "payment_id": payment.id,
                        "amount": payment.amount,
                        "payment_type": payment.payment_type,
                        "method": payment.method,
                        "transaction_id": payment.transaction_id,
                        "proof_file": proof_url,   # ✅ safe
                        "status": payment.status,
                        "created_at": payment.created_at
                    }


                return Response(
                    {
                        "message": "Student created successfully and credentials sent via email",
                        "data": {
                            "id": user.id,
                            "first_name": user.first_name,
                            "last_name": user.last_name,
                            "study_class": serializer.validated_data.get("study_class"),
                            "email": user.email,
                            "phone": user.phone,
                            "program": response_data["program"],
                            "package": response_data["package"],
                            "payment": payment_data
                        }
                    },
                    status=status.HTTP_201_CREATED
                )

        except IntegrityError as e:
            error = str(e).lower()

            errors = []

            if "email" in error:
                errors.append("Email already exists.")

            if "phone" in error:
                errors.append("Phone number already exists.")

            if "transaction_id" in error:
                errors.append("Transaction ID already exists.")

            if not errors:
                errors.append(str(e))

        

            return Response(
                {
                    "message": "Duplicate entry",
                    "errors": errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )


        except Exception as e:
            return Response(
                {
                    "message": "Something went wrong while adding student",
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    
    

    def put(self, request, id):
        """
        Update student using StudentProfile ID
        """
        profile = get_object_or_404(StudentProfile, id=id)
        user = profile.user

        serializer = AddUserSerializer(
            data=request.data,
            partial=True,
            context={"user_id": user.id}
        )

        if not serializer.is_valid():
            return Response(
                {
                    "message": "Validation error",
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():

                # 🔹 Get updated program (if provided)
                program = serializer.validated_data.get("program")
                new_first_name = serializer.validated_data.get("first_name", user.first_name)

                if program:
                    program_name = program.name
                    prefix = PROGRAM_PREFIX_MAP.get(program_name)

                    # 🔹 Remove old prefix if exists
                    if " - " in new_first_name:
                        new_first_name = new_first_name.split(" - ", 1)[1]

                    # 🔹 Apply new prefix
                    if prefix:
                        new_first_name = f"{prefix} - {new_first_name}"

                # 🔹 Update User fields
                user.first_name = new_first_name
                user.last_name = serializer.validated_data.get("last_name", user.last_name)
                user.email = serializer.validated_data.get("email", user.email)
                user.phone = serializer.validated_data.get("phone") or user.phone
                user.save()

                # 🔹 Update StudentProfile
                profile.study_class = serializer.validated_data.get("study_class", profile.study_class)
                profile.current_academic_stage = serializer.validated_data.get(
                    "current_academic_stage", profile.current_academic_stage
                )
                profile.current_academic_year = serializer.validated_data.get(
                    "current_academic_year", profile.current_academic_year
                )
                profile.school_college = serializer.validated_data.get(
                    "school_college", profile.school_college
                )
                profile.city = serializer.validated_data.get("city", profile.city)
                profile.save()

                # 🔹 Update Program / Package
                package = serializer.validated_data.get("package")

                upp = UserProgramPackage.objects.filter(user=user).last()
                if upp and (program or package):
                    upp.program = program or upp.program
                    upp.package = package or upp.package
                    upp.assigned_by = request.user.email
                    upp.save()

            response_data = (
                UserProgramPackageResponseSerializer(upp).data if upp else None
            )
            
            # 🔹 Fetch proof file
            proof_file = request.FILES.get("proof_file")
            
            # 🔹 Fetch latest payment
            payment = Payment.objects.filter(user=user).order_by("-created_at").first()

            if payment and proof_file:
                payment.proof_file = proof_file
                payment.status = "verification_pending"
                payment.save()
            payment_data = None

            if payment:
                proof_url = None
                if payment.proof_file:
                    proof_url = request.build_absolute_uri(payment.proof_file.url)

                payment_data = {
                    "payment_id": payment.id,
                    "amount": payment.amount,
                    "payment_type": payment.payment_type,
                    "method": payment.method,
                    "transaction_id": payment.transaction_id,
                    "proof_file": proof_url,   # ✅ same behavior as POST
                    "status": payment.status,
                    "created_at": payment.created_at
                }



            return Response(
                {
                    "message": "Student updated successfully",
                    "data": {
                        "student_profile_id": profile.id,
                        "user_id": user.id,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                        "email": user.email,
                        "phone": user.phone,
                        "program": response_data["program"] if response_data else None,
                        "package": response_data["package"] if response_data else None,
                         "payment": payment_data 
                    }
                },
                status=status.HTTP_200_OK
            )

        except IntegrityError as e:
            return Response(
                {
                    "message": "Duplicate entry",
                    "errors": ["Email or Phone already exists."]
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            return Response(
                {
                    "message": "Something went wrong while updating student",
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

                                 
class AdminUserFullUpdateAPIView(APIView):
    """
    ONE API to update:
    Payment + Program + Package + Exam + Report
    """

    def put(self, request, user_id):
        data = request.data

        with transaction.atomic():

            # ============================
            # 1️⃣ PAYMENT
            # ============================
            payment_data = data.get("payment")
            if payment_data:
                payment = Payment.objects.select_for_update().get(
                    id=payment_data["payment_id"],
                    user_id=user_id
                )

                old_status = payment.status

                for field in [
                    "status", "amount"
                    # "method",
                    # "payment_type", "transaction_id", "proof_file"
                ]:
                    if field in payment_data:
                        setattr(payment, field, payment_data[field])

                payment.verified_by = request.user
                payment.save()

                PaymentLog.objects.create(
                    payment=payment,
                    old_status=old_status,
                    new_status=payment.status,
                    changed_by=request.user,
                )

            # ============================
            # 2️⃣ PROGRAM + PACKAGE
            # ============================
            # program_data = data.get("program_package")
            # if program_data:
            #     UserProgramPackage.objects.filter(
            #         user_id=user_id
            #     ).delete()

            #     UserProgramPackage.objects.create(
            #         user_id=user_id,
            #         program_id=program_data["program_id"],
            #         package_id=program_data["package_id"],
            #         assigned_by="admin"
            #     )

            # ============================
            # 3️⃣ EXAM
            # ============================
            exam_data = data.get("exam")
            if exam_data:
                UserExam.objects.filter(
                    user_id=user_id,
                    exam_id=exam_data["exam_id"]
                ).update(
                    status=exam_data["status"],
                    approved_by=request.user
                )

            # ============================
            # 4️⃣ REPORT
            # ============================
            report_data = data.get("report")
            if report_data and "is_locked" in report_data:
                Report.objects.filter(user_id=user_id).update(
                    is_locked=report_data["is_locked"]
                )

            # ============================
            # 5️⃣ AUTO RULES
            # ============================
            if payment_data and payment.status == "fully_paid":
                UserExam.objects.filter(user_id=user_id).update(status="completed")
                Report.objects.filter(user_id=user_id).update(is_locked=False)

            if payment_data and payment.status in ["partial_paid", "verification_pending"]:
                Report.objects.filter(user_id=user_id).update(is_locked=True)

        return Response(
            {
                "success": True,
                "message": "User journey updated successfully"
            },
            status=status.HTTP_200_OK,
        )
        

# class ConvertLeadAPIView(APIView):
#     """
#     Convert Lead -> User -> StudentProfile
#     """

#     def post(self, request, lead_id):
#         lead = get_object_or_404(Lead, id=lead_id)

#         # 🚫 Already converted
#         if lead.status == "converted":
#             return Response(
#                 {"message": "Lead already converted"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # 🚫 Email required
#         if not lead.email:
#             return Response(
#                 {"message": "Email is required to convert user"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # 🚫 Duplicate user
#         if User.objects.filter(email=lead.email).exists():
#             return Response(
#                 {"message": "User already exists with this email"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         try:
#             with transaction.atomic():

#                 # 🎓 Get Student Role
#                 student_role = Role.objects.get(name="Student")

#                 # 🔐 Generate Password
#                 raw_password = generate_password()

#                 # 1️⃣ Create User
#                 user = User.objects.create(
#                     first_name=lead.first_name,
#                     last_name=lead.last_name,
#                     email=lead.email,
#                     phone=lead.phone,
#                     role=student_role,
#                     password=make_password(raw_password),
#                     is_active=True
#                 )

#                 # 2️⃣ Create Student Profile
#                 student = StudentProfile.objects.create(
#                     user=user
#                 )

#                 # 3️⃣ Update Lead Status
#                 lead.status = "converted"
#                 lead.save(update_fields=["status"])

#                 # 4️⃣ Send Email
#                 send_credentials_email(lead.email, raw_password)

#                 # 5️⃣ Send WhatsApp (MSG91)
#                 if lead.phone:
#                     try:
#                         send_whatsapp_message(
#                             phone=lead.phone,
#                             email=lead.email,
#                             password=raw_password
#                         )
#                     except Exception as whatsapp_error:
#                         # WhatsApp failure should NOT rollback conversion
#                         print("MSG91 WhatsApp Error:", whatsapp_error)

#                 return Response(
#                     {
#                         "message": "Lead converted successfully",
#                         "data": {
#                             "lead_id": lead.id,
#                             "user_id": user.id,
#                             "student_id": student.id
#                         }
#                     },
#                     status=status.HTTP_201_CREATED
#                 )

#         except Exception as e:
#             return Response(
#                 {
#                     "message": "Conversion failed",
#                     "error": str(e)
#                 },
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )
            
     
#     #  ======================= Student Academic ===============================       


class ConvertLeadAPIView(APIView):
    """
    Convert Lead → User → StudentProfile → Program → Package → Payment
    """

    def post(self, request, lead_id):
        lead = get_object_or_404(Lead, id=lead_id)

        if lead.status == "converted":
            return Response(
                {"message": "Lead already converted"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not lead.email:
            return Response(
                {"message": "Email is required to convert lead"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email=lead.email).exists():
            return Response(
                {"message": "User already exists with this email"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 🔹 Merge lead data + POST data
        payload = request.data.copy()
        payload["first_name"] = lead.first_name
        payload["last_name"] = lead.last_name
        payload["email"] = lead.email
        payload["phone"] = lead.phone

        serializer = AddUserSerializer(data=payload)

        if not serializer.is_valid():
            return Response(
                {
                    "message": "Validation error",
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():

                # 🔹 Role & password
                student_role = Role.objects.get(name="student")
                password = generate_password()

                # 🔹 Program prefix logic
                program = serializer.validated_data["program"]
                prefix = PROGRAM_PREFIX_MAP.get(program.name)

                first_name = serializer.validated_data["first_name"]
                if prefix and not first_name.startswith(prefix):
                    first_name = f"{prefix} - {first_name}"

                # 🔹 Create user
                user = User.objects.create(
                    first_name=first_name,
                    last_name=serializer.validated_data["last_name"],
                    email=serializer.validated_data["email"],
                    phone=serializer.validated_data.get("phone"),
                    role=student_role,
                    is_active=True
                )
                user.set_password(password)
                user.save()

                # 🔹 Create student profile
                StudentProfile.objects.create(
                    user=user,
                    study_class=serializer.validated_data.get("study_class"),
                    current_academic_stage=serializer.validated_data.get("current_academic_stage"),
                    current_academic_year=serializer.validated_data.get("current_academic_year"),
                    school_college=serializer.validated_data.get("school_college"),
                    city=serializer.validated_data.get("city"),
                    preferred_counselling_mode=serializer.validated_data.get(
                        "preferred_counselling_mode"
                    ),
                )

                # 🔹 Assign program & package
                upp = UserProgramPackage.objects.create(
                    user=user,
                    program=serializer.validated_data["program"],
                    package=serializer.validated_data["package"],
                    assigned_by="lead-conversion"
                )

                # 🔹 Payment (optional)
                payment = None
                if serializer.validated_data.get("amount") or serializer.validated_data.get("proof_file"):
                    payment = Payment.objects.create(
                        user=user,
                        package=serializer.validated_data["package"],
                        amount=serializer.validated_data.get("amount"),
                        payment_type=serializer.validated_data.get("payment_type"),
                        method=serializer.validated_data.get("method"),
                        transaction_id=serializer.validated_data.get("transaction_id"),
                        proof_file=serializer.validated_data.get("proof_file"),
                        status="verification_pending"
                    )

                # 🔹 Update lead
                lead.status = "converted"
                lead.save(update_fields=["status"])

                # 🔹 Email
                send_credentials_email(user.email, password)

                # 🔹 WhatsApp (non-blocking)
                if lead.phone:
                    try:
                        send_whatsapp_message(
                            phone=lead.phone,
                            email=lead.email,
                            password=password
                        )
                    except Exception as e:
                        print("WhatsApp error:", e)

                return Response(
                    {
                        "message": "Lead converted successfully",
                        "data": {
                            "user": UserDetailSerializer(user).data,
                            "student_profile": StudentProfileDetailSerializer(StudentProfile).data,
                            "program_package": UserProgramPackageDetailSerializer(upp).data,
                            "payment": (
                                PaymentDetailSerializer(
                                    payment,
                                    context={"request": request}
                                ).data
                                if payment else None
                            )
                        }
                    },
                    status=status.HTTP_201_CREATED
                )

        except Exception as e:
            return Response(
                {
                    "message": "Lead conversion failed",
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )




class StudentAcademicHistoryAPIView(APIView):
    """
    GET  /students/{student_id}/academic-history
    POST /students/{student_id}/academic-history

    NOTE: student_id = StudentProfile.id
    """
    permission_classes = [IsAdmin | IsSuperAdmin]

    def get_student_profile(self, student_id):
        try:
            return StudentProfile.objects.get(id=student_id)
        except StudentProfile.DoesNotExist:
            return None

    def get(self, request, student_id):
        profile = self.get_student_profile(student_id)
        if not profile:
            return Response(
                {"message": "Student profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        history = StudentAcademicHistory.objects.filter(student_profile=profile)
        serializer = StudentAcademicHistorySerializer(history, many=True)

        return Response(
            {
                "success": True,
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )

    def post(self, request, student_id):
        profile = self.get_student_profile(student_id)
        if not profile:
            return Response(
                {"message": "Student profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = StudentAcademicHistorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(student_profile=profile)

            return Response(
                {
                    "success": True,
                    "message": "Academic history added",
                    "data": serializer.data
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            {
                "success": False,
                "errors": serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )


class StudentAcademicHistoryDetailAPIView(APIView):
    """
    PUT /students/{student_id}/academic-history/{history_id}
    """
    permission_classes = [IsAdmin | IsSuperAdmin]

    def get_object(self, student_id, history_id):
        try:
            profile = StudentProfile.objects.get(user__id=student_id)
            return StudentAcademicHistory.objects.get(id=history_id, student_profile=profile)
        except (StudentProfile.DoesNotExist, StudentAcademicHistory.DoesNotExist):
            return None

    def put(self, request, student_id, history_id):
        history = self.get_object(student_id, history_id)
        if not history:
            return Response(
                {"message": "Academic history not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = StudentAcademicHistorySerializer(history, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"success": True, "message": "Academic history updated", "data": serializer.data},
                status=status.HTTP_200_OK
            )

        return Response(
            {"success": False, "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
        
class StreamAPIView(APIView):
    """
    GET  /streams/
    POST /streams/
    """
    def get(self, request):
        streams = Stream.objects.all()
        serializer = StreamSerializer(streams, many=True)
        return Response({"data": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = StreamSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Stream created", "data": serializer.data},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class StudentStreamAPIView(APIView):
    """
        GET /students/{student_id}/streams
        POST /students/{student_id}/streams
    """
    def get(self, request, student_id):
        try:
            profile = StudentProfile.objects.get(id=student_id)
        except StudentProfile.DoesNotExist:
            return Response({"message": "Student not found"}, status=404)

        streams = StudentStream.objects.filter(student_profile=profile)
        serializer = StudentStreamSerializer(streams, many=True)
        return Response({"data": serializer.data}, status=200)

    def post(self, request, student_id):
        try:
            profile = StudentProfile.objects.get(id=student_id)
        except StudentProfile.DoesNotExist:
            return Response({"message": "Student not found"}, status=404)

        serializer = StudentStreamSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(student_profile=profile)
            return Response(
                {"message": "Stream added to student", "data": serializer.data},
                status=201
            )
        return Response(serializer.errors, status=400)
    
class StudentStreamDetailAPIView(APIView):
    """
        DELETE /students/{student_id}/streams/{stream_id}
    """
    def delete(self, request, student_id, stream_id):
        try:
            profile = StudentProfile.objects.get(id=student_id)
            student_stream = StudentStream.objects.get(
                student_profile=profile,
                stream_id=stream_id
            )
            student_stream.delete()
            return Response({"message": "Stream removed"}, status=204)
        except (StudentProfile.DoesNotExist, StudentStream.DoesNotExist):
            return Response({"message": "Not found"}, status=404)
        
class SubjectAPIView(APIView):
    """
        GET /subjects
        POST /subjects
    """
    def get(self, request):
        subjects = Subject.objects.all()
        serializer = SubjectSerializer(subjects, many=True)
        return Response({"data": serializer.data}, status=200)

    def post(self, request):
        serializer = SubjectSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Subject created", "data": serializer.data},
                status=201
            )
        return Response(serializer.errors, status=400)

class StudentSubjectPreferenceAPIView(APIView):
    """
        POST /students/{student_id}/subjects
    """

    def post(self, request, student_id):
        try:
            profile = StudentProfile.objects.get(id=student_id)
        except StudentProfile.DoesNotExist:
            return Response({"message": "Student not found"}, status=404)

        serializer = StudentSubjectPreferenceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(student_profile=profile)
            return Response(
                {"message": "Subject preference added", "data": serializer.data},
                status=201
            )
        return Response(serializer.errors, status=400)
    
    
class StudentSubjectPreferenceDetailAPIView(APIView):
    """
        DELETE /students/{student_id}/subjects/{subject_id}
    """
    def delete(self, request, student_id, subject_id):
        try:
            profile = StudentProfile.objects.get(id=student_id)
            pref = StudentSubjectPreference.objects.get(
                student_profile=profile,
                subject_id=subject_id
            )
            pref.delete()
            return Response({"message": "Subject preference removed"}, status=204)
        except (StudentProfile.DoesNotExist, StudentSubjectPreference.DoesNotExist):
            return Response({"message": "Not found"}, status=404)
        
        
# ============================ Hobby API Views ============================
class HobbyAPIView(APIView):

    def get(self, request):
        hobbies = Hobby.objects.all()
        serializer = HobbySerializer(hobbies, many=True)
        return Response(
            {"data": serializer.data},
            status=status.HTTP_200_OK
        )

    def post(self, request):
        serializer = HobbySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Hobby created successfully",
                    "data": serializer.data
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

class StudentHobbyAPIView(APIView):

    def post(self, request, student_id):
        try:
            profile = StudentProfile.objects.get(id=student_id)
        except StudentProfile.DoesNotExist:
            return Response(
                {"message": "Student profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = StudentHobbySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(student_profile=profile)
            return Response(
                {
                    "message": "Hobby added to student",
                    "data": serializer.data
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

class StudentHobbyDetailAPIView(APIView):

    def delete(self, request, student_id, hobby_id):
        try:
            profile = StudentProfile.objects.get(id=student_id)
            student_hobby = StudentHobby.objects.get(
                student_profile=profile,
                hobby_id=hobby_id
            )
            student_hobby.delete()

            return Response(
                {"message": "Hobby removed from student"},
                status=status.HTTP_204_NO_CONTENT
            )

        except (StudentProfile.DoesNotExist, StudentHobby.DoesNotExist):
            return Response(
                {"message": "Record not found"},
                status=status.HTTP_404_NOT_FOUND
            )


# ==================== Student Registration form API Views are below ================================

class StudentRegistrationAPIView(APIView):
    permission_classes = []

    @transaction.atomic
    def post(self, request):
        serializer = StudentRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        first_name, *last = data["student_name"].split(" ", 1)
        last_name = last[0] if last else ""

        student_role = Role.objects.get(name="student")
        parent_role = Role.objects.get(name="parent")

        # =========================
        # 🔍 CHECK IF PARENT EXISTS
        # =========================
        parent_user = User.objects.filter(
            email=data["parent_email"],
            phone=data["parent_mobile"],
            role=parent_role
        ).first()

        if parent_user:
            parent_profile = ParentProfile.objects.get(user=parent_user)

            if not parent_profile.otp_verified:
                return Response(
                    {"message": "Parent OTP not verified"},
                    status=400
                )
        else:
            # =========================
            # 👨‍👩 CREATE NEW PARENT
            # =========================
            parent_user = User.objects.create(
                email=data["parent_email"],
                phone=data["parent_mobile"],
                role=parent_role,
                is_active=True
            )
            parent_user.set_password(data["password"])
            parent_user.save()

            parent_profile = ParentProfile.objects.create(
                user=parent_user,
                background=data.get("background"),
                annual_income_range=data.get("annual_income_range"),
                expectations_from_student=data.get("expectations_from_student"),
            )

        # =========================
        # 👨‍🎓 CREATE STUDENT
        # =========================
        student_user = User.objects.create(
            email=data["student_email"],
            phone=data["student_mobile"],
            first_name=first_name,
            last_name=last_name,
            role=student_role,
            is_active=True
        )
        student_user.set_password(data["password"])
        student_user.save()

        student_profile = StudentProfile.objects.create(
            user=student_user,
            parent=parent_profile,
            dob=data["dob"],
            study_class=data["study_class"]
        )

        return Response(
            {
                "message": "Student registered successfully",
                "student_id": student_user.id,
                "parent_id": parent_user.id,
                "parent_profile_id": parent_profile.id
            },
            status=201
        )

     
class SendParentOTPAPIView(APIView):
    permission_classes = []

    def post(self, request):
        email = request.data.get("parent_email")
        phone = request.data.get("parent_mobile")

        if not email or not phone:
            return Response(
                {"message": "Email and phone are required"},
                status=400
            )

        # 🔍 Check if parent exists
        parent_user = User.objects.filter(
            email=email,
            phone=phone,
            role__name="parent"
        ).first()

        if not parent_user:
            return Response(
                {
                    "message": "Parent not found",
                    "parent_exists": False
                },
                status=200
            )

        parent_profile = ParentProfile.objects.get(user=parent_user)

        # 🔢 Generate OTP
        otp = str(random.randint(100000, 999999))

        # ✅ Save OTP in ParentProfile
        parent_profile.set_otp(otp)

        # 📧 Send email
        send_otp_email(email, otp)

        return Response(
            {
                "message": "OTP sent successfully",
                "parent_exists": True
            },
            status=200
        )
        
class VerifyParentOTPAPIView(APIView):
    permission_classes = []

    def post(self, request):
        email = request.data.get("parent_email")
        otp = request.data.get("otp")

        if not email or not otp:
            return Response(
                {"message": "Email and OTP required"},
                status=400
            )

        parent_user = User.objects.filter(
            email=email,
            role__name="parent"
        ).first()

        if not parent_user:
            return Response(
                {"message": "Parent not found"},
                status=404
            )

        parent_profile = ParentProfile.objects.get(user=parent_user)

        # ✅ Verify OTP using model method
        if not parent_profile.verify_otp(otp):
            return Response(
                {"message": "Invalid or expired OTP"},
                status=400
            )

        # 🔥 Return full parent details
        serializer = ParentDetailSerializer(parent_user)

        return Response(
            {
                "message": "OTP verified successfully",
                "parent_exists": True,
                "parent_details": serializer.data
            },
            status=200
        )

