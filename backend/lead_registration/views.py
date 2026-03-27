import random
import string
from urllib import request
from xml.parsers.expat import errors
from django.shortcuts import get_object_or_404, render
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

from accounts.models import Role, User
from accounts.permissions import IsAdmin, IsSuperAdmin
from accounts.services.whatsapp_service import send_whatsapp_message, send_whatsapp_otp
from accounts.utils import generate_otp, generate_password, generate_role_id, send_credentials_email, send_otp_email
from exam.models import Exam, UserExam
from lead_registration.models import Hobby, Lead, ParentProfile, Stream, StudentAcademicHistory, StudentHobby, StudentProfile, StudentStream, StudentSubjectPreference, Subject
from lead_registration.serializers import AddUserSerializer, HobbySerializer, LeadSerializer, ParentDetailSerializer, PaymentDetailSerializer, StreamSerializer, StudentAcademicHistorySerializer, StudentHobbySerializer, StudentProfileDetailSerializer, StudentRegistrationSerializer, StudentStreamSerializer, StudentSubjectPreferenceSerializer, SubjectSerializer, UserDetailSerializer, UserProgramPackageDetailSerializer, UserProgramPackageResponseSerializer
from payment.models import Payment, PaymentLog
from program_package.models import PackageExam, Program, UserProgramPackage
from report.models import Report, Review


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
            
            
# class AddUserAPIView(APIView):
     
#     """
#     Creates a new student user with profile details, assigns a program and package,
#     generates login credentials, and sends them via email.
#     Only accessible to Admin and Super Admin users.
#     """
    
#     permission_classes = [IsAdmin | IsSuperAdmin]

#     def post(self, request):
#         serializer = AddUserSerializer(data=request.data)

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

#                 # 🔹 Role & password
#                 # student_role = Role.objects.get(name="student")
#                 # password = generate_password()
                
#                 student_role = Role.objects.get(name="student")

#                 # 🔹 Check if password provided in request
#                 password = serializer.validated_data.get("password")

#                 if not password:
#                     password = generate_password()


#                 # 🔹 Create user
#                 # 🔹 Program-based prefix logic
#                 program = serializer.validated_data["program"]
#                 program_name = program.name

#                 prefix = PROGRAM_PREFIX_MAP.get(program_name)

#                 original_first_name = serializer.validated_data["first_name"]

#                 # Avoid double prefix
#                 if prefix and not original_first_name.startswith(prefix):
#                     final_first_name = f"{prefix} - {original_first_name}"
#                 else:
#                     final_first_name = original_first_name

#                 # 🔹 Create user with prefixed name
#                 user = User.objects.create(
#                     first_name=final_first_name,
#                     last_name=serializer.validated_data["last_name"],
#                     email=serializer.validated_data["email"],
#                     phone=serializer.validated_data.get("phone") or None,
#                     role=student_role,
#                     is_active=True
#                 )
#                 user.set_password(password)
#                 user.save()


#                 # 🔹 Create student profile
#                 StudentProfile.objects.create(
#                     user=user,
#                     study_class=serializer.validated_data.get("study_class"),
#                     current_academic_stage=serializer.validated_data.get("current_academic_stage"),
#                     current_academic_year=serializer.validated_data.get("current_academic_year"),
#                     school_college=serializer.validated_data.get("school_college"),
#                     city=serializer.validated_data.get("city"),
#                     preferred_counselling_mode=serializer.validated_data.get(
#                         "preferred_counselling_mode"
#                     ),
#                 )

#                 # 🔹 Assign program & package
#                 upp = UserProgramPackage.objects.create(
#                     user=user,
#                     program=serializer.validated_data["program"],
#                     package=serializer.validated_data["package"],
#                     assigned_by=request.user.email
#                 )
                
# #++++++++++++++++++++++++++++++++ just for now and will later delete it ++++++++++++++++++++++++++++++++++++++++++

#                 # # 🔹 Auto-create UserExam if aptitude_test = True
#                 # package = serializer.validated_data["package"]

#                 # if package.aptitude_test:

