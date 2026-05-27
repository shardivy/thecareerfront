from decimal import Decimal
import json
import random
import string
import threading
from urllib import request
from xml.parsers.expat import errors
from django.shortcuts import get_object_or_404, render
from event.models import Certificate, HandHoldingParticipant, HandHoldingParticipantSession, HandHoldingSession
from counselling_slot.models import Booking
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
from django.db.models import Sum
from django.utils import timezone
from rest_framework.parsers import MultiPartParser, FormParser

from accounts.models import Role, User
from accounts.permissions import IsAdmin, IsSuperAdmin
from accounts.services.whatsapp_service import send_whatsapp_message, send_whatsapp_otp
from accounts.utils import generate_otp, generate_password, generate_role_id, send_credentials_email, send_otp_email
from exam.models import Exam, UserExam
from lead_registration.models import Hobby, Lead, ParentProfile, Stream, StudentAcademicHistory, StudentHobby, StudentProfile, StudentStream, StudentSubjectPreference, Subject
from lead_registration.serializers import AddUserSerializer, HobbySerializer, LeadSerializer, ParentDetailSerializer, PaymentDetailSerializer, StreamSerializer, StudentAcademicHistorySerializer, StudentHobbySerializer, StudentProfileDetailSerializer, StudentRegistrationSerializer, StudentStreamSerializer, StudentSubjectPreferenceSerializer, SubjectSerializer, UserDetailSerializer, UserProgramPackageDetailSerializer, UserProgramPackageResponseSerializer
from payment.models import Payment, PaymentLog
from program_package.models import CollegeListAnalysis, Package, PackageExam, Program, UserProgramPackage
from report.models import Report, Review