#                 #     # Get all exam mappings for this package
#                 #     package_exams = PackageExam.objects.filter(package_id=package.id)

#                 #     if package_exams.exists():

#                 #         user_exams = [
#                 #             UserExam(
#                 #                 user=user,
#                 #                 exam=pe.exam,
#                 #                 status="in_progress"
#                 #             )
#                 #             for pe in package_exams
#                 #         ]

#                 #         UserExam.objects.bulk_create(user_exams)
                
#                 # 🔹 Auto-create UserExam OR Booking based on aptitude_test
#                 package = serializer.validated_data["package"]

#                 if package.aptitude_test:
#                     # Create UserExam
#                     UserExam.objects.create(
#                         user=user,
#                         status="not_started"
#                     )
#                 else:
#                     # Create Booking entry
#                     student_profile = user.student_profile  

#                     Booking.objects.create(
#                         student=student_profile,
#                         status="not_booked",  
#                         # session_type="career_counselling"  
#                     )
# # ==========================================================================================================

#                 # 🔹 Create payment (OPTIONAL)
#                 payment = None
#                 amount = serializer.validated_data.get("amount")
#                 proof_file = serializer.validated_data.get("proof_file")

#                 if amount is not None:

#                     package_price = serializer.validated_data["package"].price

#                     # 🔹 Determine payment status
#                     if amount == 0:
#                         payment_status = "not_paid"
#                     elif amount < package_price:
#                         payment_status = "partial_paid"
#                     else:
#                         payment_status = "fully_paid"

#                     payment = Payment.objects.create(
#                         user=user,
#                         package=serializer.validated_data["package"],
#                         amount=amount,
#                         payment_type=serializer.validated_data.get("payment_type"),
#                         method=serializer.validated_data.get("method"),
#                         transaction_id=serializer.validated_data.get("transaction_id"),
#                         proof_file=proof_file,
#                         status=payment_status
#                     )


#                 # 🔹 Send credentials email
#                 try:
#                     send_credentials_email(user.email, password, program.name, package.name)
#                 except Exception as e:
#                     print("Email sending failed:", e)

#                 # 🔹 Prepare response
#                 response_data = UserProgramPackageResponseSerializer(upp).data

#                 payment_data = None
#                 if payment:
#                     proof_url = None

#                     if payment.proof_file:
#                         proof_url = request.build_absolute_uri(
#                             payment.proof_file.url
#                         )

#                     payment_data = {
#                         "payment_id": payment.id,
#                         "amount": payment.amount,
#                         "payment_type": payment.payment_type,
#                         "method": payment.method,
#                         "transaction_id": payment.transaction_id,
#                         "proof_file": proof_url,   # ✅ safe
#                         "status": payment.status,
#                         "created_at": payment.created_at
#                     }


#                 return Response(
#                     {
#                         "message": "Student created successfully and credentials sent via email",
#                         "data": {
#                             "id": user.id,
#                             "first_name": user.first_name,
#                             "last_name": user.last_name,
#                             "study_class": serializer.validated_data.get("study_class"),
#                             "preferred_counselling_mode": serializer.validated_data.get("preferred_counselling_mode"),
#                             "email": user.email,
#                             "phone": user.phone,
#                             "program": response_data["program"],
#                             "package": response_data["package"],
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
#                 errors.append("Phone number already exists.")

#             if "transaction_id" in error:
#                 errors.append("Transaction ID already exists.")

#             if not errors:
#                 errors.append(str(e))

        

#             return Response(
#                 {
#                     "message": "Duplicate entry",
#                     "errors": errors
#                 },
#                 status=status.HTTP_400_BAD_REQUEST
#             )


#         except Exception as e:
#             return Response(
#                 {
#                     "message": "Something went wrong while adding student",
#                     "error": str(e)
#                 },
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )

    
    

#     def put(self, request, id):
#         """
#         Update student using StudentProfile ID
#         """
#         profile = get_object_or_404(StudentProfile, id=id)
#         user = profile.user

#         serializer = AddUserSerializer(
#             data=request.data,
#             partial=True,
#             context={"user_id": user.id}
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

#                 # 🔹 Get updated program (if provided)
#                 program = serializer.validated_data.get("program")
#                 new_first_name = serializer.validated_data.get("first_name", user.first_name)

#                 if program:
#                     program_name = program.name
#                     prefix = PROGRAM_PREFIX_MAP.get(program_name)

#                     # 🔹 Remove old prefix if exists
#                     if " - " in new_first_name:
#                         new_first_name = new_first_name.split(" - ", 1)[1]

#                     # 🔹 Apply new prefix
#                     if prefix:
#                         new_first_name = f"{prefix} - {new_first_name}"

#                 # 🔹 Update User fields
#                 user.first_name = new_first_name
#                 user.last_name = serializer.validated_data.get("last_name", user.last_name)
#                 user.email = serializer.validated_data.get("email", user.email)
#                 user.phone = serializer.validated_data.get("phone") or user.phone
#                 user.save()

#                 # 🔹 Update StudentProfile
#                 profile.study_class = serializer.validated_data.get("study_class", profile.study_class)
#                 profile.current_academic_stage = serializer.validated_data.get(
#                     "current_academic_stage", profile.current_academic_stage
#                 )
#                 profile.current_academic_year = serializer.validated_data.get(
#                     "current_academic_year", profile.current_academic_year
#                 )
#                 profile.school_college = serializer.validated_data.get(
#                     "school_college", profile.school_college
#                 )
#                 profile.preferred_counselling_mode = serializer.validated_data.get(
#                     "preferred_counselling_mode", profile.preferred_counselling_mode
#                 )
#                 profile.city = serializer.validated_data.get("city", profile.city)
#                 profile.save()

#                 # 🔹 Update Program / Package
#                 package = serializer.validated_data.get("package")

#                 upp = UserProgramPackage.objects.filter(user=user).last()
#                 if upp and (program or package):
#                     upp.program = program or upp.program
#                     upp.package = package or upp.package
#                     upp.assigned_by = request.user.email
#                     upp.save()

#             response_data = (
#                 UserProgramPackageResponseSerializer(upp).data if upp else None
#             )
            
#             # 🔹 Fetch proof file
#             proof_file = request.FILES.get("proof_file")
            
#             # 🔹 Fetch latest payment
#             payment = Payment.objects.filter(user=user).order_by("-created_at").first()

#             # if payment and proof_file:
#             #     payment.proof_file = proof_file
#             #     payment.status = "verification_pending"
#             #     payment.save()
            
#             amount = serializer.validated_data.get("amount")

#             if amount is not None and payment:

#                 package_price = payment.package.price

#                 # 🔹 Apply ₹500 rule ONLY if package price is greater than 0
#                 # if package_price > 0:
#                 #     if amount < 500:
#                 #         return Response(
#                 #             {"message": "Amount must be at least ₹500"},
#                 #             status=status.HTTP_400_BAD_REQUEST
#                 #         )

#                 # 🔹 Prevent overpayment
#                 if amount > package_price:
#                     return Response(
#                         {"message": f"Amount cannot exceed ₹{package_price}"},
#                         status=status.HTTP_400_BAD_REQUEST
#                     )

#                 payment.amount = amount

#                 # 🔹 Auto update status
#                 if amount == 0:
#                     payment_status = "not_paid"
#                 elif amount < package_price:
#                     payment_status = "partial_paid"
#                 else:
#                     payment_status = "fully_paid"

#                 payment.save()

#             payment_data = None

#             if payment:
#                 proof_url = None
#                 if payment.proof_file:
#                     proof_url = request.build_absolute_uri(payment.proof_file.url)

#                 payment_data = {
#                     "payment_id": payment.id,
#                     "amount": payment.amount,
#                     "payment_type": payment.payment_type,
#                     "method": payment.method,
#                     "transaction_id": payment.transaction_id,
#                     "proof_file": proof_url,   # ✅ same behavior as POST
#                     "status": payment.status,
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
#                         "program": response_data["program"] if response_data else None,
#                         "package": response_data["package"] if response_data else None,
#                          "payment": payment_data 
#                     }
#                 },
#                 status=status.HTTP_200_OK
#             )