logger = logging.getLogger(__name__)
 

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
            # leads = Lead.objects.prefetch_related('programs').order_by('-created_at')

            serializer = LeadSerializer(leads, many=True, context={"request": request})

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

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AddUserSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {"message": "Validation error", "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():

                # ✅ Cache validated data
                data = serializer.validated_data
                program = data["program"]
                package = data["package"]

                # ✅ Optimized role fetch
                student_role = Role.objects.only("id").get(name="student")

                # ✅ Password handling
                password = data.get("password") or generate_password()

                # # ✅ Prefix logic
                # prefix = PROGRAM_PREFIX_MAP.get(program.name)
                # first_name = data["first_name"]

                # if prefix and not first_name.startswith(prefix):
                #     first_name = f"{prefix} - {first_name}"
                
                program = data["program"]

                program_name = program.name.strip().lower()
                prefix = PROGRAM_PREFIX_MAP.get(program_name)

                first_name = data["first_name"].strip()

                if prefix and not first_name.startswith(f"{prefix} - "):
                    first_name = f"{prefix} - {first_name}"
                    
                print("Program Name:", repr(program.name))
                print("Normalized:", program.name.strip().lower())
                print("Prefix:", prefix)

                # ✅ Create user
                user = User.objects.create(
                    first_name=first_name,
                    last_name=data["last_name"],
                    email=data["email"],
                    phone=data.get("phone") or None,
                    role=student_role,
                    is_active=True
                )
                user.set_password(password)
                user.save(update_fields=["password"])

                # ✅ Create student profile (reuse object later)
                student_profile = StudentProfile.objects.create(
                    user=user,
                    study_class=data.get("study_class"),
                    current_academic_stage=data.get("current_academic_stage"),
                    current_academic_year=data.get("current_academic_year"),
                    school_college=data.get("school_college"),
                    city=data.get("city"),
                    preferred_counselling_mode=data.get("preferred_counselling_mode"),
                )

                # ✅ Assign program & package
                upp = UserProgramPackage.objects.create(
                    user=user,
                    program=program,
                    package=package,
                    # assigned_by=request.user.email
                    assigned_by=request.user.email if request.user.is_authenticated else "system"
                )

                # ✅ Conditional logic (NO extra queries)
                # if package.aptitude_test:
                #     UserExam.objects.create(
                #         user=user,
                #         status="not_started"
                #     )
                # else:
                #     Booking.objects.create(
                #         student=student_profile,
                #         status="not_booked"
                #     )
                
                # ✅ Conditional logic
                if package.aptitude_test:
                    UserExam.objects.create(
                        user=user,
                        status="not_started"
                    )

                # ✅ Engineering test analysis condition
                if package.engineering_test_analysis:
                    CollegeListAnalysis.objects.create(
                        user=user,
                        program=program,
                        package=package,
                        status="not_started",
                    )

                    Booking.objects.create(
                        student=student_profile,
                        status="not_booked"
                    )

                # ✅ Default booking if no test
                if not package.aptitude_test and not package.engineering_test_analysis:
                    Booking.objects.create(
                        student=student_profile,
                        status="not_booked"
                    )

                # ✅ Payment (optimized)
                payment = None
                amount = data.get("amount")

                if amount is not None:
                    package_price = package.price

                    if amount == 0:
                        payment_status = "not_paid"
                    elif amount < package_price:
                        payment_status = "partial_paid"
                    else:
                        payment_status = "fully_paid"

                    payment = Payment.objects.create(
                        user=user,
                        package=package,
                        amount=amount,
                        payment_type=data.get("payment_type"),
                        method=data.get("method"),
                        transaction_id=data.get("transaction_id"),
                        proof_file=data.get("proof_file"),
                        status=payment_status
                    )

                # ✅ Send email (non-blocking safe)
                try:
                    send_credentials_email(
                        email=user.email,
                        password=password,
                        program_name=program.name,
                        package_name=package.name if package else "Hand Holding",
                        preferred_counselling_mode=serializer.validated_data.get(
                            "preferred_counselling_mode",
                            "online"
                        )
                    )
                except Exception as e:
                    print("Email failed:", e)

                # ✅ Response
                response_data = UserProgramPackageResponseSerializer(upp).data

                payment_data = None
                if payment:
                    proof_url = (
                        request.build_absolute_uri(payment.proof_file.url)
                        if payment.proof_file else None
                    )

                    payment_data = {
                        "payment_id": payment.id,
                        "amount": payment.amount,
                        "payment_type": payment.payment_type,
                        "method": payment.method,
                        "transaction_id": payment.transaction_id,
                        "proof_file": proof_url,
                        "status": payment.status,
                        "created_at": payment.created_at
                    }

                return Response(
                    {
                        "message": "Student created successfully",
                        "data": {
                            "id": user.id,
                            "first_name": user.first_name,
                            "last_name": user.last_name,
                            "email": user.email,
                            "phone": user.phone,
                            "study_class": data.get("study_class"),
                            "preferred_counselling_mode": data.get("preferred_counselling_mode"),
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
                errors.append("Phone already exists.")
            if "transaction_id" in error:
                errors.append("Transaction ID already exists.")

            return Response(
                {"message": "Duplicate entry", "errors": errors or [str(e)]},
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            return Response(
                {"message": "Something went wrong", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def put(self, request, id):

        # ✅ select_related optimization
        profile = get_object_or_404(
            StudentProfile.objects.select_related("user"),
            id=id
        )
        user = profile.user

        serializer = AddUserSerializer(
            data=request.data,
            partial=True,
            context={"user_id": user.id}
        )

        if not serializer.is_valid():
            return Response(
                {"message": "Validation error", "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():

                data = serializer.validated_data

                program = data.get("program")
                package = data.get("package")

                # ✅ Name logic
                first_name = data.get("first_name", user.first_name)

                if program:
                    prefix = PROGRAM_PREFIX_MAP.get(program.name)

                    if " - " in first_name:
                        first_name = first_name.split(" - ", 1)[1]

                    if prefix:
                        first_name = f"{prefix} - {first_name}"

                # ✅ Update user
                user.first_name = first_name
                user.last_name = data.get("last_name", user.last_name)
                user.email = data.get("email", user.email)
                user.phone = data.get("phone") or user.phone
                user.save()

                # ✅ Update profile
                profile.study_class = data.get("study_class", profile.study_class)
                profile.current_academic_stage = data.get("current_academic_stage", profile.current_academic_stage)
                profile.current_academic_year = data.get("current_academic_year", profile.current_academic_year)
                profile.school_college = data.get("school_college", profile.school_college)
                profile.city = data.get("city", profile.city)
                profile.preferred_counselling_mode = data.get("preferred_counselling_mode", profile.preferred_counselling_mode)
                profile.save()

                # ✅ Optimized query
                upp = UserProgramPackage.objects.select_related(
                    "program", "package"
                ).filter(user=user).last()

                if upp and (program or package):
                    upp.program = program or upp.program
                    upp.package = package or upp.package
                    upp.assigned_by = request.user.email
                    upp.save()

            response_data = UserProgramPackageResponseSerializer(upp).data if upp else None

            # ✅ Optimized payment fetch
            payment = Payment.objects.filter(user=user).only(
                "id", "amount", "status", "proof_file", "created_at", "package"
            ).order_by("-created_at").first()

            payment_data = None
            if payment:
                proof_url = (
                    request.build_absolute_uri(payment.proof_file.url)
                    if payment.proof_file else None
                )

                payment_data = {
                    "payment_id": payment.id,
                    "amount": payment.amount,
                    "status": payment.status,
                    "proof_file": proof_url,
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

        except IntegrityError:
            return Response(
                {"message": "Duplicate entry", "errors": ["Email or Phone exists"]},
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            return Response(
                {"message": "Something went wrong", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    def delete(self, request, id):
        profile = get_object_or_404(
            StudentProfile.objects.select_related("user"),
            id=id
        )

        user = profile.user
        user_id = user.id

        user.delete()

        return Response(
            {
                "message": "Student deleted successfully",
                "user_id": user_id
            },
            status=status.HTTP_200_OK
        )


# class AddUserAPIView(APIView):

#     permission_classes = [IsAuthenticated]

#     def post(self, request):
    
#         payload = request.data.copy()

#         # Handle program_packages - pass through as is
#         # The serializer will handle parsing and validation
#         if 'program_packages' in request.data:
#             # Keep it in payload, serializer will process
#             pass
        
#         # Handle old format programs (if sent as JSON string)
#         programs = request.data.get("programs")
#         if programs and isinstance(programs, str):
#             try:
#                 parsed_programs = json.loads(programs)
#                 payload.setlist(
#                     "programs",
#                     [str(pk) for pk in parsed_programs]
#                 )
#             except Exception as e:
#                 print("PROGRAM PARSE ERROR:", e)
        
#         serializer = AddUserSerializer(data=payload)

#         if not serializer.is_valid():
#             return Response(
#                 {"message": "Validation error", "errors": serializer.errors},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         try:
#             with transaction.atomic():

#                 # ✅ Cache validated data
#                 data = serializer.validated_data
                
#                 # Check which format was used
#                 using_new_format = 'parsed_program_packages' in data
                
#                 if using_new_format:
#                     # NEW FORMAT
#                     program_packages_data = data['parsed_program_packages']
#                     programs = data['parsed_programs']
                    
#                     # Get first package for prefix logic and payment
#                     first_package = program_packages_data[0]['package']
#                     package = first_package
#                 else:
#                     # OLD FORMAT
#                     programs = data.get("programs")
#                     package = data.get("package")

#                 # First program for prefix logic
#                 program = programs[0]

#                 # ✅ Optimized role fetch
#                 student_role = Role.objects.only("id").get(name="student")

#                 # ✅ Password handling
#                 password = data.get("password") or generate_password()

#                 # ✅ Prefix logic
#                 prefix = PROGRAM_PREFIX_MAP.get(program.name)
#                 first_name = data["first_name"]

#                 if prefix and not first_name.startswith(prefix):
#                     first_name = f"{prefix} - {first_name}"

#                 # ✅ Create user
#                 user = User.objects.create(
#                     first_name=first_name,
#                     last_name=data["last_name"],
#                     email=data["email"],
#                     phone=data.get("phone") or None,
#                     role=student_role,
#                     is_active=True
#                 )
#                 user.set_password(password)
#                 user.save(update_fields=["password"])

#                 # ✅ Create student profile
#                 student_profile = StudentProfile.objects.create(
#                     user=user,
#                     study_class=data.get("study_class"),
#                     current_academic_stage=data.get("current_academic_stage"),
#                     current_academic_year=data.get("current_academic_year"),
#                     school_college=data.get("school_college"),
#                     city=data.get("city"),
#                     preferred_counselling_mode=data.get("preferred_counselling_mode"),
#                 )

#                 # ✅ Assign program & package
#                 upp_list = []

#                 if using_new_format:
#                     # New format: each program has its own package
#                     for pp in program_packages_data:
#                         program_obj = pp['program']
#                         package_obj = pp['package']
                        
#                         upp = UserProgramPackage.objects.create(
#                             user=user,
#                             program=program_obj,
#                             package=package_obj,
#                             assigned_by=request.user.email
#                         )
#                         upp_list.append(upp)
                        
#                         # Engineering test analysis condition
#                         if package_obj.engineering_test_analysis:
#                             CollegeListAnalysis.objects.get_or_create(
#                                 user=user,
#                                 program=program_obj,
#                                 package=package_obj,
#                                 defaults={
#                                     "status": "not_started"
#                                 }
#                             )
                    
#                     # Check all packages for features
#                     has_aptitude_test = any(pp['package'].aptitude_test for pp in program_packages_data)
#                     has_engineering_test = any(pp['package'].engineering_test_analysis for pp in program_packages_data)
                    
#                 else:
#                     # Old format: single package for all programs
#                     for program_obj in programs:
#                         upp = UserProgramPackage.objects.create(
#                             user=user,
#                             program=program_obj,
#                             package=package,
#                             assigned_by=request.user.email
#                         )
#                         upp_list.append(upp)
                        
#                         if package.engineering_test_analysis:
#                             CollegeListAnalysis.objects.get_or_create(
#                                 user=user,
#                                 program=program_obj,
#                                 package=package,
#                                 defaults={
#                                     "status": "not_started"
#                                 }
#                             )
                    
#                     has_aptitude_test = package.aptitude_test
#                     has_engineering_test = package.engineering_test_analysis

#                 # ✅ Conditional logic for exams/booking
#                 if has_aptitude_test:
#                     UserExam.objects.create(
#                         user=user,
#                         status="not_started"
#                     )

#                 if has_engineering_test:
#                     Booking.objects.create(
#                         student=student_profile,
#                         status="not_booked"
#                     )

#                 # ✅ Default booking if no tests
#                 if not has_aptitude_test and not has_engineering_test:
#                     Booking.objects.create(
#                         student=student_profile,
#                         status="not_booked"
#                     )

#                 # ✅ Payment
#                 payment = None
#                 amount = data.get("amount")

#                 if amount is not None:
#                     package_price = package.price

#                     if amount == 0:
#                         payment_status = "not_paid"
#                     elif amount < package_price:
#                         payment_status = "partial_paid"
#                     else:
#                         payment_status = "fully_paid"

#                     payment = Payment.objects.create(
#                         user=user,
#                         package=package,
#                         amount=amount,
#                         payment_type=data.get("payment_type"),
#                         method=data.get("method"),
#                         transaction_id=data.get("transaction_id"),
#                         proof_file=data.get("proof_file"),
#                         status=payment_status
#                     )

#                 # ✅ Send email
#                 try:
#                     if using_new_format:
#                         program_package_names = [
#                             f"{pp['program'].name} ({pp['package'].name})" 
#                             for pp in program_packages_data
#                         ]
#                         program_names = ", ".join(program_package_names)
#                         package_name = "Multiple Packages"
#                     else:
#                         program_names = ", ".join(p.name for p in programs)
#                         package_name = package.name if package else "Hand Holding"
                    
#                     send_credentials_email(
#                         email=user.email,
#                         password=password,
#                         program_name=program_names,
#                         package_name=package_name,
#                         preferred_counselling_mode=data.get(
#                             "preferred_counselling_mode",
#                             "online"
#                         )
#                     )
#                 except Exception as e:
#                     print("Email failed:", e)

#                 # ✅ Response
#                 response_data = UserProgramPackageResponseSerializer(
#                     upp_list,
#                     many=True
#                 ).data

#                 payment_data = None
#                 if payment:
#                     proof_url = (
#                         request.build_absolute_uri(payment.proof_file.url)
#                         if payment.proof_file else None
#                     )

#                     payment_data = {
#                         "payment_id": payment.id,
#                         "amount": payment.amount,
#                         "payment_type": payment.payment_type,
#                         "method": payment.method,
#                         "transaction_id": payment.transaction_id,
#                         "proof_file": proof_url,
#                         "status": payment.status,
#                         "created_at": payment.created_at
#                     }

#                 return Response(
#                     {
#                         "message": "Student created successfully",
#                         "data": {
#                             "id": user.id,
#                             "first_name": user.first_name,
#                             "last_name": user.last_name,
#                             "email": user.email,
#                             "phone": user.phone,
#                             "study_class": data.get("study_class"),
#                             "preferred_counselling_mode": data.get("preferred_counselling_mode"),
#                             "programs": response_data,
#                             "payment": payment_data
#                         }
#                     },
#                     status=status.HTTP_201_CREATED
#                 )

#         except IntegrityError as e:
#             error = str(e).lower()
#             errors = []

#             if "email" in error:
#                 errors.append("Email already exists.")
#             if "phone" in error:
#                 errors.append("Phone already exists.")
#             if "transaction_id" in error:
#                 errors.append("Transaction ID already exists.")

#             return Response(
#                 {"message": "Duplicate entry", "errors": errors or [str(e)]},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         except Exception as e:
#             return Response(
#                 {"message": "Something went wrong", "error": str(e)},
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )

#     def put(self, request, id):

#         # ✅ select_related optimization
#         profile = get_object_or_404(
#             StudentProfile.objects.select_related("user"),
#             id=id
#         )
#         user = profile.user

#         payload = request.data.copy()

#         # =================================
#         # 🔹 HANDLE PROGRAM PACKAGES (NEW FORMAT)
#         # =================================
#         program_packages = request.data.get("program_packages")
        
#         if program_packages:
#             try:
#                 # Parse if it's a JSON string
#                 if isinstance(program_packages, str):
#                     parsed_program_packages = json.loads(program_packages)
#                 else:
#                     parsed_program_packages = program_packages
                
#                 # Extract programs list from program_packages
#                 programs_list = [pp['program'] for pp in parsed_program_packages]
                
#                 # Set programs in payload for serializer
#                 payload.setlist(
#                     "programs",
#                     [str(pk) for pk in programs_list]
#                 )
                
#                 # Store program_packages for later use
#                 payload['_program_packages'] = parsed_program_packages
                
#                 # Also set package to the first package to pass validation
#                 if parsed_program_packages and len(parsed_program_packages) > 0:
#                     first_package_id = parsed_program_packages[0]['package']
#                     payload['package'] = first_package_id
                
#             except Exception as e:
#                 print("PROGRAM PACKAGES PARSE ERROR:", e)
#                 return Response(
#                     {"message": "Invalid program_packages format", "error": str(e)},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )
#         else:
#             # =================================
#             # 🔹 HANDLE OLD FORMAT (programs JSON string)
#             # =================================
#             programs = request.data.get("programs")
#             if programs:
#                 try:
#                     parsed_programs = json.loads(programs)
#                     payload.setlist(
#                         "programs",
#                         [str(pk) for pk in parsed_programs]
#                     )
#                 except Exception as e:
#                     print("PROGRAM PARSE ERROR:", e)

#         serializer = AddUserSerializer(
#             data=payload,
#             partial=True,
#             context={"user_id": user.id}
#         )

#         if not serializer.is_valid():
#             return Response(
#                 {"message": "Validation error", "errors": serializer.errors},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         try:
#             with transaction.atomic():

#                 data = serializer.validated_data
                
#                 # =================================
#                 # 🔹 GET PROGRAMS AND PACKAGES
#                 # =================================
#                 programs = data.get("programs", [])
                
#                 # Check if using new format
#                 program_packages_data = payload.get('_program_packages')
#                 use_individual_packages = program_packages_data is not None
                
#                 if use_individual_packages and programs:
#                     # New format: each program has its own package
#                     # Create mapping of program_id -> package
#                     program_package_map = {}
#                     for pp in program_packages_data:
#                         program_id = pp['program']
#                         package_id = pp['package']
#                         # Get the package object
#                         package_obj = Package.objects.get(id=package_id)
#                         program_package_map[program_id] = package_obj
                    
#                     # Get first package for reference
#                     first_package_id = program_packages_data[0]['package']
#                     package = Package.objects.get(id=first_package_id)
#                 else:
#                     # Old format: single package for all programs
#                     package = data.get("package")
#                     program_package_map = {p.id: package for p in programs} if programs else {}

#                 # ✅ Name logic
#                 first_name = data.get("first_name", user.first_name)
                
#                 if programs:
#                     first_program = programs[0]
#                     prefix = PROGRAM_PREFIX_MAP.get(first_program.name)
                    
#                     # Remove existing prefix if present
#                     if " - " in first_name:
#                         first_name = first_name.split(" - ", 1)[1]
                    
#                     # Add new prefix
#                     if prefix:
#                         first_name = f"{prefix} - {first_name}"

#                 # ✅ Update user
#                 user.first_name = first_name
#                 user.last_name = data.get("last_name", user.last_name)
#                 user.email = data.get("email", user.email)
#                 user.phone = data.get("phone") or user.phone
#                 user.save()

#                 # ✅ Update profile
#                 profile.study_class = data.get("study_class", profile.study_class)
#                 profile.current_academic_stage = data.get("current_academic_stage", profile.current_academic_stage)
#                 profile.current_academic_year = data.get("current_academic_year", profile.current_academic_year)
#                 profile.school_college = data.get("school_college", profile.school_college)
#                 profile.city = data.get("city", profile.city)
#                 profile.preferred_counselling_mode = data.get("preferred_counselling_mode", profile.preferred_counselling_mode)
#                 profile.save()

#                 # ✅ Update program & package assignments
#                 upp_list = []

#                 if programs:
#                     # Delete existing assignments
#                     UserProgramPackage.objects.filter(user=user).delete()
                    
#                     # Create new assignments
#                     if use_individual_packages:
#                         # New format: each program with its specific package
#                         for program in programs:
#                             program_package = program_package_map.get(program.id, package)
                            
#                             upp = UserProgramPackage.objects.create(
#                                 user=user,
#                                 program=program,
#                                 package=program_package,
#                                 assigned_by=request.user.email
#                             )
#                             upp_list.append(upp)
                            
#                             # Update engineering test analysis if needed
#                             if program_package.engineering_test_analysis:
#                                 CollegeListAnalysis.objects.update_or_create(
#                                     user=user,
#                                     program=program,
#                                     package=program_package,
#                                     defaults={"status": "not_started"}
#                                 )
#                     else:
#                         # Old format: single package for all programs
#                         for program in programs:
#                             upp = UserProgramPackage.objects.create(
#                                 user=user,
#                                 program=program,
#                                 package=package,
#                                 assigned_by=request.user.email
#                             )
#                             upp_list.append(upp)
                            
#                             if package and package.engineering_test_analysis:
#                                 CollegeListAnalysis.objects.update_or_create(
#                                     user=user,
#                                     program=program,
#                                     package=package,
#                                     defaults={"status": "not_started"}
#                                 )
#                 elif package:
#                     # Update only package for existing programs
#                     UserProgramPackage.objects.filter(user=user).update(package=package)
                    
#                     # Get existing UPPs for response
#                     upp_list = list(UserProgramPackage.objects.filter(user=user).select_related('program', 'package'))
                    
#                     # Update engineering test analysis if needed
#                     if package.engineering_test_analysis:
#                         for upp in upp_list:
#                             CollegeListAnalysis.objects.update_or_create(
#                                 user=user,
#                                 program=upp.program,
#                                 package=package,
#                                 defaults={"status": "not_started"}
#                             )

#             # Prepare response data
#             response_data = UserProgramPackageResponseSerializer(
#                 upp_list,
#                 many=True
#             ).data

#             # ✅ Optimized payment fetch
#             payment = Payment.objects.filter(user=user).only(
#                 "id", "amount", "status", "proof_file", "created_at", "package"
#             ).order_by("-created_at").first()

#             payment_data = None
#             if payment:
#                 proof_url = (
#                     request.build_absolute_uri(payment.proof_file.url)
#                     if payment.proof_file else None
#                 )

#                 payment_data = {
#                     "payment_id": payment.id,
#                     "amount": payment.amount,
#                     "status": payment.status,
#                     "proof_file": proof_url,
#                     "created_at": payment.created_at
#                 }

#             return Response(
#                 {
#                     "message": "Student updated successfully",
#                     "data": {
#                         "student_profile_id": profile.id,
#                         "user_id": user.id,
#                         "first_name": user.first_name,
#                         "last_name": user.last_name,
#                         "email": user.email,
#                         "phone": user.phone,
#                         "programs": response_data,
#                         "payment": payment_data
#                     }
#                 },
#                 status=status.HTTP_200_OK
#             )

#         except IntegrityError:
#             return Response(
#                 {"message": "Duplicate entry", "errors": ["Email or Phone exists"]},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         except Exception as e:
#             return Response(
#                 {"message": "Something went wrong", "error": str(e)},
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )
                                 
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
            
     
#     #  ======================= Student Academic ===============================       

class ConvertLeadAPIView(APIView):
    parser_classes = [MultiPartParser, FormParser]
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

        payload = request.data.dict()  # Make it mutable
        # payload._mutable = True
        payload["first_name"] = lead.first_name
        # payload["last_name"] = lead.last_name
        payload["last_name"] = request.data.get("last_name", lead.last_name)
        payload["email"] = lead.email

        # ✅ Normalize phone
        phone = request.data.get("phone") or lead.phone
        if phone:
            phone = phone.strip().replace(" ", "")
        payload["phone"] = phone

        # 🔹 Check existing user
        existing_user = User.objects.filter(email=lead.email).first()

        serializer = AddUserSerializer(
            data=payload,
            context={"user_id": existing_user.id if existing_user else None}
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

                # student_role = Role.objects.get(name="student")
                # Decide role based on package
                # =================================
                # 🔹 PROGRAM & PACKAGE
                # =================================
                program = serializer.validated_data["program"]
                package = serializer.validated_data.get("package")

                # ✅ IMPORTANT: assign package first
                if not package:
                    package = Package.objects.filter(program=program).first()

                # ✅ NOW detect correctly
                is_handholding = package.is_handholding if package else False
                
                if is_handholding:
                    user_role = Role.objects.get(name="handholding")
                else:
                    user_role = Role.objects.get(name="student")
                

                user = existing_user
                password = None

                # ---------------------------------
                # USER CREATE / UPDATE
                # ---------------------------------
                if not user:

                    # ✅ FIRST PRIORITY:
                    # Use password already submitted during registration
                    password = serializer.validated_data.get("password")

                    # ✅ SECOND:
                    # fallback to request password
                    if not password:
                        password = request.data.get("password")

                    # ✅ ONLY if absolutely missing
                    if not password:
                        password = generate_password()

                    # program = serializer.validated_data["program"]
                    # prefix = PROGRAM_PREFIX_MAP.get(program.name)

                    # first_name = serializer.validated_data["first_name"]

                    # if prefix and not first_name.startswith(prefix):
                    #     first_name = f"{prefix} - {first_name}"
                    
                    program = serializer.validated_data["program"]

                    program_name = program.name.strip().lower()
                    prefix = PROGRAM_PREFIX_MAP.get(program_name)

                    first_name = serializer.validated_data["first_name"].strip()

                    if prefix and not first_name.startswith(f"{prefix} - "):
                        first_name = f"{prefix} - {first_name}"

                    user = User.objects.create(
                        first_name=first_name,
                        last_name=serializer.validated_data["last_name"],
                        email=lead.email,
                        phone=serializer.validated_data.get("phone"),
                        role=user_role,
                        is_active=True
                    )

                    # ✅ Save exact original password
                    user.set_password(password)
                    user.save()

                else:
                    # ✅ EXISTING USER
                    entered_password = serializer.validated_data.get("password") or request.data.get("password")

                    # ✅ Update only if admin provided new password
                    if entered_password:
                        password = entered_password
                        user.set_password(password)
                        user.save(update_fields=["password"])
                    else:
                        # ✅ IMPORTANT:
                        # Keep original password untouched
                        password = None

                    user.first_name = serializer.validated_data.get(
                        "first_name",
                        user.first_name
                    )
                    user.last_name = serializer.validated_data.get(
                        "last_name",
                        user.last_name
                    )
                    user.phone = serializer.validated_data.get(
                        "phone",
                        user.phone
                    )

                    if user.role != user_role:
                        user.role = user_role

                    user.save()

                

                # =================================
                # 🔹 HAND HOLDING LOGIC
                # =================================
                if is_handholding:
                    resume_file = serializer.validated_data.get("resume_file")
                    photo = serializer.validated_data.get("photo")
                    
                    full_address = request.data.get("full_address", "")
                    city = request.data.get("city")
                    
                    print(f"Resume file received: {resume_file}")
                    print(f"Resume file name: {resume_file.name if resume_file else 'None'}")
                    print(f"Photo received: {photo}")

                    participant = HandHoldingParticipant.objects.filter(
                        email=lead.email
                    ).first()

                    if participant:
                        participant.user = user
                        participant.mobile = user.phone
                        participant.email = user.email
                        
                        participant.full_address = full_address
                        participant.city = city

                        # ✅ FIX: Assign file fields properly
                        if resume_file:
                            participant.resume_file = resume_file  # This should work if field is FileField
                            
                        if photo:
                            participant.photo = photo
                            
                        participant.show_profile = serializer.validated_data.get("show_profile", participant.show_profile)

                        participant.save()

                    else:
                        # ✅ FIX: Create with file fields
                        participant = HandHoldingParticipant.objects.create(
                            user=user,
                            email=user.email,
                            mobile=user.phone,
                            # full_address=serializer.validated_data.get("full_address", ""),
                            full_address=full_address,
                            # city=serializer.validated_data.get("city"),
                            city=city,
                            preferred_counselling_mode=serializer.validated_data.get("preferred_counselling_mode"),
                            resume_file=resume_file,  # This should work
                            photo=photo,  # This should work
                            show_profile=serializer.validated_data.get("show_profile")
                        )

                    # =================================
                    # 🔹 ADD THIS PART (SESSION CREATION)
                    # =================================
                    # total_sessions = int(request.data.get("total_sessions", 10))

                    # # Get all master sessions (based on ordering)
                    # sessions = HandHoldingSession.objects.all().order_by("ordering")[:total_sessions]
                    
                    
                    sessions = HandHoldingSession.objects.all().order_by("ordering")

                    # Existing session numbers
                    existing_sessions = set(
                        HandHoldingParticipantSession.objects.filter(
                            handholding_participant=participant
                        ).values_list("session_no", flat=True)
                    )

                    new_sessions = []

                    for i, session in enumerate(sessions, start=1):
                        if i not in existing_sessions:
                            new_sessions.append(
                                HandHoldingParticipantSession(
                                    handholding_participant=participant,
                                    handholding_session=session,
                                    session_no=i,
                                    session_date=timezone.now(),
                                    status="not_booked",
                                    notes="",
                                    conducted_by=request.user if request.user.is_authenticated else None
                                )
                            )

                    HandHoldingParticipantSession.objects.bulk_create(new_sessions)
                    
                # =================================
                # 🔹 CERTIFICATE CREATION (HANDHOLDING)
                # =================================
                Certificate.objects.get_or_create(
                    user=user,
                    program_type="handholding",
                    defaults={
                        "certificate_status": "pending"
                    }
                )

                # =================================
                # 🔹 STUDENT PROFILE (SKIP FOR HANDHOLDING)
                # =================================
                student_profile = None

                if not is_handholding:
                    student_profile = StudentProfile.objects.create(
                        user=user,
                        study_class=serializer.validated_data.get("study_class"),
                        current_academic_stage=serializer.validated_data.get("current_academic_stage"),
                        current_academic_year=serializer.validated_data.get("current_academic_year"),
                        school_college=serializer.validated_data.get("school_college"),
                        city=serializer.validated_data.get("city"),
                        preferred_counselling_mode=serializer.validated_data.get(
                            "preferred_counselling_mode"
                        ),
                        dob=lead.dob if lead.dob else None,
                        specialization=lead.specialization if lead.specialization else None,
                        stream=lead.stream if lead.stream else None,
                    )
                else:
                    student_profile = None  # ✅ explicitly ensure
                # =================================
                # 🔹 PROGRAM PACKAGE (SKIP FOR HANDHOLDING)
                # =================================
                upp = None

                # if package:
                #     upp = UserProgramPackage.objects.create(
                #         user=user,
                #         program=program,
                #         package=package,
                #         assigned_by="lead-conversion"
                #     )
                # ✅ Ensure package exists for handholding
                if is_handholding and not package:
                    package = Package.objects.filter(program=program).first()

                # ✅ Create UPP
                if program:
                    upp = UserProgramPackage.objects.create(
                        user=user,
                        program=program,
                        package=package,
                        assigned_by="lead-conversion"
                    )

                # # =================================
                # # 🔹 EXAM / BOOKING
                # # =================================
                # if not is_handholding:
                #     if package and package.aptitude_test:
                #         UserExam.objects.create(
                #             user=user,
                #             status="not_started"
                #         )
                #     else:
                #         Booking.objects.create(
                #             student=student_profile,
                #             status="not_booked"
                #         )
                
                # =================================
                # 🔹 EXAM / BOOKING / ENGINEERING ANALYSIS
                # =================================
                if not is_handholding:

                    # ✅ Aptitude Test
                    if package and package.aptitude_test:
                        UserExam.objects.create(
                            user=user,
                            status="not_started"
                        )

                    # ✅ Engineering Test Analysis (🔥 ADD THIS)
                    if package and package.engineering_test_analysis:
                        CollegeListAnalysis.objects.create(
                            user=user,
                            program=program,
                            package=package,
                            status="not_started",
                        )

                        Booking.objects.create(
                            student=student_profile,
                            status="not_booked"
                        )

                    # ✅ Default Booking
                    if package and not package.aptitude_test and not package.engineering_test_analysis:
                        Booking.objects.create(
                            student=student_profile,
                            status="not_booked"
                        )

                # =================================
                # 🔹 PAYMENT (SKIP FOR HANDHOLDING)
                # =================================
                payment = None

                if package:

                    amount = serializer.validated_data.get("amount", 0)
                    # amount = serializer.validated_data.get("amount") or Decimal("0")
                    # amount = serializer.validated_data.get("amount")
                    package_price = package.price

                    if amount == 0:
                        payment_status = "not_paid"
                    elif amount < package_price:
                        payment_status = "partial_paid"
                    else:
                        payment_status = "fully_paid"

                    transaction_id = serializer.validated_data.get("transaction_id") or None

                    payment = Payment.objects.create(
                        user=user,
                        package=package,
                        amount=amount,
                        payment_type=serializer.validated_data.get("payment_type"),
                        method=serializer.validated_data.get("method"),
                        transaction_id=transaction_id,
                        proof_file=serializer.validated_data.get("proof_file"),
                        status=payment_status
                    )

                # =================================
                # 🔹 UPDATE LEAD
                # =================================
                lead.status = "converted"
                lead.save(update_fields=["status"])
                
                # ✅ Mark user as converted lead
                user.is_converted_lead = True
                user.save(update_fields=["is_converted_lead"])

                # =================================
                # 🔹 SEND EMAIL (HANDLE EXISTING USER PASSWORD)
                # =================================
                try:
                    # ✅ NEW PASSWORD if entered by admin
                    password_to_send = (
                        serializer.validated_data.get("password")
                        or request.data.get("password")
                    )

                    # ==========================================
                    # EXISTING USER + NO NEW PASSWORD PROVIDED
                    # ==========================================
                    if existing_user and not password_to_send:

                        # ❌ Do NOT generate/reset password
                        # ✅ Inform user to use previous password
                        password_to_send = "Please use your previous password"

                    # ==========================================
                    # NEW USER + NO PASSWORD
                    # ==========================================
                    elif not password_to_send:
                        password_to_send = generate_password()

                        user.set_password(password_to_send)
                        user.save(update_fields=["password"])

                    # ==========================================
                    # DEBUG LOGS
                    # ==========================================
                    print("========== EMAIL DEBUG ==========")
                    print("User Email:", user.email)
                    print("Password Sent:", password_to_send)
                    print("Program:", program.name)
                    print("Package:", package.name if package else "Hand Holding")
                    print("================================")

                    # ==========================================
                    # SEND EMAIL
                    # ==========================================
                    print("BEFORE EMAIL FUNCTION CALL")
                    send_credentials_email(
                        email=user.email,
                        password=password_to_send,
                        program_name=program.name,
                        package_name=package.name if package else "Hand Holding",
                        preferred_counselling_mode=serializer.validated_data.get(
                            "preferred_counselling_mode",
                            "online"
                        )
                    )
                    print("AFTER EMAIL FUNCTION CALL")

                    logger.info(
                        f"Credentials email sent successfully to {user.email}"
                    )

                except Exception as e:
                    import traceback

                    print("========== EMAIL ERROR ==========")
                    print("User Email:", user.email)
                    print("Error:", str(e))
                    traceback.print_exc()
                    print("=================================")

                    logger.error(
                        f"Email sending failed for {user.email}: {str(e)}"
                    )
                
                # =================================
                # 🔹 RESPONSE
                # =================================
                return Response(
                    {
                        "message": "Lead converted successfully",
                        "data": {
                            "user": UserDetailSerializer(user).data,
                            "student_profile": (
                                StudentProfileDetailSerializer(student_profile).data
                                if student_profile else None
                            ),
                            "program_package": (
                                UserProgramPackageDetailSerializer(upp).data
                                if upp else None
                            ),
                            "payment": (
                                PaymentDetailSerializer(payment, context={"request": request}).data
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

# class ConvertLeadAPIView(APIView):
#     parser_classes = [MultiPartParser, FormParser]
#     """
#     Convert Lead → User → StudentProfile → Program → Package → Payment
#     """

#     def post(self, request, lead_id):

#         lead = get_object_or_404(Lead, id=lead_id)

#         if lead.status == "converted":
#             return Response(
#                 {"message": "Lead already converted"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         if not lead.email:
#             return Response(
#                 {"message": "Email is required to convert lead"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         payload = request.data.copy()
        
#         # =================================
#         # 🔹 HANDLE PROGRAM PACKAGES (NEW FORMAT)
#         # =================================
#         program_packages = request.data.get("program_packages")
        
#         if program_packages:
#             try:
#                 # Parse if it's a JSON string
#                 if isinstance(program_packages, str):
#                     parsed_program_packages = json.loads(program_packages)
#                 else:
#                     parsed_program_packages = program_packages
                
#                 # Extract programs list from program_packages
#                 programs_list = [pp['program'] for pp in parsed_program_packages]
                
#                 # Set programs in payload for serializer
#                 payload.setlist(
#                     "programs",
#                     [str(pk) for pk in programs_list]
#                 )
                
#                 # Store program_packages for later use
#                 payload['_program_packages'] = parsed_program_packages
                
#                 # Also set package to the first package to pass validation
#                 if parsed_program_packages and len(parsed_program_packages) > 0:
#                     first_package_id = parsed_program_packages[0]['package']
#                     payload['package'] = first_package_id
                
#             except Exception as e:
#                 print("PROGRAM PACKAGES PARSE ERROR:", e)
#                 return Response(
#                     {"message": "Invalid program_packages format", "error": str(e)},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )
#         else:
#             # =================================
#             # 🔹 HANDLE OLD FORMAT (programs JSON string)
#             # =================================
#             programs = request.data.get("programs")
#             if programs:
#                 try:
#                     if isinstance(programs, str):
#                         parsed_programs = json.loads(programs)
#                         payload.setlist(
#                             "programs",
#                             [str(x) for x in parsed_programs]
#                         )
#                 except Exception as e:
#                     print("PROGRAM PARSE ERROR:", e)
            
#             # Handle single program field
#             if not payload.get("programs") and request.data.get("program"):
#                 payload.setlist("programs", [str(request.data.get("program"))])

#         # =================================
#         # 🔹 SET LEAD DATA
#         # =================================
#         payload["first_name"] = lead.first_name
#         payload["last_name"] = request.data.get("last_name", lead.last_name)
#         payload["email"] = lead.email

#         # Normalize phone
#         phone = request.data.get("phone") or lead.phone
#         if phone:
#             phone = phone.strip().replace(" ", "")
#         payload["phone"] = phone

#         # Check existing user
#         existing_user = User.objects.filter(email=lead.email).first()

#         serializer = AddUserSerializer(
#             data=payload,
#             context={"user_id": existing_user.id if existing_user else None}
#         )

#         if not serializer.is_valid():
#             return Response(
#                 {
#                     "message": "Validation error",
#                     "errors": serializer.errors
#                 },
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         try:
#             with transaction.atomic():

#                 # =================================
#                 # 🔹 GET PROGRAMS AND PACKAGES
#                 # =================================
#                 programs = serializer.validated_data.get("programs", [])
                
#                 if not programs:
#                     raise ValueError("No programs selected")
                
#                 # Check if using new format
#                 program_packages_data = payload.get('_program_packages')
#                 use_individual_packages = program_packages_data is not None
                
#                 if use_individual_packages:
#                     # New format: each program has its own package
#                     # Create mapping of program_id -> package
#                     program_package_map = {}
#                     for pp in program_packages_data:
#                         program_id = pp['program']
#                         package_id = pp['package']
#                         package_obj = Package.objects.get(id=package_id)
#                         program_package_map[program_id] = package_obj
                    
#                     # Get first package for reference
#                     first_package_id = program_packages_data[0]['package']
#                     package = Package.objects.get(id=first_package_id)
#                 else:
#                     # Old format: single package for all programs
#                     package = serializer.validated_data.get("package")
#                     # If no package, try to get from request
#                     if not package:
#                         package_id = request.data.get("package")
#                         if package_id:
#                             package = Package.objects.get(id=package_id)
                    
#                     program_package_map = {p.id: package for p in programs}
                
#                 # First program for prefix logic
#                 program = programs[0]

#                 # Determine role based on package
#                 is_handholding = package.is_handholding if package else False
                
#                 if is_handholding:
#                     user_role = Role.objects.get(name="handholding")
#                 else:
#                     user_role = Role.objects.get(name="student")
                
#                 user = existing_user
#                 password = None

#                 # =================================
#                 # 🔹 USER CREATE / UPDATE
#                 # =================================
#                 if not user:
#                     # Create new user
#                     password = serializer.validated_data.get("password")
#                     if not password:
#                         password = request.data.get("password")
#                     if not password:
#                         password = generate_password()

#                     prefix = PROGRAM_PREFIX_MAP.get(program.name)
#                     first_name = serializer.validated_data["first_name"]

#                     if prefix and not first_name.startswith(prefix):
#                         first_name = f"{prefix} - {first_name}"

#                     user = User.objects.create(
#                         first_name=first_name,
#                         last_name=serializer.validated_data["last_name"],
#                         email=lead.email,
#                         phone=serializer.validated_data.get("phone"),
#                         role=user_role,
#                         is_active=True
#                     )
#                     user.set_password(password)
#                     user.save()

#                 else:
#                     # Update existing user
#                     entered_password = serializer.validated_data.get("password") or request.data.get("password")
                    
#                     if entered_password:
#                         password = entered_password
#                         user.set_password(password)
#                         user.save(update_fields=["password"])
#                     else:
#                         password = None

#                     user.first_name = serializer.validated_data.get("first_name", user.first_name)
#                     user.last_name = serializer.validated_data.get("last_name", user.last_name)
#                     user.phone = serializer.validated_data.get("phone", user.phone)

#                     if user.role != user_role:
#                         user.role = user_role
#                     user.save()

#                 # =================================
#                 # 🔹 HAND HOLDING LOGIC
#                 # =================================
#                 if is_handholding:
#                     resume_file = serializer.validated_data.get("resume_file")
#                     photo = serializer.validated_data.get("photo")
#                     full_address = request.data.get("full_address", "")
#                     city = request.data.get("city")

#                     participant = HandHoldingParticipant.objects.filter(email=lead.email).first()

#                     if participant:
#                         participant.user = user
#                         participant.mobile = user.phone
#                         participant.email = user.email
#                         participant.full_address = full_address
#                         participant.city = city
                        
#                         if resume_file:
#                             participant.resume_file = resume_file
#                         if photo:
#                             participant.photo = photo
#                         participant.show_profile = serializer.validated_data.get("show_profile", participant.show_profile)
#                         participant.save()
#                     else:
#                         participant = HandHoldingParticipant.objects.create(
#                             user=user,
#                             email=user.email,
#                             mobile=user.phone,
#                             full_address=full_address,
#                             city=city,
#                             preferred_counselling_mode=serializer.validated_data.get("preferred_counselling_mode"),
#                             resume_file=resume_file,
#                             photo=photo,
#                             show_profile=serializer.validated_data.get("show_profile")
#                         )

#                     # Create sessions
#                     sessions = HandHoldingSession.objects.all().order_by("ordering")
#                     existing_sessions = set(
#                         HandHoldingParticipantSession.objects.filter(
#                             handholding_participant=participant
#                         ).values_list("session_no", flat=True)
#                     )

#                     new_sessions = []
#                     for i, session in enumerate(sessions, start=1):
#                         if i not in existing_sessions:
#                             new_sessions.append(
#                                 HandHoldingParticipantSession(
#                                     handholding_participant=participant,
#                                     handholding_session=session,
#                                     session_no=i,
#                                     session_date=timezone.now(),
#                                     status="not_booked",
#                                     notes="",
#                                     conducted_by=request.user if request.user.is_authenticated else None
#                                 )
#                             )
#                     HandHoldingParticipantSession.objects.bulk_create(new_sessions)
                    
#                     # Create certificate
#                     Certificate.objects.get_or_create(
#                         user=user,
#                         program_type="handholding",
#                         defaults={"certificate_status": "pending"}
#                     )
                
#                 # =================================
#                 # 🔹 STUDENT PROFILE (SKIP FOR HANDHOLDING)
#                 # =================================
#                 student_profile = None
#                 if not is_handholding:
#                     student_profile = StudentProfile.objects.create(
#                         user=user,
#                         study_class=serializer.validated_data.get("study_class"),
#                         current_academic_stage=serializer.validated_data.get("current_academic_stage"),
#                         current_academic_year=serializer.validated_data.get("current_academic_year"),
#                         school_college=serializer.validated_data.get("school_college"),
#                         city=serializer.validated_data.get("city"),
#                         preferred_counselling_mode=serializer.validated_data.get("preferred_counselling_mode"),
#                         dob=lead.dob if lead.dob else None,
#                         specialization=lead.specialization if lead.specialization else None,
#                         stream=lead.stream if lead.stream else None,
#                     )

#                 # =================================
#                 # 🔹 PROGRAM PACKAGE ASSIGNMENT
#                 # =================================
#                 upp_list = []
                
#                 for program_obj in programs:
#                     # Get the specific package for this program
#                     program_package = program_package_map.get(program_obj.id, package)
                    
#                     upp = UserProgramPackage.objects.create(
#                         user=user,
#                         program=program_obj,
#                         package=program_package,
#                         assigned_by="lead-conversion"
#                     )
#                     upp_list.append(upp)

#                 # =================================
#                 # 🔹 EXAM / BOOKING / ENGINEERING ANALYSIS
#                 # =================================
#                 if not is_handholding:
#                     # Check all packages for features
#                     if use_individual_packages:
#                         has_aptitude_test = any(
#                             Package.objects.get(id=pp['package']).aptitude_test 
#                             for pp in program_packages_data
#                         )
#                         has_engineering_test = any(
#                             Package.objects.get(id=pp['package']).engineering_test_analysis 
#                             for pp in program_packages_data
#                         )
#                     else:
#                         has_aptitude_test = package.aptitude_test if package else False
#                         has_engineering_test = package.engineering_test_analysis if package else False

#                     if has_aptitude_test:
#                         UserExam.objects.create(user=user, status="not_started")

#                     if has_engineering_test:
#                         for program_obj in programs:
#                             program_package = program_package_map.get(program_obj.id, package)
#                             CollegeListAnalysis.objects.get_or_create(
#                                 user=user,
#                                 program=program_obj,
#                                 package=program_package,
#                                 defaults={"status": "not_started"}
#                             )
#                         Booking.objects.create(student=student_profile, status="not_booked")

#                     if not has_aptitude_test and not has_engineering_test:
#                         Booking.objects.create(student=student_profile, status="not_booked")

#                 # =================================
#                 # 🔹 PAYMENT
#                 # =================================
#                 payment = None
#                 if package:
#                     amount = serializer.validated_data.get("amount", 0)
#                     if amount is None:
#                         amount = 0
                    
#                     package_price = package.price

#                     if amount == 0:
#                         payment_status = "not_paid"
#                     elif amount < package_price:
#                         payment_status = "partial_paid"
#                     else:
#                         payment_status = "fully_paid"

#                     transaction_id = serializer.validated_data.get("transaction_id") or None

#                     payment = Payment.objects.create(
#                         user=user,
#                         package=package,
#                         amount=amount,
#                         payment_type=serializer.validated_data.get("payment_type"),
#                         method=serializer.validated_data.get("method"),
#                         transaction_id=transaction_id,
#                         proof_file=serializer.validated_data.get("proof_file"),
#                         status=payment_status
#                     )

#                 # =================================
#                 # 🔹 UPDATE LEAD
#                 # =================================
#                 lead.status = "converted"
#                 lead.save(update_fields=["status"])
#                 user.is_converted_lead = True
#                 user.save(update_fields=["is_converted_lead"])

#                 # =================================
#                 # 🔹 SEND EMAIL
#                 # =================================
#                 try:
#                     password_to_send = (
#                         serializer.validated_data.get("password")
#                         or request.data.get("password")
#                     )

#                     if existing_user and not password_to_send:
#                         password_to_send = "Please use your previous password"
#                     elif not password_to_send:
#                         password_to_send = generate_password()
#                         user.set_password(password_to_send)
#                         user.save(update_fields=["password"])

#                     # Prepare program and package names
#                     if use_individual_packages:
#                         program_package_names = []
#                         for pp in program_packages_data:
#                             program_obj = Program.objects.get(id=pp['program'])
#                             package_obj = Package.objects.get(id=pp['package'])
#                             program_package_names.append(f"{program_obj.name} ({package_obj.name})")
#                         program_names = ", ".join(program_package_names)
#                         package_name = "Multiple Packages"
#                     else:
#                         program_names = ", ".join(p.name for p in programs)
#                         package_name = package.name if package else "Hand Holding"

#                     send_credentials_email(
#                         email=user.email,
#                         password=password_to_send,
#                         program_name=program_names,
#                         package_name=package_name,
#                         preferred_counselling_mode=serializer.validated_data.get(
#                             "preferred_counselling_mode", "online"
#                         )
#                     )
#                 except Exception as e:
#                     print("Email error:", e)

#                 # =================================
#                 # 🔹 RESPONSE
#                 # =================================
#                 return Response(
#                     {
#                         "message": "Lead converted successfully",
#                         "data": {
#                             "user": UserDetailSerializer(user).data,
#                             "student_profile": (
#                                 StudentProfileDetailSerializer(student_profile).data
#                                 if student_profile else None
#                             ),
#                             "program_packages": (
#                                 UserProgramPackageDetailSerializer(
#                                     upp_list,
#                                     many=True
#                                 ).data
#                                 if upp_list else []
#                             ),
#                             "payment": (
#                                 PaymentDetailSerializer(payment, context={"request": request}).data
#                                 if payment else None
#                             )
#                         }
#                     },
#                     status=status.HTTP_201_CREATED
#                 )

#         except Exception as e:
#             import traceback
#             traceback.print_exc()
#             return Response(
#                 {
#                     "message": "Lead conversion failed",
#                     "error": str(e)
#                 },
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )


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
        try:
            serializer = StudentRegistrationSerializer(data=request.data)

            # ===============================
            # Custom Validation Error Response
            # ===============================
            if not serializer.is_valid():
                first_error = next(iter(serializer.errors.values()))[0]

                return Response(
                    {
                        "message": "Registration failed",
                        "error": str(first_error)
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            data = serializer.validated_data

            # ===============================
            # Split student name safely
            # ===============================
            full_name = data.get("student_name", "").strip()
            first_name, *last = full_name.split(" ", 1)
            last_name = last[0] if last else ""

            # ===============================
            # Check Roles safely
            # ===============================
            student_role = Role.objects.filter(name="basic_user").first()
            parent_role = Role.objects.filter(name="parent").first()

            if not student_role or not parent_role:
                return Response({
                    "message": "Required roles (basic_user / parent) not found"
                }, status=500)

            # ===============================
            # Create Lead
            # ===============================
            lead = Lead.objects.create(
                first_name=first_name,
                last_name=last_name,
                phone=data.get("student_mobile") or None,
                email=data["student_email"],
                dob=data.get("dob"),
                program=data["program"],
                study_class=data["study_class"],
                specialization=data.get("specialization"),
                stream=data.get("stream"),
                source="website",
                status="enquiry",
                date=timezone.now().date()
            )
            # lead.programs.set(data["programs"])

            # ===============================
            # Student User
            # ===============================
            student_user, created = User.objects.get_or_create(
                email=data["student_email"],
                defaults={
                    "first_name": first_name,
                    "last_name": last_name,
                    "phone": data.get("student_mobile") or None,
                    "role": student_role,
                    "is_active": True
                }
            )

            if created:
                password = data.get("password") or generate_password()
                student_user.set_password(password)
                student_user.save()
            else:
                student_user.first_name = first_name
                student_user.last_name = last_name
                student_user.phone = data.get("student_mobile") or None
                student_user.save()

            # ===============================
            # Parent User
            # ===============================
            parent_name = data.get("parent_name", "").strip()
            parent_first, *parent_last = parent_name.split(" ", 1)
            parent_last_name = parent_last[0] if parent_last else ""

            parent_user, parent_created = User.objects.get_or_create(
                email=data["parent_email"],
                defaults={
                    "phone": data.get("parent_mobile") or None,
                    "role": parent_role,
                    "first_name": parent_first,
                    "last_name": parent_last_name,
                    "is_active": True
                }
            )

            if parent_created:
                parent_password = generate_password()
                parent_user.set_password(parent_password)
                parent_user.save()
            else:
                parent_user.first_name = parent_first
                parent_user.last_name = parent_last_name
                parent_user.phone = data.get("parent_mobile") or None
                parent_user.save()

            # ===============================
            # Parent Profile (SAFE)
            # ===============================
            parent_profile, _ = ParentProfile.objects.get_or_create(
                user=parent_user
            )

            # ===============================
            # Assign Program
            # ===============================
            if data.get("program"):
                UserProgramPackage.objects.get_or_create(
                    user=student_user,
                    program=data["program"],
                    defaults={"assigned_by": "system"}
                )
            
            # for program in data["programs"]:
            #     UserProgramPackage.objects.get_or_create(
            #         user=student_user,
            #         program=program,
            #         defaults={"assigned_by": "system"}
            #     )
                

            # ===============================
            # SUCCESS RESPONSE
            # ===============================
            return Response({
                "message": "Registration successful",
                "lead_id": lead.id,
                "student_user_id": student_user.id,
                "parent_id": parent_profile.id
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            import traceback
            print(traceback.format_exc())  # 🔥 show real error in terminal

            return Response({
                "message": "Registration failed",
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# class StudentRegistrationAPIView(APIView):
#     permission_classes = []

#     @transaction.atomic
#     def post(self, request):
#         try:
#             serializer = StudentRegistrationSerializer(data=request.data)
#             serializer.is_valid(raise_exception=True)
#             data = serializer.validated_data

#             # ===============================
#             # Detect Program Type
#             # ===============================
#             selected_program = data.get("program")

#             is_hand_holding = (
#                 selected_program
#                 and selected_program.name.strip().lower() == "hand holding program"
#             )

#             # ===============================
#             # Split student name safely
#             # ===============================
#             full_name = data.get("student_name", "").strip()
#             first_name, *last = full_name.split(" ", 1)
#             last_name = last[0] if last else ""

#             # ===============================
#             # Check Roles safely
#             # ===============================
#             student_role = Role.objects.filter(name="basic_user").first()
#             parent_role = Role.objects.filter(name="parent").first()

#             if not student_role:
#                 return Response({
#                     "message": "Student role not found"
#                 }, status=500)

#             # ===============================
#             # VALIDATION FOR REGULAR PROGRAMS ONLY
#             # ===============================
#             if not is_hand_holding:

#                 # ✅ DOB required only for regular
#                 if not data.get("dob"):
#                     return Response({
#                         "message": "DOB is required for regular programs."
#                     }, status=400)

#                 # ✅ Class required
#                 if not data.get("study_class"):
#                     return Response({
#                         "message": "Class is required for regular programs."
#                     }, status=400)

#                 # ✅ Specialization required
#                 specialization_value = (
#                     data.get("specialization")
#                     or request.data.get("specialization")
#                     or request.data.get("specialization_id")
#                 )

#                 if not specialization_value:
#                     return Response({
#                         "message": "Specialization is required for regular programs."
#                     }, status=400)

#                 # ✅ Stream required
#                 stream_value = (
#                     data.get("stream")
#                     or request.data.get("stream")
#                     or request.data.get("stream_id")
#                 )

#                 if not stream_value:
#                     return Response({
#                         "message": "Stream is required for regular programs."
#                     }, status=400)

#                 # ✅ Parent details required
#                 if not all([
#                     data.get("parent_name"),
#                     data.get("parent_email"),
#                     data.get("parent_mobile")
#                 ]):
#                     return Response({
#                         "message": "Parent details are required for regular programs."
#                     }, status=400)

#             # ===============================
#             # Create Lead
#             # ===============================
#             lead = Lead.objects.create(
#                 first_name=first_name,
#                 last_name=last_name,
#                 phone=data.get("student_mobile") or None,
#                 email=data["student_email"],
#                 program=selected_program,

#                 # ✅ Optional for hand holding
#                 study_class=None if is_hand_holding else data.get("study_class"),
#                 specialization=None if is_hand_holding else (
#                     data.get("specialization")
#                     or request.data.get("specialization_id")
#                 ),

#                 source="website",
#                 status="enquiry",
#                 date=timezone.now().date()
#             )

#             # ===============================
#             # Student User
#             # ===============================
#             student_user, created = User.objects.get_or_create(
#                 email=data["student_email"],
#                 defaults={
#                     "first_name": first_name,
#                     "last_name": last_name,
#                     "phone": data.get("student_mobile") or None,
#                     "role": student_role,
#                     "is_active": True
#                 }
#             )

#             if created:
#                 password = data.get("password") or generate_password()
#                 student_user.set_password(password)
#                 student_user.save()
#             else:
#                 student_user.first_name = first_name
#                 student_user.last_name = last_name
#                 student_user.phone = data.get("student_mobile") or None
#                 student_user.save()

#             # ===============================
#             # Parent User ONLY FOR REGULAR
#             # ===============================
#             parent_profile = None

#             if not is_hand_holding:

#                 if not parent_role:
#                     return Response({
#                         "message": "Parent role not found"
#                     }, status=500)

#                 parent_name = data.get("parent_name", "").strip()
#                 parent_first, *parent_last = parent_name.split(" ", 1)
#                 parent_last_name = parent_last[0] if parent_last else ""

#                 parent_user, parent_created = User.objects.get_or_create(
#                     email=data["parent_email"],
#                     defaults={
#                         "phone": data.get("parent_mobile") or None,
#                         "role": parent_role,
#                         "first_name": parent_first,
#                         "last_name": parent_last_name,
#                         "is_active": True
#                     }
#                 )

#                 if parent_created:
#                     parent_password = generate_password()
#                     parent_user.set_password(parent_password)
#                     parent_user.save()
#                 else:
#                     parent_user.first_name = parent_first
#                     parent_user.last_name = parent_last_name
#                     parent_user.phone = data.get("parent_mobile") or None
#                     parent_user.save()

#                 parent_profile, _ = ParentProfile.objects.get_or_create(
#                     user=parent_user
#                 )

#             # ===============================
#             # Assign Program
#             # ===============================
#             if selected_program:
#                 UserProgramPackage.objects.get_or_create(
#                     user=student_user,
#                     program=selected_program,
#                     defaults={"assigned_by": "system"}
#                 )

#             # ===============================
#             # SUCCESS RESPONSE
#             # ===============================
#             return Response({
#                 "message": "Registration successful",
#                 "lead_id": lead.id,
#                 "student_user_id": student_user.id,
#                 "parent_id": parent_profile.id if parent_profile else None,
#                 "program_type": (
#                     "hand_holding"
#                     if is_hand_holding
#                     else "regular"
#                 )
#             }, status=status.HTTP_201_CREATED)

#         except Exception as e:
#             import traceback
#             print(traceback.format_exc())

#             return Response({
#                 "message": "Registration failed",
#                 "error": str(e)
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)           
            
            
            
            

class SendParentOTPAPIView(APIView):
    permission_classes = []

    def post(self, request):
        email = request.data.get("parent_email")

        if not email:
            return Response(
                {"message": "Email is required"},
                status=400
            )

        # 🔢 Generate OTP
        otp = generate_otp()

        # 🔍 Check if parent exists
        parent_user = User.objects.filter(
            email=email,
            role__name="parent"
        ).first()

        if parent_user:
            # ✅ Save OTP in ParentProfile
            parent_profile = ParentProfile.objects.get(user=parent_user)
            parent_profile.set_otp(otp)

            parent_exists = True
        else:
            # ✅ Save OTP in session (temporary storage)
            request.session["parent_otp"] = otp
            request.session["parent_email"] = email

            parent_exists = False

        # 📧 Send OTP Email
        send_otp_email(email, otp)

        return Response(
            {
                "message": "OTP sent successfully on email.",
                "parent_exists": parent_exists
            },
            status=200
        )
        
# class VerifyParentOTPAPIView(APIView):
#     permission_classes = []

#     def post(self, request):
#         email = request.data.get("parent_email")
#         otp = request.data.get("otp")

#         # 🔎 Validate input
#         if not email or not otp:
#             return Response(
#                 {"message": "Parent email and OTP are required"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # 🔎 Try to find existing parent user
#         parent_user = User.objects.filter(
#             email=email,
#             role__name="parent"
#         ).first()

#         # ==========================================
#         # ✅ CASE 1: Parent Account Exists
#         # ==========================================
#         if parent_user:
#             try:
#                 parent_profile = parent_user.parent_profile
#             except ParentProfile.DoesNotExist:
#                 return Response(
#                     {"message": "Parent profile not found"},
#                     status=status.HTTP_404_NOT_FOUND
#                 )

#             is_valid, message = parent_profile.verify_otp(otp)

#             if not is_valid:
#                 return Response(
#                     {"message": message},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             return Response(
#                 {
#                     "message": "OTP verified successfully",
#                     "parent_exists": True,
#                     "parent_name": f"{parent_user.first_name} {parent_user.last_name}",
#                     "parent_id": parent_profile.id
#                 },
#                 status=status.HTTP_200_OK
#             )

#         # ==========================================
#         # ✅ CASE 2: Parent Account NOT Exists
#         # ==========================================

#         session_email = request.session.get("parent_email")
#         session_otp = request.session.get("parent_otp")
#         # session_otp_time = request.session.get("parent_otp_time")

#         # if not session_email or not session_otp:
#         #     return Response(
#         #         {"message": "OTP session expired. Please request OTP again."},
#         #         status=status.HTTP_400_BAD_REQUEST
#         #     )

#         # Check email match
#         if str(session_email) != str(email):
#             return Response(
#                 {"message": "Invalid email"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # Check OTP match
#         if str(session_otp) != str(otp):
#             return Response(
#                 {"message": "Invalid OTP"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # Optional: Check expiry (10 minutes)
#         # if session_otp_time:
#         #     expiry_time = session_otp_time + 600  # 10 min in seconds
#         #     if timezone.now().timestamp() > expiry_time:
#         #         return Response(
#         #             {"message": "OTP expired"},
#         #             status=status.HTTP_400_BAD_REQUEST
#         #         )

#         return Response(
#             {
#                 "message": "OTP verified successfully",
#                 "parent_exists": False
#             },
#             status=status.HTTP_200_OK
#         )     
    
class VerifyParentOTPAPIView(APIView):
    permission_classes = []

    def post(self, request):
        email = request.data.get("parent_email")
        otp = request.data.get("otp")

        # 🔎 Validate input
        if not email or not otp:
            return Response(
                {"message": "Parent email and OTP are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 🔎 Try to find existing parent user
        parent_user = User.objects.filter(
            email=email,
            role__name="parent"
        ).first()

        # ==========================================
        # ✅ CASE 1: Parent Account Exists
        # ==========================================
        if parent_user:
            try:
                parent_profile = parent_user.parent_profile
            except ParentProfile.DoesNotExist:
                return Response(
                    {"message": "Parent profile not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            is_valid, message = parent_profile.verify_otp(otp)

            if not is_valid:
                return Response(
                    {"message": message},
                    status=status.HTTP_400_BAD_REQUEST
                )

            return Response(
                {
                    "message": "OTP verified successfully",
                    "parent_exists": True,
                    "parent_name": f"{parent_user.first_name} {parent_user.last_name}",
                    "parent_id": parent_profile.id
                },
                status=status.HTTP_200_OK
            )

        # ==========================================
        # ✅ CASE 2: Parent Account NOT Exists
        # ==========================================
        
        # For new users, just return success
        # The OTP validation should happen in the OTP generation/sending step
        # Not in verification step for new users
        
        return Response(
            {
                "message": "OTP verified successfully",
                "parent_exists": False
            },
            status=status.HTTP_200_OK
        )

# class UserJourneyAPIView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request, student_id):

#         student = get_object_or_404(StudentProfile, id=student_id)
#         history = []

#         # ================================
#         # 1️⃣ REGISTRATION
#         # ================================
#         registration_completed = True

#         history.append({
#             "step": "Registration",
#             "status": "completed",
#             "date": student.created_at,
#             "details": f"Student {student.user.email} registered"
#         })

#         # ================================
#         # 2️⃣ COUNSELLING SERVICE
#         # ================================
#         program = getattr(student, "program", None)
#         package = getattr(student, "package", None)

#         last_payment = (
#             Payment.objects
#             .filter(user=student.user)
#             .select_related("package__program")
#             .order_by("-created_at")
#             .first()
#         )

#         if (not program or not package) and last_payment and last_payment.package:
#             package = last_payment.package
#             program = last_payment.package.program

#         counselling_selected = bool(program and package)

#         if counselling_selected:
#             history.append({
#                 "step": "Counselling Service Selection",
#                 "status": "completed",
#                 "date": student.updated_at,
#                 "details": f"{package.name} selected for program {program.name}"
#             })

#         # ================================
#         # 3️⃣ PAYMENT
#         # ================================
#         payments = Payment.objects.filter(
#             user=student.user
#         ).order_by("created_at")

#         total_paid = payments.aggregate(total=Sum("amount"))["total"] or 0
#         last_payment = payments.last()

#         package_price = (
#             last_payment.package.price
#             if last_payment and last_payment.package
#             else 0
#         )

#         if total_paid == 0:
#             payment_status = "pending"
#         elif total_paid < package_price:
#             payment_status = "partial_paid"
#         else:
#             payment_status = "fully_paid"

#         if payments.exists():
#             for payment in payments:
#                 history.append({
#                     "step": "Payment",
#                     "status": payment.status,
#                     "date": payment.created_at.date(),
#                     "details": f"₹{payment.amount:.2f} - ({payment.method}) "
#                 })
#         else:
#             history.append({
#                 "step": "Payment",
#                 "status": "pending",
#                 "date": None,
#                 "details": "No payment made yet"
#             })

#         # ================================
#         # 4️⃣ EXAM / ENGINEERING ANALYSIS
#         # ================================
#         exam_status = "not_applicable"
#         report_status = "not_applicable"
#         analysis_status = "not_applicable"

#         upp = (
#             UserProgramPackage.objects
#             .filter(user=student.user)
#             .select_related("package")
#             .last()
#         )

#         package = upp.package if upp else None

#         aptitude_test_status = False
#         engineering_analysis_status = False

#         if package:
#             aptitude_test_status = package.aptitude_test
#             engineering_analysis_status = getattr(package, "engineering_test_analysis", False)

#         # ================================
#         # ENGINEERING TEST ANALYSIS FLOW
#         # ================================
#         if engineering_analysis_status:

#             analysis = (
#                 CollegeListAnalysis.objects
#                 .filter(user=student.user)
#                 .order_by("-created_at")
#                 .first()
#             )

#             if analysis:
#                 analysis_status = analysis.status

#                 history.append({
#                     "step": "Engineering Test Analysis",
#                     "status": analysis.status,
#                     "date": analysis.created_at,
#                     "details": f"Analysis status: {analysis.status}"
#                 })
#             else:
#                 analysis_status = "not_started"

#                 history.append({
#                     "step": "Engineering Test Analysis",
#                     "status": "not_started",
#                     "date": None,
#                     "details": "Analysis not started"
#                 })

#         # ================================
#         # APTITUDE TEST FLOW
#         # ================================
#         elif aptitude_test_status:

#             exam_attempt = (
#                 UserExam.objects
#                 .filter(user=student.user)
#                 .order_by("-created_at")
#                 .first()
#             )

#             if exam_attempt:
#                 exam_status = exam_attempt.status

#                 exam_name = (
#                     exam_attempt.exam.name
#                     if exam_attempt.exam
#                     else "Aptitude Test"
#                 )

#                 history.append({
#                     "step": "Exam",
#                     "status": exam_status,
#                     "date": exam_attempt.created_at,
#                     "details": f"{exam_name} exam status: {exam_status}"
#                 })
#             else:
#                 exam_status = "not_started"

#                 history.append({
#                     "step": "Exam",
#                     "status": "not_started",
#                     "date": None,
#                     "details": "Exam not started"
#                 })

#         else:
#             history.append({
#                 "step": "Exam",
#                 "status": "not_applicable",
#                 "date": None,
#                 "details": "Exam not applicable for this package"
#             })

#         # ================================
#         # REPORT
#         # ================================
#         report = (
#             Report.objects
#             .filter(user=student.user)
#             .order_by("-uploaded_at")
#             .first()
#         )

#         if report:
#             report_status = report.report_status

#             history.append({
#                 "step": "Report",
#                 "status": report_status,
#                 "date": report.uploaded_at,
#                 "details": f"Report status: {report_status}"
#             })
#         else:
#             report_status = "not_received"

#             history.append({
#                 "step": "Report",
#                 "status": "not_received",
#                 "date": None,
#                 "details": "Report not uploaded"
#             })

#         # ================================
#         # 5️⃣ SLOT BOOKING
#         # ================================
#         bookings = Booking.objects.filter(student=student)

#         slot_status = "not_booked"
#         booking_obj = None

#         if bookings.filter(status="rescheduled").exists():
#             booking_obj = bookings.filter(status="rescheduled").order_by("-created_at").first()
#             slot_status = "rescheduled"

#         elif bookings.filter(status="pending").exists():
#             booking_obj = bookings.filter(status="pending").order_by("-created_at").first()
#             slot_status = "pending"

#         elif bookings.filter(status="booked").exists():
#             booking_obj = bookings.filter(status="booked").order_by("-created_at").first()
#             slot_status = "booked"

#         elif bookings.filter(status="completed").exists():
#             booking_obj = bookings.filter(status="completed").order_by("-created_at").first()
#             slot_status = "completed"

#         elif bookings.filter(status="cancelled").exists():
#             booking_obj = bookings.filter(status="cancelled").order_by("-created_at").first()
#             slot_status = "cancelled"

#         if booking_obj:
#             history.append({
#                 "step": "Counselling Slot Booking",
#                 "status": slot_status,
#                 "date": booking_obj.created_at,
#                 "details": f"Slot status: {slot_status}"
#             })
#         else:
#             history.append({
#                 "step": "Counselling Slot Booking",
#                 "status": "not_booked",
#                 "date": None,
#                 "details": "Slot not booked"
#             })

#         # # ================================
#         # # 6️⃣ REVIEW
#         # # ================================
#         # review_status = True

#         # history.append({
#         #     "step": "Review",
#         #     "status": "completed",
#         #     "date": None,
#         #     "details": "Review bypassed"
#         # })
#         # ================================
#         # 6️⃣ REVIEW
#         # ================================
#         review = (
#             Review.objects
#             .filter(user=student.user)
#             .order_by("-created_at")
#             .first()
#         )

#         if review:
#             review_status = review.review_status

#             history.append({
#                 "step": "Review",
#                 "status": review.review_status,
#                 "date": review.created_at,
#                 "details": f"Review status: {review.review_status}"
#             })
#         else:
#             review_status = "not_submitted"

#             history.append({
#                 "step": "Review",
#                 "status": "not_submitted",
#                 "date": None,
#                 "details": "Review not submitted yet"
#             })

#         # ================================
#         # FULL ACCESS
#         # ================================
#         full_access = (
#             registration_completed
#             and counselling_selected
#             and payment_status in ["partial_paid", "fully_paid"]
#             and (
#                 (aptitude_test_status and exam_status == "completed") or
#                 (engineering_analysis_status and analysis_status == "completed")
#             )
#             and report_status in ["received_unlocked"]
#             and slot_status in ["booked", "rescheduled", "completed"]
#             and review_status
#         )

#         # ================================
#         # CURRENT STEP
#         # ================================
#         current_step = 8

#         # ================================
#         # RESPONSE
#         # ================================
#         response_data = {
#             "aptitude_test": aptitude_test_status,
#             "engineering_test_analysis": engineering_analysis_status,
#             "progress": {
#                 "registration": registration_completed,
#                 "counselling_service": counselling_selected,
#                 "payment": payment_status,
#                 "exam": exam_status,
#                 "analysis": analysis_status,
#                 "report": report_status,
#                 "counselling_slot_booking": slot_status,
#                 "review": review_status,
#                 "full_access": full_access,
#                 "current_step": current_step
#             },
#             "payment_summary": {
#                 "last_payment": {
#                     "payment_id": last_payment.id if last_payment else None,
#                     "amount": float(last_payment.amount) if last_payment else 0,
#                     "status": last_payment.status if last_payment else None,
#                     "payment_type": last_payment.payment_type if last_payment else None,
#                     "method": last_payment.method if last_payment else None,
#                     "transaction_id": last_payment.transaction_id if last_payment else None,
#                     "date": last_payment.created_at.date() if last_payment else None,
#                 } if last_payment else None,
#                 "total_amount_paid": float(total_paid),
#             },
#             "history": history
#         }

#         return Response(response_data)


class UserJourneyAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):

        student = get_object_or_404(StudentProfile, id=student_id)
        history = []

        # ================================
        # 1️⃣ REGISTRATION
        # ================================
        registration_completed = True

        history.append({
            "step": "Registration",
            "status": "completed",
            "date": student.created_at,
            "details": f"Student {student.user.email} registered"
        })

        # ================================
        # 2️⃣ COUNSELLING SERVICE
        # ================================
        program = getattr(student, "program", None)
        package = getattr(student, "package", None)

        last_payment = (
            Payment.objects
            .filter(user=student.user)
            .select_related("package__program")
            .order_by("-created_at")
            .first()
        )

        if (not program or not package) and last_payment and last_payment.package:
            package = last_payment.package
            program = last_payment.package.program

        counselling_selected = bool(program and package)

        if counselling_selected:
            history.append({
                "step": "Counselling Service Selection",
                "status": "completed",
                "date": student.updated_at,
                "details": f"{package.name} selected for program {program.name}"
            })

        # ================================
        # 3️⃣ PAYMENT
        # ================================
        payments = Payment.objects.filter(
            user=student.user
        ).order_by("created_at")

        total_paid = payments.aggregate(total=Sum("amount"))["total"] or 0
        last_payment = payments.last()

        package_price = (
            last_payment.package.price
            if last_payment and last_payment.package
            else 0
        )

        if total_paid == 0:
            payment_status = "pending"
        elif total_paid < package_price:
            payment_status = "partial_paid"
        else:
            payment_status = "fully_paid"

        if payments.exists():
            for payment in payments:
                history.append({
                    "step": "Payment",
                    "status": payment.status,
                    "date": payment.created_at.date(),
                    "details": f"₹{payment.amount:.2f} - ({payment.method}) "
                })
        else:
            history.append({
                "step": "Payment",
                "status": "pending",
                "date": None,
                "details": "No payment made yet"
            })

        # ================================
        # 4️⃣ EXAM / ENGINEERING ANALYSIS
        # ================================
        exam_status = "not_applicable"
        report_status = "not_applicable"
        analysis_status = "not_applicable"

        upp = (
            UserProgramPackage.objects
            .filter(user=student.user)
            .select_related("package")
            .last()
        )

        package = upp.package if upp else None

        aptitude_test_status = False
        engineering_analysis_status = False

        if package:
            aptitude_test_status = package.aptitude_test
            engineering_analysis_status = getattr(package, "engineering_test_analysis", False)

        # ================================
        # ENGINEERING TEST ANALYSIS FLOW
        # ================================
        if engineering_analysis_status:

            analysis = (
                CollegeListAnalysis.objects
                .filter(user=student.user)
                .order_by("-created_at")
                .first()
            )

            if analysis:
                analysis_status = analysis.status

                history.append({
                    "step": "Engineering Test Analysis",
                    "status": analysis.status,
                    "date": analysis.created_at,
                    "details": f"Analysis status: {analysis.status}"
                })
            else:
                analysis_status = "not_started"

                history.append({
                    "step": "Engineering Test Analysis",
                    "status": "not_started",
                    "date": None,
                    "details": "Analysis not started"
                })

        # ================================
        # APTITUDE TEST FLOW
        # ================================
        elif aptitude_test_status:

            exam_attempt = (
                UserExam.objects
                .filter(user=student.user)
                .order_by("-created_at")
                .first()
            )

            if exam_attempt:
                exam_status = exam_attempt.status

                exam_name = (
                    exam_attempt.exam.name
                    if exam_attempt.exam
                    else "Aptitude Test"
                )

                history.append({
                    "step": "Exam",
                    "status": exam_status,
                    "date": exam_attempt.created_at,
                    "details": f"{exam_name} exam status: {exam_status}"
                })
            else:
                exam_status = "not_started"

                history.append({
                    "step": "Exam",
                    "status": "not_started",
                    "date": None,
                    "details": "Exam not started"
                })

        else:
            history.append({
                "step": "Exam",
                "status": "not_applicable",
                "date": None,
                "details": "Exam not applicable for this package"
            })

        # ================================
        # REPORT (UPDATED LOGIC)
        # ================================
        if not aptitude_test_status and not engineering_analysis_status:
            report_status = "not_applicable"

            history.append({
                "step": "Report",
                "status": "not_applicable",
                "date": None,
                "details": "Report not applicable for this package"
            })

        else:
            report = (
                Report.objects
                .filter(user=student.user)
                .order_by("-uploaded_at")
                .first()
            )

            if report:
                report_status = report.report_status

                history.append({
                    "step": "Report",
                    "status": report_status,
                    "date": report.uploaded_at,
                    "details": f"Report status: {report_status}"
                })
            else:
                report_status = "not_received"

                history.append({
                    "step": "Report",
                    "status": "not_received",
                    "date": None,
                    "details": "Report not uploaded"
                })

        # ================================
        # 5️⃣ SLOT BOOKING
        # ================================
        bookings = Booking.objects.filter(student=student)

        slot_status = "not_booked"
        booking_obj = None

        if bookings.filter(status="rescheduled").exists():
            booking_obj = bookings.filter(status="rescheduled").order_by("-created_at").first()
            slot_status = "rescheduled"

        elif bookings.filter(status="pending").exists():
            booking_obj = bookings.filter(status="pending").order_by("-created_at").first()
            slot_status = "pending"

        elif bookings.filter(status="booked").exists():
            booking_obj = bookings.filter(status="booked").order_by("-created_at").first()
            slot_status = "booked"

        elif bookings.filter(status="completed").exists():
            booking_obj = bookings.filter(status="completed").order_by("-created_at").first()
            slot_status = "completed"

        elif bookings.filter(status="cancelled").exists():
            booking_obj = bookings.filter(status="cancelled").order_by("-created_at").first()
            slot_status = "cancelled"

        if booking_obj:
            history.append({
                "step": "Counselling Slot Booking",
                "status": slot_status,
                "date": booking_obj.created_at,
                "details": f"Slot status: {slot_status}"
            })
        else:
            history.append({
                "step": "Counselling Slot Booking",
                "status": "not_booked",
                "date": None,
                "details": "Slot not booked"
            })

        # # ================================
        # # 6️⃣ REVIEW
        # # ================================
        # review_status = True

        # history.append({
        #     "step": "Review",
        #     "status": "completed",
        #     "date": None,
        #     "details": "Review bypassed"
        # })
        # ================================
        # 6️⃣ REVIEW
        # ================================
        review = (
            Review.objects
            .filter(user=student.user)
            .order_by("-created_at")
            .first()
        )

        if review:
            review_status = review.review_status

            history.append({
                "step": "Review",
                "status": review.review_status,
                "date": review.created_at,
                "details": f"Review status: {review.review_status}"
            })
        else:
            review_status = "not_submitted"

            history.append({
                "step": "Review",
                "status": "not_submitted",
                "date": None,
                "details": "Review not submitted yet"
            })

        # ================================
        # FULL ACCESS (FIXED)
        # ================================
        if not aptitude_test_status and not engineering_analysis_status:
            # ✅ No exam / analysis required
            full_access = (
                registration_completed
                and counselling_selected
                and payment_status in ["partial_paid", "fully_paid"]
                and slot_status in ["booked", "rescheduled", "completed"]
                and review_status not in ["not_submitted", None]
            )
        else:
            # ✅ Normal flow
            full_access = (
                registration_completed
                and counselling_selected
                and payment_status in ["partial_paid", "fully_paid"]
                and (
                    (aptitude_test_status and exam_status == "completed") or
                    (engineering_analysis_status and analysis_status == "completed")
                )
                and report_status in ["received_unlocked"]
                and slot_status in ["booked", "rescheduled", "completed"]
                and review_status not in ["not_submitted", None]
            )

        # ================================
        # CURRENT STEP
        # ================================
        current_step = 8

        # ================================
        # PAYMENT SUMMARY (FIXED)
        # ================================
        payment_list = []

        for p in payments:
            payment_list.append({
                "payment_id": p.id,
                "amount": float(p.amount),
                "status": p.status,
                "payment_type": p.payment_type,
                "method": p.method,
                "transaction_id": p.transaction_id,
                "date": p.created_at.date(),
            })

        # ================================
        # RESPONSE
        # ================================
        response_data = {
            "aptitude_test": aptitude_test_status,
            "engineering_test_analysis": engineering_analysis_status,
            "progress": {
                "registration": registration_completed,
                "counselling_service": counselling_selected,
                "payment": payment_status,
                "exam": exam_status,
                "analysis": analysis_status,
                "report": report_status,
                "counselling_slot_booking": slot_status,
                "review": review_status,
                "full_access": full_access,
                "current_step": current_step
            },
            "payment_summary": {
                "all_payments": payment_list,   # ✅ All payments
                "last_payment": {
                    "payment_id": last_payment.id if last_payment else None,
                    "amount": float(last_payment.amount) if last_payment else 0,
                    "status": last_payment.status if last_payment else None,
                    "payment_type": last_payment.payment_type if last_payment else None,
                    "method": last_payment.method if last_payment else None,
                    "transaction_id": last_payment.transaction_id if last_payment else None,
                    "date": last_payment.created_at.date() if last_payment else None,
                } if last_payment else None,
                "total_amount_paid": float(total_paid),
            },
            "history": history
        }     

        return Response(response_data)