#         except IntegrityError as e:
#             return Response(
#                 {
#                     "message": "Duplicate entry",
#                     "errors": ["Email or Phone already exists."]
#                 },
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         except Exception as e:
#             return Response(
#                 {
#                     "message": "Something went wrong while updating student",
#                     "error": str(e)
#                 },
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )

  
class AddUserAPIView(APIView):

    permission_classes = [IsAdmin | IsSuperAdmin]

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

                # ✅ Prefix logic
                prefix = PROGRAM_PREFIX_MAP.get(program.name)
                first_name = data["first_name"]

                if prefix and not first_name.startswith(prefix):
                    first_name = f"{prefix} - {first_name}"

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
                    assigned_by=request.user.email
                )

                # ✅ Conditional logic (NO extra queries)
                if package.aptitude_test:
                    UserExam.objects.create(
                        user=user,
                        status="not_started"
                    )
                else:
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
                        user.email,
                        password,
                        program.name,
                        package.name
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


# class ConvertLeadAPIView(APIView):
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

#         if User.objects.filter(email=lead.email).exists():
#             return Response(
#                 {"message": "User already exists with this email"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # 🔹 Merge lead data + POST data
#         payload = request.data.copy()
#         payload["first_name"] = lead.first_name
#         payload["last_name"] = lead.last_name
#         payload["email"] = lead.email
#         payload["phone"] = lead.phone

#         serializer = AddUserSerializer(data=payload)

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

#                 # 🔹 Role & Password
#                 student_role = Role.objects.get(name="student")

#                 # Check if password provided
#                 password = serializer.validated_data.get("password")

#                 # Generate password if not provided
#                 if not password:
#                     password = generate_password()

#                 # 🔹 Program prefix logic
#                 program = serializer.validated_data["program"]
#                 prefix = PROGRAM_PREFIX_MAP.get(program.name)

#                 first_name = serializer.validated_data["first_name"]
#                 if prefix and not first_name.startswith(prefix):
#                     first_name = f"{prefix} - {first_name}"

#                 # 🔹 Create User
#                 user = User.objects.create(
#                     first_name=first_name,
#                     last_name=serializer.validated_data["last_name"],
#                     email=serializer.validated_data["email"],
#                     phone=serializer.validated_data.get("phone"),
#                     role=student_role,
#                     is_active=True
#                 )
#                 user.set_password(password)
#                 user.save()

#                 # 🔹 Create Student Profile (FIXED)
#                 student_profile = StudentProfile.objects.create(
#                     user=user,
#                     study_class=serializer.validated_data.get("study_class"),
#                     current_academic_stage=serializer.validated_data.get("current_academic_stage"),
#                     current_academic_year=serializer.validated_data.get("current_academic_year"),
#                     school_college=serializer.validated_data.get("school_college"),
#                     city=serializer.validated_data.get("city"),
#                     preferred_counselling_mode=serializer.validated_data.get(
#                         "preferred_counselling_mode"
#                     ),
#                 )

#                 # 🔹 Assign Program & Package
#                 upp = UserProgramPackage.objects.create(
#                     user=user,
#                     program=serializer.validated_data["program"],
#                     package=serializer.validated_data["package"],
#                     assigned_by="lead-conversion"
#                 )
                
#                # 🔹 Auto-create UserExam if aptitude_test = True
#                 package = serializer.validated_data["package"]

#                 if package.aptitude_test:
#                     UserExam.objects.create(
#                         user=user,
#                         status="in_progress"
#                     )
#                 else:
#                     Booking.objects.create(
#                         student=student_profile,   # ✅ use variable
#                         status="not_booked"
#                     )


#                 # 🔹 Payment (CLEAN LOGIC)
#                 payment = None
#                 amount = serializer.validated_data.get("amount")

#                 if amount:
#                     package = serializer.validated_data["package"]
#                     package_price = package.price

#                     # Decide status
#                     if amount >= package_price:
#                         paymnet_status = "fully_paid"
#                     else:
#                         paymnet_status = "partial_paid"
                        
#                     transaction_id = serializer.validated_data.get("transaction_id")

#                     # Convert blank → None (extra safety)
#                     if not transaction_id:
#                         transaction_id = None

#                     payment = Payment.objects.create(
#                         user=user,
#                         package=package,
#                         amount=amount,
#                         payment_type=serializer.validated_data.get("payment_type"),
#                         method=serializer.validated_data.get("method"),
#                         transaction_id=transaction_id,
#                         proof_file=serializer.validated_data.get("proof_file"),
#                         status=paymnet_status   # ✅ override default
#                     )


#                     # upp.save(update_fields=["payment_status"])

#                 # 🔹 Update Lead
#                 lead.status = "converted"
#                 lead.save(update_fields=["status"])

#                 # 🔹 Send Email
#                 try:
#                     send_credentials_email(user.email, password)
#                 except Exception as e:
#                     print("Email sending failed:", e)
                    
#                 return Response(
#                     {
#                         "message": "Lead converted successfully",
#                         "data": {
#                             "user": UserDetailSerializer(user).data,
#                             "student_profile": StudentProfileDetailSerializer(student_profile).data,
#                             "program_package": UserProgramPackageDetailSerializer(upp).data,
#                             "payment": (
#                                 PaymentDetailSerializer(
#                                     payment,
#                                     context={"request": request}
#                                 ).data if payment else None
#                             )
#                         }
#                     },
#                     status=status.HTTP_201_CREATED
#                 )

#         except Exception as e:
#             return Response(
#                 {
#                     "message": "Lead conversion failed",
#                     "error": str(e)
#                 },
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )

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

        payload = request.data.copy()
        payload["first_name"] = lead.first_name
        payload["last_name"] = lead.last_name

        # 🔹 Check existing user
        existing_user = User.objects.filter(email=lead.email).first()

        # if existing_user:
        #     payload["email"] = existing_user.email
        #     payload["phone"] = existing_user.phone
        # else:
        #     payload["email"] = lead.email
        #     payload["phone"] = lead.phone
        
        payload["email"] = lead.email

        # Use request phone if given, otherwise lead phone
        payload["phone"] = request.data.get("phone") or lead.phone

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

                student_role = Role.objects.get(name="student")

                user = existing_user
                password = None

                # ---------------------------------
                # 🔹 Create User if not exists
                # ---------------------------------
                if not user:

                    password = serializer.validated_data.get("password")

                    if not password:
                        password = generate_password()

                    program = serializer.validated_data["program"]
                    package = serializer.validated_data["package"]
                    prefix = PROGRAM_PREFIX_MAP.get(program.name)

                    first_name = serializer.validated_data["first_name"]

                    if prefix and not first_name.startswith(prefix):
                        first_name = f"{prefix} - {first_name}"

                    user = User.objects.create(
                        first_name=first_name,
                        last_name=serializer.validated_data["last_name"],
                        email=lead.email,
                        phone=serializer.validated_data.get("phone"),
                        role=student_role,
                        is_active=True
                    )

                    user.set_password(password)
                    user.save()
                else:
                    # user already exists → do NOT touch password
                    password = None

                
                    if user.role != student_role:
                        user.role = student_role
                        user.save()

                # ---------------------------------
                # 🔹 Create Student Profile
                # ---------------------------------
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
                )

                # ---------------------------------
                # 🔹 Assign Program & Package
                # ---------------------------------
                upp = UserProgramPackage.objects.create(
                    user=user,
                    program=serializer.validated_data["program"],
                    package=serializer.validated_data["package"],
                    assigned_by="lead-conversion"
                )

                package = serializer.validated_data["package"]

                # ---------------------------------
                # 🔹 Exam or Booking
                # ---------------------------------
                if package.aptitude_test:
                    UserExam.objects.create(
                        user=user,
                        status="not_started"
                    )
                else:
                    Booking.objects.create(
                        student=student_profile,
                        status="not_booked"
                    )

                # ---------------------------------
                # 🔹 Payment
                # ---------------------------------
                # payment = None
                # amount = serializer.validated_data.get("amount")

                # if amount:

                #     package_price = package.price

                #     if amount >= package_price:
                #         payment_status = "fully_paid"
                #     else:
                #         payment_status = "partial_paid"

                #     transaction_id = serializer.validated_data.get("transaction_id")
                    
                #      # Fix for duplicate '' error
                #     if not transaction_id:
                #         transaction_id = None

                #     payment = Payment.objects.create(
                #         user=user,
                #         package=package,
                #         amount=amount,
                #         payment_type=serializer.validated_data.get("payment_type"),
                #         method=serializer.validated_data.get("method"),
                #         transaction_id=transaction_id,
                #         proof_file=serializer.validated_data.get("proof_file"),
                #         status=payment_status
                #     )
                
                # ---------------------------------
                # 🔹 Payment
                # ---------------------------------
                payment = None
                amount = serializer.validated_data.get("amount", 0)

                package_price = package.price

                # ✅ Determine payment status
                if amount == 0:
                    payment_status = "not_paid"
                elif amount < package_price:
                    payment_status = "partial_paid"
                else:
                    payment_status = "fully_paid"

                transaction_id = serializer.validated_data.get("transaction_id")

                # Fix for duplicate '' error
                if not transaction_id:
                    transaction_id = None

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

                # ---------------------------------
                # 🔹 Update Lead
                # ---------------------------------
                lead.status = "converted"
                lead.save(update_fields=["status"])

                # ---------------------------------
                # 🔹 Send Email ONLY if new user created
                # ---------------------------------
                if password:
                    try:
                        send_credentials_email(user.email, password, program.name, package.name)
                    except Exception as e:
                        print("Email sending failed:", e)

                return Response(
                    {
                        "message": "Lead converted successfully",
                        "data": {
                            "user": UserDetailSerializer(user).data,
                            "student_profile": StudentProfileDetailSerializer(student_profile).data,
                            "program_package": UserProgramPackageDetailSerializer(upp).data,
                            "payment": (
                                PaymentDetailSerializer(
                                    payment,
                                    context={"request": request}
                                ).data if payment else None
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

# class StudentRegistrationAPIView(APIView):
#     permission_classes = []

#     @transaction.atomic
#     def post(self, request):
#         serializer = StudentRegistrationSerializer(data=request.data)
#         serializer.is_valid(raise_exception=True)
#         data = serializer.validated_data

#         # Split student name
#         first_name, *last = data["student_name"].split(" ", 1)
#         last_name = last[0] if last else ""

#         # =====================================
#         # ✅ Create Lead Entry
#         # =====================================
#         lead = Lead.objects.create(
#             first_name=first_name,
#             last_name=last_name,
#             phone=data.get("student_mobile") or None,
#             email=data["student_email"],
#             program=data["program"],
#             study_class=data["study_class"],
#             specialization=data.get("specialization"),
#             source="website",
#             status="enquiry",
#             date=timezone.now().date()
#         )

#         # =====================================
#         # ✅ CREATE STUDENT USER
#         # =====================================
#         student_role = Role.objects.get(name="student")

#         student_user, created = User.objects.get_or_create(
#             email=data["student_email"],
#             defaults={
#                 "first_name": first_name,
#                 "last_name": last_name,
#                 "phone": data.get("student_mobile") or None,
#                 "role": student_role,
#                 "is_active": True
#             }
#         )

#         if created:
#             student_password = data.get("password")

#             if not student_password:
#                 student_password = generate_password()

#             student_user.set_password(student_password)
#             student_user.save()
#         else:
#             student_user.phone = data.get("student_mobile") or None
#             student_user.first_name = first_name
#             student_user.last_name = last_name
#             student_user.save()

#         # =====================================
#         # ✅ CREATE PARENT USER
#         # =====================================
#         parent_role = Role.objects.get(name="parent")

#         parent_first, *parent_last = data.get("parent_name", "").split(" ", 1)
#         parent_last_name = parent_last[0] if parent_last else ""

#         parent_user, created = User.objects.get_or_create(
#             email=data["parent_email"],
#             defaults={
#                 "phone": data["parent_mobile"],
#                 "role": parent_role,
#                 "first_name": parent_first,
#                 "last_name": parent_last_name,
#                 "is_active": True
#             }
#         )

#         if created:
#             parent_password = generate_password()
#             parent_user.set_password(parent_password)
#             parent_user.save()
#         else:
#             parent_user.phone = data["parent_mobile"]
#             parent_user.first_name = parent_first
#             parent_user.last_name = parent_last_name
#             parent_user.save()
            
        

#         # =====================================
#         # ✅ CREATE PARENT PROFILE
#         # =====================================
#         parent, parent_created = ParentProfile.objects.get_or_create(
#             user=parent_user
#         )
        
#         # =====================================
#         # ✅ ASSIGN PROGRAM TO STUDENT
#         # =====================================
#         UserProgramPackage.objects.get_or_create(
#             user=student_user,
#             program=data["program"],
            
#         )

#         return Response(
#             {
#                 "message": "Registration successful",
#                 "lead_id": lead.id,
#                 "student_user_id": student_user.id,
#                 "parent_id": parent.id
#             },
#             status=201
#         )     


class StudentRegistrationAPIView(APIView):
    permission_classes = []

    @transaction.atomic
    def post(self, request):
        serializer = StudentRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # ===============================
        # Split student name
        # ===============================
        first_name, *last = data["student_name"].split(" ", 1)
        last_name = last[0] if last else ""

        # ===============================
        # Create Lead
        # ===============================
        # basic_user_role, _ = Role.objects.get_or_create(name="basic_user") 
               
        lead = Lead.objects.create(
            # role=basic_user_role,
            first_name=first_name,
            last_name=last_name,
            phone=data.get("student_mobile") or None,
            email=data["student_email"],
            program=data["program"],
            study_class=data["study_class"],
            specialization=data.get("specialization"),
            source="website",
            status="enquiry",
            date=timezone.now().date()
        )

        # ===============================
        # Create Student User
        # ===============================
        student_role = Role.objects.get(name="basic_user")

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
            student_password = data.get("password")

            if not student_password:
                student_password = generate_password()

            student_user.set_password(student_password)
            student_user.save()

        else:
            student_user.phone = data.get("student_mobile") or None
            student_user.first_name = first_name
            student_user.last_name = last_name
            student_user.save()

        # ===============================
        # Create Parent User
        # ===============================
        parent_role = Role.objects.get(name="parent")

        parent_first, *parent_last = data.get("parent_name", "").split(" ", 1)
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
            parent_user.phone = data.get("parent_mobile") or None
            parent_user.first_name = parent_first
            parent_user.last_name = parent_last_name
            parent_user.save()

        # ===============================
        # Create Parent Profile
        # ===============================
        parent, parent_profile_created = ParentProfile.objects.get_or_create(
            user=parent_user
        )

        # ===============================
        # Assign Program to Student
        # ===============================
        UserProgramPackage.objects.get_or_create(
            user=student_user,
            program=data["program"],
            defaults={
                "assigned_by": "system"
            }
        )

        # ===============================
        # Response
        # ===============================
        return Response(
            {
                "message": "Registration successful",
                "lead_id": lead.id,
                "student_user_id": student_user.id,
                "parent_id": parent.id
            },
            status=status.HTTP_201_CREATED
        )


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

        # Try getting from StudentProfile first
        program = getattr(student, "program", None)
        package = getattr(student, "package", None)

        # If missing, derive from latest payment
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
        # 3️⃣ PAYMENT (Separate Records)
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

        # Determine overall payment status for progress
        if total_paid == 0:
            payment_status = "pending"
        elif total_paid < package_price:
            payment_status = "partial_paid"
        else:
            payment_status = "fully_paid"


        # Add each payment separately in history
        if payments.exists():
            for payment in payments:
                history.append({
                    "step": "Payment",
                    "status": payment.status,  # show actual record status
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
        # 4️⃣ EXAM + REPORT (UPDATED LOGIC)
        # ================================

        exam_status = "not_applicable"
        report_status = "not_applicable"

        upp = (
            UserProgramPackage.objects
            .filter(user=student.user)
            .select_related("package")
            .last()
        )

        package = upp.package if upp else None
        
        aptitude_test_status = False
        if package:
            aptitude_test_status = package.aptitude_test

        if package and package.aptitude_test:

            exam_attempt = (
                UserExam.objects
                .filter(user=student.user)
                .order_by("-created_at")
                .first()
            )

            # ---- EXAM ----
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

            # ---- REPORT ----
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

        else:
            history.append({
                "step": "Exam",
                "status": "not_applicable",
                "date": None,
                "details": "Exam not applicable for this package"
            })

            history.append({
                "step": "Report",
                "status": "not_applicable",
                "date": None,
                "details": "Report not applicable for this package"
            })

        # ================================
        # 5️⃣ SLOT BOOKING
        # ================================
        # booking = Booking.objects.filter(student=student).first()

        # if booking:
        #     slot_status = True
        #     history.append({
        #         "step": "Counselling Slot Booking",
        #         "status": "completed",
        #         "date": booking.created_at,
        #         "details": "Slot booked"
        #     })
        # else:
        #     slot_status = False
        #     history.append({
        #         "step": "Counselling Slot Booking",
        #         "status": "pending",
        #         "date": None,
        #         "details": "Slot not booked"
        #     })
        
        # ================================
        # 5️⃣ SLOT BOOKING
        # ================================

        bookings = Booking.objects.filter(student=student)

        slot_status = "not_booked"
        booking_obj = None

        # Priority logic
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

        # ================================
        # 6️⃣ REVIEW
        # ================================
        # review_status = False  # update when review model exists

        # history.append({
        #     "step": "Review",
        #     "status": "completed" if review_status else "pending",
        #     "date": None,
        #     "details": "Review completed" if review_status else "Pending"
        # })
        review_status = True

        history.append({
            "step": "Review",
            "status": "completed",
            "date": None,
            "details": "Review bypassed"
        })
        
        # ================================
        # FULL ACCESS LOGIC
        # ================================

        full_access = (
            registration_completed
            and counselling_selected
            and payment_status in ["partial_paid", "fully_paid"]
            and exam_status in ["completed"]
            and report_status in ["received_unlocked"]
            and slot_status in ["booked", "rescheduled", "completed"]
            and review_status
        )

        # ================================
        # CURRENT STEP LOGIC
        # ================================
        current_step = 1

        if registration_completed:
            current_step = 2

        if counselling_selected:
            current_step = 3

        if payment_status in ["partial_paid", "fully_paid"]:
            current_step = 4

        if exam_status in ["in_progress", "not_started", "pending_approval", "completed"]:
            current_step = 5

        if report_status in ["received_unlocked", "received_locked"]:
            current_step = 6

        if slot_status in ["not_booked", "booked", "rescheduled", "pending", "completed"]:
            current_step = 7

        # Review bypassed
        current_step = max(current_step, 8)

        # ================================
        # FINAL RESPONSE
        # ================================
        response_data = {
            "aptitude_test": aptitude_test_status,
            "progress": {
                "registration": registration_completed,
                "counselling_service": counselling_selected,
                "payment": payment_status,
                "exam": exam_status,
                "report": report_status,
                "counselling_slot_booking": slot_status,
                "review": review_status,
                "full_access": full_access,
                "current_step": current_step
            },
            "payment_summary": {
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
                "payments": [
                    {
                        "payment_id": p.id,
                        "amount": float(p.amount),
                        "status": p.status,
                        "payment_type": p.payment_type,
                        "method": p.method,
                        "transaction_id": p.transaction_id,
                        "date": p.created_at.date(),
                    }
                    for p in payments
                ]
            },
            "history": history
        }

        return Response(response_data)