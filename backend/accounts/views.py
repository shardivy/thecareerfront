from collections import defaultdict
from itertools import chain

from django.shortcuts import get_object_or_404, render
from django.contrib.auth.hashers import check_password
from event.models import HandHoldingParticipant, HandHoldingParticipantSession
from content.models import Content
from exam.models import UserExam
from django.db.models.functions import TruncMonth
from datetime import datetime
from payment.models import Payment
from report.models import Report
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import transaction
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.hashers import make_password
from django.db.models import Count, Q, OuterRef, Subquery, Sum
from django.utils.timezone import now
from decimal import Decimal
from calendar import month_abbr
from calendar import monthrange
from dateutil.relativedelta import relativedelta
from django.db.models.functions import ExtractYear

from accounts.permissions import IsAdmin, IsSuperAdmin
from accounts.serializers import HandholdingUsersListSerializer, PermissionSerializer, RolePermissionSerializer, RoleSerializer, StudentListSerializer, UserSerializer
from lead_registration.models import Hobby, Lead, ParentProfile, Stream, StudentAcademicHistory, StudentHobby, StudentProfile, StudentStream, StudentSubjectPreference, Subject
from program_package.models import Package, UserProgramPackage
from counselling_slot.models import Booking, Counsellor

from .models import PasswordResetOTP, Permission, Role, RolePermission, User
from .utils import  generate_otp, generate_password, generate_role_id, send_credentials_email, send_otp_email, send_password_reset_email, send_user_credentials_email


class RoleListCreateAPIView(APIView):
    """
    GET /roles
    POST /roles
    """
    permission_classes = [AllowAny]

    def get(self, request):
        roles = Role.objects.all()
        serializer = RoleSerializer(roles, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = RoleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Role created successfully", "data": serializer.data},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RoleUpdateAPIView(APIView):
    """
    PUT /roles/{role_id}
    """
    permission_classes = [AllowAny]
    def put(self, request, role_id):
        role = get_object_or_404(Role, id=role_id)
        serializer = RoleSerializer(role, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Role updated successfully", "data": serializer.data},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class PermissionListCreateAPIView(APIView):
    """
    GET /permissions
    POST /permissions
    """
    permission_classes = [AllowAny]
    def get(self, request):
        permissions = Permission.objects.all()
        serializer = PermissionSerializer(permissions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = PermissionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Permission created successfully", "data": serializer.data},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class AssignPermissionsToRoleAPIView(APIView):
    """
    POST /roles/{role_id}/permissions
    """
    permission_classes = [AllowAny]

    def post(self, request, role_id):
        role = get_object_or_404(Role, id=role_id)
        permission_ids = request.data.get("permission_ids", [])

        if not permission_ids:
            return Response(
                {"message": "permission_ids is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        created_permissions = []

        for perm_id in permission_ids:
            permission = get_object_or_404(Permission, id=perm_id)
            obj, created = RolePermission.objects.get_or_create(
                role=role,
                permission=permission
            )
            if created:
                created_permissions.append(permission.code)

        return Response(
            {
                "message": "Permissions assigned successfully",
                "assigned_permissions": created_permissions
            },
            status=status.HTTP_200_OK
        )


class RolePermissionListAPIView(APIView):
    """
    GET /roles/{role_id}/permissions
    """
    permission_classes = [AllowAny]
    def get(self, request, role_id):
        role = get_object_or_404(Role, id=role_id)
        role_permissions = RolePermission.objects.filter(role=role)
        serializer = RolePermissionSerializer(role_permissions, many=True)

        return Response(
            {
                "role": role.name,
                "permissions": serializer.data
            },
            status=status.HTTP_200_OK
        )

# class AdminStaffRegisterAPIView(APIView):
#     permission_classes = [AllowAny]

#     @transaction.atomic
#     def post(self, request):
#         data = request.data

#         email = data.get("email")
#         password = data.get("password")
#         role_name = data.get("role")

#         first_name = data.get("first_name")
#         last_name = data.get("last_name")
#         phone = data.get("phone")

#         # Counsellor specific
#         specialization = data.get("specialization")

#         # -----------------------------
#         # 1. BASIC VALIDATION
#         # -----------------------------
#         if not email or not password or not role_name:
#             return Response(
#                 {"error": "Email, password and role are required"},
#                 status=400
#             )

#         # -----------------------------
#         # 2. ROLE WHITELIST
#         # -----------------------------
#         allowed_roles = ["super_admin", "admin", "counsellor"]

#         if role_name not in allowed_roles:
#             return Response(
#                 {"error": "You are not allowed to register with this role"},
#                 status=403
#             )

#         # -----------------------------
#         # 3. DUPLICATE CHECK
#         # -----------------------------
#         if User.objects.filter(email=email).exists():
#             return Response(
#                 {"error": "Email already registered"},
#                 status=400
#             )

#         if phone and User.objects.filter(phone=phone).exists():
#             return Response(
#                 {"error": "Phone already registered"},
#                 status=400
#             )

#         # -----------------------------
#         # 4. ROLE FETCH
#         # -----------------------------
#         role = Role.objects.filter(name=role_name).first()
#         if not role:
#             return Response(
#                 {"error": "Role not configured"},
#                 status=500
#             )

#         # -----------------------------
#         # 5. CREATE USER
#         # -----------------------------
#         user = User.objects.create_user(
#             email=email,
#             password=password,
#             role=role,
#             first_name=first_name,
#             last_name=last_name,
#             phone=phone,
#             is_staff=True,
#             is_active=True
#         )

#         # -----------------------------
#         # 6. GENERATE ROLE BASED ID
#         # -----------------------------
#         user.public_id = generate_role_id(
#             role_name,
#             User,
#             "public_id"
#         )
#         user.save()

#         # -----------------------------
#         # 7. CREATE COUNSELLOR PROFILE
#         # -----------------------------
#         if role_name == "counsellor":

#             Counsellor.objects.create(
#                 user=user,
#                 specialization=specialization,
#                 is_active=True
#             )

#         return Response(
#             {
#                 "message": "User registered successfully",
#                 "user": {
#                     "email": user.email,
#                     "role": role_name,
#                     "user_id": user.public_id
#                 }
#             },
#             status=201
#         )

class AdminStaffRegisterAPIView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        data = request.data

        email = data.get("email")
        password = data.get("password")  # optional
        role_name = data.get("role")

        first_name = data.get("first_name")
        last_name = data.get("last_name")
        phone = data.get("phone")
        specialization = data.get("specialization")

        # -----------------------------
        # 1. BASIC VALIDATION
        # -----------------------------
        if not email or not role_name:
            return Response(
                {"error": "Email and role are required"},
                status=400
            )

        # -----------------------------
        # 2. ROLE WHITELIST
        # -----------------------------
        allowed_roles = ["super_admin", "admin", "counsellor", "ui_ux"]

        if role_name not in allowed_roles:
            return Response(
                {"error": "You are not allowed to register with this role"},
                status=403
            )

        # -----------------------------
        # 3. DUPLICATE CHECK
        # -----------------------------
        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "Email already registered"},
                status=400
            )

        if phone and User.objects.filter(phone=phone).exists():
            return Response(
                {"error": "Phone already registered"},
                status=400
            )

        # -----------------------------
        # 4. ROLE FETCH
        # -----------------------------
        role = Role.objects.filter(name=role_name).first()
        if not role:
            return Response(
                {"error": "Role not configured"},
                status=500
            )

        # -----------------------------
        # 5. AUTO GENERATE PASSWORD IF NOT PROVIDED
        # -----------------------------
        if not password:
            password = generate_password()

        # -----------------------------
        # 6. CREATE USER
        # -----------------------------
        user = User.objects.create_user(
            email=email,
            password=password,
            role=role,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            is_staff=True,
            is_active=True
        )

        # -----------------------------
        # 7. GENERATE ROLE BASED ID
        # -----------------------------
        user.public_id = generate_role_id(
            role_name,
            User,
            "public_id"
        )
        user.save()

        # -----------------------------
        # 8. CREATE COUNSELLOR PROFILE
        # -----------------------------
        if role_name == "counsellor":
            Counsellor.objects.create(
                user=user,
                specialization=specialization,
                is_active=True
            )

        # -----------------------------
        # 9. ALWAYS SEND EMAIL
        # -----------------------------
        send_user_credentials_email(email, password)

        return Response(
            {
                "message": "User registered successfully",
                "user": {
                    "email": user.email,
                    "role": role_name,
                    "user_id": user.public_id
                }
            },
            status=201
        )
        
    # =====================================
    # ✅ UPDATE STAFF USER
    # =====================================
    @transaction.atomic
    def put(self, request, user_id):
        data = request.data

        try:
            user = User.objects.get(public_id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=404
            )

        email = data.get("email")
        phone = data.get("phone")
        first_name = data.get("first_name")
        last_name = data.get("last_name")
        role_name = data.get("role")
        specialization = data.get("specialization")

        # -----------------------------
        # 1. ROLE WHITELIST
        # -----------------------------
        allowed_roles = ["super_admin", "admin", "counsellor", "ui_ux"]

        if role_name and role_name not in allowed_roles:
            return Response(
                {"error": "Invalid role"},
                status=403
            )

        # -----------------------------
        # 2. DUPLICATE CHECK
        # -----------------------------
        if email and User.objects.exclude(id=user.id).filter(email=email).exists():
            return Response(
                {"error": "Email already registered"},
                status=400
            )

        if phone and User.objects.exclude(id=user.id).filter(phone=phone).exists():
            return Response(
                {"error": "Phone already registered"},
                status=400
            )

        # -----------------------------
        # 3. UPDATE USER FIELDS
        # -----------------------------
        if email:
            user.email = email

        if phone:
            user.phone = phone

        if first_name:
            user.first_name = first_name

        if last_name:
            user.last_name = last_name

        # -----------------------------
        # 4. UPDATE ROLE
        # -----------------------------
        if role_name:
            role = Role.objects.filter(name=role_name).first()
            if not role:
                return Response(
                    {"error": "Role not configured"},
                    status=500
                )

            user.role = role

        user.save()

        # -----------------------------
        # 5. UPDATE COUNSELLOR PROFILE
        # -----------------------------
        if role_name == "counsellor":
            counsellor, created = Counsellor.objects.get_or_create(user=user)

            if specialization:
                counsellor.specialization = specialization

            counsellor.is_active = True
            counsellor.save()

        return Response(
            {
                "message": "User updated successfully",
                "user": {
                    "email": user.email,
                    "role": user.role.name,
                    "user_id": user.public_id
                }
            },
            status=200
        )
        
    # =====================================
    # ✅ GET ALL STAFF USERS
    # =====================================
    def get(self, request):

        allowed_roles = ["counsellor", "ui_ux"]

        users = User.objects.select_related("role").filter(
            role__name__in=allowed_roles
        )

        response_data = []

        for user in users:
            counsellor = Counsellor.objects.filter(user=user).first()

            response_data.append({
                "user_id": user.public_id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "phone": user.phone,
                "role": user.role.name if user.role else None,
                "specialization": counsellor.specialization if counsellor else None,
                "created_at": user.created_at,
            })

        return Response(response_data)
    
    # =====================================
    # ✅ DELETE STAFF USER
    # =====================================
    @transaction.atomic
    def delete(self, request, user_id):
        try:
            user = User.objects.get(public_id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=404
            )

        # Optional: delete counsellor profile
        Counsellor.objects.filter(user=user).delete()

        user.delete()

        return Response(
            {"message": "User deleted successfully"},
            status=200
        )



# class LoginAPIView(APIView):
#     permission_classes = [AllowAny]

#     def post(self, request):
#         email = request.data.get("email")
#         password = request.data.get("password")

#         # ==========================
#         # 1️⃣ Validate credentials
#         # ==========================
#         if not email:
#             return Response(
#                 {"error": "Email is required"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
#         if not password:
#             return Response(
#                 {"error": "Password is required"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # Debug: Print login attempt
#         print(f"\n=== LOGIN ATTEMPT ===")
#         print(f"Email: {email}")
#         print(f"Password provided: {password}")

#         # ==========================
#         # 2️⃣ Find user
#         # ==========================
#         user = User.objects.filter(email=email).first()

#         if not user:
#             print(f"User not found with email: {email}")
#             return Response(
#                 {"error": "Email not registered"},
#                 status=status.HTTP_404_NOT_FOUND
#             )

#         # Debug: Print user info
#         print(f"User found: {user.email}")
#         print(f"User role: {user.role.name if user.role else 'None'}")
#         print(f"User is_active: {user.is_active}")
#         print(f"Stored password hash: {user.password}")
#         print(f"Password length: {len(user.password) if user.password else 0}")

#         # ==========================
#         # 3️⃣ Password check with detailed debugging
#         # ==========================
#         password_valid = False

#         # ✅ FIRST check handholding approval BEFORE password validation
#         if user.role and user.role.name.lower() == "handholding":

#             handholding_profile = HandHoldingParticipant.objects.filter(
#                 Q(user=user) | Q(email__iexact=user.email)
#             ).first()

#             if not handholding_profile:
#                 print("✗ HandHoldingParticipant profile not found")
#                 print(f"User ID: {user.id}")
#                 print(f"Email: {user.email}")

#                 return Response(
#                     {
#                         "error": (
#                             "Your admission is under review. "
#                             "Please contact admin for further next steps."
#                         )
#                     },
#                     status=status.HTTP_403_FORBIDDEN
#                 )

#         # ==========================
#         # Method 1: Check with Django's check_password
#         # ==========================
#         try:
#             if user.check_password(password):
#                 password_valid = True
#                 print("✓ Password valid via check_password()")
#         except Exception as e:
#             print(f"✗ check_password() error: {str(e)}")

#         # ==========================
#         # Method 2: Fallback for plain text passwords
#         # ==========================
#         if not password_valid and user.password == password:
#             print("✓ Password valid via plain text match - upgrading to hash")
#             user.set_password(password)
#             user.save(update_fields=["password"])
#             password_valid = True

#         # ==========================
#         # Method 3: Emergency Fix for improperly stored passwords
#         # ==========================
#         if not password_valid:
#             try:
#                 # Temporary fallback for handholding/manual registrations
#                 if password == request.data.get("password"):
#                     print("⚠ Password mismatch detected - resetting password")
#                     user.set_password(password)
#                     user.save(update_fields=["password"])
#                     password_valid = True
#                     print("✓ Password reset and validated")
#             except Exception as e:
#                 print(f"✗ Emergency fix failed: {str(e)}")

#         # ==========================
#         # Final Password Failure
#         # ==========================
#         if not password_valid:
#             print("✗ Password validation failed")
#             return Response(
#                 {"error": "Incorrect password"},
#                 status=status.HTTP_401_UNAUTHORIZED
#             )
#         # ==========================
#         # 4️⃣ User validations
#         # ==========================
#         if not user.is_active:
#             print("✗ User is inactive")
#             return Response(
#                 {"error": "Account is inactive"},
#                 status=status.HTTP_403_FORBIDDEN
#             )

#         if not user.role:
#             print("✗ User has no role")
#             return Response(
#                 {"error": "User role not assigned. Contact admin."},
#                 status=status.HTTP_403_FORBIDDEN
#             )

#         # ==========================
#         # 5️⃣ Determine role
#         # ==========================
#         actual_role = user.role.name.lower()
#         print(f"User role: {actual_role}")

#         allowed_roles = [
#             "superadmin", "admin", "lead_counsellor", 
#             "counsellor", "student", "parent", "ui_ux", "basic_user", "handholding"
#         ]

#         if actual_role not in allowed_roles:
#             print(f"✗ Invalid role: {actual_role}")
#             return Response(
#                 {"error": "Invalid user role"},
#                 status=status.HTTP_403_FORBIDDEN
#             )
            
#         # ==========================
#         # ✅ HAND HOLDING APPROVAL CHECK
#         # ==========================
#         if actual_role == "handholding":

#             # Check by user OR email because some users may exist
#             # but participant profile may not yet be created
#             handholding_profile = HandHoldingParticipant.objects.filter(
#                 Q(user=user) | Q(email__iexact=user.email)
#             ).first()

#             if not handholding_profile:
#                 print("✗ HandHoldingParticipant profile not found")
#                 print(f"User ID: {user.id}")
#                 print(f"Email: {user.email}")

#                 return Response(
#                     {
#                         "error": (
#                             "Your admission is under review. "
#                             "Please contact admin for further next steps."
#                         )
#                     },
#                     status=status.HTTP_403_FORBIDDEN
#                 )

#         # ==========================
#         # 6️⃣ Generate response (simplified)
#         # ==========================
#         from rest_framework_simplejwt.tokens import RefreshToken
#         refresh = RefreshToken.for_user(user)
        
#         user_package = user.userprogrampackage_set.first()

#         aptitude_test_status = False
#         is_handholding_status = False

#         if user_package and user_package.package:
#             aptitude_test_status = user_package.package.aptitude_test
#             is_handholding_status = user_package.package.is_handholding
         
#         response_data = {
#             "access": str(refresh.access_token),
#             "refresh": str(refresh),
#             "user": {
#                 "email": user.email,
#                 "role": actual_role,
#                 "user_id": user.id,
#                 "first_name": user.first_name,
#                 "last_name": user.last_name,
#                 "phone": user.phone,
                
#             },
#             "aptitude_test": aptitude_test_status,
#             "is_handholding": is_handholding_status,
#             "message": "Login Successfully.",
#             # "debug": {
#             #     "password_validation": "success",
#             #     "user_found": True
#             # }
            
#         }
#         # Fetch student profile
#         student_profile = StudentProfile.objects.filter(user=user).first()

#         # Add profile completion status only for student
#         if actual_role == "student" and student_profile:
#             response_data["complete_profile"] = student_profile.is_profile_complete

#         print("✓ Login successful!")
#         print(f"=== END LOGIN ===\n")
#         return Response(response_data, status=status.HTTP_200_OK)

class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        # ==========================
        # 1️⃣ Validate credentials
        # ==========================
        if not email:
            return Response(
                {"error": "Email is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not password:
            return Response(
                {"error": "Password is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Debug: Print login attempt
        print(f"\n=== LOGIN ATTEMPT ===")
        print(f"Email: {email}")
        print(f"Password provided: {password}")

        # ==========================
        # 2️⃣ Find user
        # ==========================
        user = User.objects.filter(email=email).first()
        if user:
            print("User ID:", user.id)
            print("User Email:", user.email)
            print("User Active:", user.is_active)

        if not user:
            print(f"User not found with email: {email}")
            return Response(
                {"error": "Email not registered"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Debug: Print user info
        print(f"User found: {user.email}")
        print(f"User role: {user.role.name if user.role else 'None'}")
        print(f"User is_active: {user.is_active}")
        print(f"Stored password hash: {user.password}")
        print(f"Password length: {len(user.password) if user.password else 0}")

        # ==========================
        # 3️⃣ Password check with detailed debugging
        # ==========================
        password_valid = False

        print("================================")
        print("LOGIN DEBUG")
        print("Email:", email)
        print("Password Received:", repr(password))
        print("Password Length:", len(password))
        print("Stored Hash:", user.password)

        try:
            print(
                "Direct Check Password Result:",
                user.check_password(password)
            )
        except Exception as e:
            print("Check Password Error:", str(e))

        print("================================")

        # ✅ FIRST check handholding approval BEFORE password validation
        if user.role and user.role.name.lower() == "handholding":

            handholding_profile = HandHoldingParticipant.objects.filter(
                Q(user=user) | Q(email__iexact=user.email)
            ).first()

            if not handholding_profile:
                print("✗ HandHoldingParticipant profile not found")
                print(f"User ID: {user.id}")
                print(f"Email: {user.email}")

                return Response(
                    {
                        "error": (
                            "Your admission is under review. "
                            "Please contact admin for further next steps."
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # ==========================
        # Method 1: Check with Django's check_password
        # ==========================
        try:
            if user.check_password(password):
                password_valid = True
                print("✓ Password valid via check_password()")
        except Exception as e:
            print(f"✗ check_password() error: {str(e)}")

        # ==========================
        # Method 2: Fallback for plain text passwords
        # ==========================
        # if not password_valid and user.password == password:
        #     print("✓ Password valid via plain text match - upgrading to hash")
        #     user.set_password(password)
        #     user.save(update_fields=["password"])
        #     password_valid = True
        # if not user.check_password(password):
        #     return Response(
        #         {"error": "Incorrect password"},
        #         status=status.HTTP_400_BAD_REQUEST
        #     )


        # ==========================
        # Method 3: Emergency Fix for improperly stored passwords
        # ==========================
        # if not password_valid:
        #     try:
        #         # Temporary fallback for handholding/manual registrations
        #         if password == request.data.get("password"):
        #             print("⚠ Password mismatch detected - resetting password")
        #             user.set_password(password)
        #             user.save(update_fields=["password"])
        #             password_valid = True
        #             print("✓ Password reset and validated")
        #     except Exception as e:
        #         print(f"✗ Emergency fix failed: {str(e)}")

        # ==========================
        # Final Password Failure
        # ==========================
        if not password_valid:
            print("✗ Password validation failed")
            return Response(
                {"error": "Incorrect password"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        # ==========================
        # 4️⃣ User validations
        # ==========================
        if not user.is_active:
            print("✗ User is inactive")
            return Response(
                {"error": "Account is inactive"},
                status=status.HTTP_403_FORBIDDEN
            )

        if not user.role:
            print("✗ User has no role")
            return Response(
                {"error": "User role not assigned. Contact admin."},
                status=status.HTTP_403_FORBIDDEN
            )

        # ==========================
        # 5️⃣ Determine role
        # ==========================
        actual_role = user.role.name.lower()
        print(f"User role: {actual_role}")

        allowed_roles = [
            "superadmin", "admin", "lead_counsellor", 
            "counsellor", "student", "parent", "ui_ux", "basic_user", "handholding"
        ]

        if actual_role not in allowed_roles:
            print(f"✗ Invalid role: {actual_role}")
            return Response(
                {"error": "Invalid user role"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # ==========================
        # ✅ HAND HOLDING APPROVAL CHECK
        # ==========================
        if actual_role == "handholding":

            # Check by user OR email because some users may exist
            # but participant profile may not yet be created
            handholding_profile = HandHoldingParticipant.objects.filter(
                Q(user=user) | Q(email__iexact=user.email)
            ).first()

            if not handholding_profile:
                print("✗ HandHoldingParticipant profile not found")
                print(f"User ID: {user.id}")
                print(f"Email: {user.email}")

                return Response(
                    {
                        "error": (
                            "Your admission is under review. "
                            "Please contact admin for further next steps."
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # ==========================
        # 6️⃣ Generate response (simplified)
        # ==========================
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        
        user_package = user.userprogrampackage_set.first()

        aptitude_test_status = False
        is_handholding_status = False

        if user_package and user_package.package:
            aptitude_test_status = user_package.package.aptitude_test
            is_handholding_status = user_package.package.is_handholding
            
        program_packages = []

        if actual_role == "student":
            user_programs = UserProgramPackage.objects.select_related(
                "program",
                "package"
            ).filter(user=user, package__isnull=False)

            program_packages = [
                {
                    "program_id": upp.program.id if upp.program else None,
                    "program_name": upp.program.name if upp.program else None,
                    "package_id": upp.package.id if upp.package else None,
                    "package_name": upp.package.name if upp.package else None,
                    "package_price": upp.package.price if upp.package else None,
                    "aptitude_test": (
                        upp.package.aptitude_test
                        if upp.package else False
                    ),
                    "engineering_test_analysis": (
                        upp.package.engineering_test_analysis
                        if upp.package else False
                    ),
                }
                for upp in user_programs
            ]
         
        response_data = {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "email": user.email,
                "role": actual_role,
                "user_id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "phone": user.phone,
                
            },
            "program_packages": program_packages,
            "is_handholding": is_handholding_status,
            "message": "Login Successfully.",
            # "debug": {
            #     "password_validation": "success",
            #     "user_found": True
            # }
            
        }
        # Fetch student profile
        student_profile = StudentProfile.objects.filter(user=user).first()

        # Add profile completion status only for student
        if actual_role == "student" and student_profile:
            response_data["complete_profile"] = student_profile.is_profile_complete

        print("✓ Login successful!")
        print(f"=== END LOGIN ===\n")
        return Response(response_data, status=status.HTTP_200_OK)
       
    
    
    
class ForgotPasswordAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")

        if not email:
            return Response({"error": "Email is required"}, status=400)

        user = User.objects.filter(email=email).first()
        if not user:
            return Response({"error": "User not found"}, status=404)

        otp = generate_otp()
        PasswordResetOTP.objects.create(user=user, otp=otp)

        # send OTP email
        send_otp_email(email, otp)

        return Response({
            "success": True,
            "message": "OTP sent to your email"
        })
        
class VerifyOTPAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        otp = request.data.get("otp")

        if not email or not otp:
            return Response({"error": "Email and OTP are required"}, status=400)

        user = User.objects.filter(email=email).first()
        if not user:
            return Response({"error": "User not found"}, status=404)

        # Get the latest OTP for this user
        otp_entry = PasswordResetOTP.objects.filter(user=user, otp=otp).order_by('-created_at').first()
        if not otp_entry:
            return Response({"error": "Invalid OTP"}, status=400)

        # Check if OTP is expired (10 minutes)
        if timezone.now() > otp_entry.created_at + timedelta(minutes=10):
            return Response({"error": "OTP has expired"}, status=400)

        # OTP is valid
        otp_entry.delete()  # optional: delete OTP after successful verification

        return Response({
            "success": True,
            "message": "OTP verified successfully",
            "user_id": user.id  # optional: can be used for resetting password next
        })
        
class ResetPasswordAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")  # use email
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        if not email or not new_password or not confirm_password:
            return Response({"error": "Email, new password and confirm password are required"}, status=400)

        if new_password != confirm_password:
            return Response({"error": "Passwords do not match"}, status=400)

        user = User.objects.filter(email=email).first()
        if not user:
            return Response({"error": "User not found"}, status=404)

        # Reset password
        user.password = make_password(new_password)
        user.save()

        # 📧 Send email after successful reset
        send_password_reset_email(user.email, new_password)

        return Response({
            "success": True,
            "message": "Your password has been updated successfully. A confirmation email has been sent."
        })
        
# class ProfileUpdateAPIView(APIView):
#     permission_classes = [IsAuthenticated]
    
#     def get(self, request):
#         user = request.user

#         student_profile = None

#         if user.role and user.role.name.lower() == "student":
#             try:
#                 student_profile = StudentProfile.objects.get(user=user)
#             except StudentProfile.DoesNotExist:
#                 pass

#         response_data = {
#             "id": user.id,
#             "student_id": student_profile.id if student_profile else None,
#             "first_name": user.first_name,
#             "last_name": user.last_name,
#             "email": user.email,
#             "phone": user.phone,
#             "role": user.role.name if user.role else None,
#             "is_active": user.is_active,
#             "is_converted_lead": user.is_converted_lead,
#             "created_at": user.created_at
#         }
#         # ==========================
#         # 🔹 Handholding Info
#         # ==========================
            
#         if user.role and user.role.name.lower() == "handholding":

#                 participant = HandHoldingParticipant.objects.filter(user=user).first()

#                 if participant:
#                     payment = Payment.objects.filter(
#                         user=user,
#                         proof_file__isnull=False
#                     ).exclude(proof_file="").order_by("-created_at").first()
                    
#                     response_data.update({
#                         "participant_id": participant.id,
#                         "mobile": participant.mobile,
#                         "email": participant.email,
#                         "show_profile": participant.show_profile,
#                         "full_address": participant.full_address,
#                         "city": participant.city,
#                         "state": participant.state,
#                         "pincode": participant.pincode,
#                         "preferred_counselling_mode": participant.preferred_counselling_mode,
#                         "total_sessions": participant.total_sessions,
#                         "completed_sessions": participant.completed_sessions,
#                         "status": participant.status,
#                         "certificate_issued": participant.certificate_issued,
#                         "photo": request.build_absolute_uri(participant.photo.url)
#                             if participant.photo else None,
#                         "resume_file": request.build_absolute_uri(participant.resume_file.url)
#                             if participant.resume_file else None,
#                         "proof_file": request.build_absolute_uri(payment.proof_file.url)
#                             if payment and payment.proof_file else None,
#                         "created_at": participant.created_at
#                     })
#                 else:
#                     response_data["handholding"] = None
            
        

#         if student_profile:

#             # ==========================
#             # 🔹 Basic Student Info
#             # ==========================
#             response_data.update({
#                 "study_class": student_profile.study_class,
#                 "specialization": student_profile.specialization,
#                 "current_academic_year": student_profile.current_academic_year,
#                 "school_college": student_profile.school_college,
#                 "city": student_profile.city,
#                 "previous_class_percentage": student_profile.previous_class_percentage,
#                 "board_exam_year": student_profile.board_exam_year,
#                 "improvement_areas": student_profile.improvement_areas,
#                 "preferred_counselling_mode": student_profile.preferred_counselling_mode,
#                 "dob": student_profile.dob,
#                 "complete_profile": student_profile.is_profile_complete
#             })
            
            
#             # ==========================
#             # 🔹 Parent Info
#             # ==========================
#             if student_profile.parent:
#                 parent = student_profile.parent
#                 response_data["parent"] = {
#                     "parent_name": f"{parent.user.first_name} {parent.user.last_name}" if parent.user else None,
#                     "profession": parent.profession,
#                     "organization_name": parent.organization_name,
#                     "education_level": parent.education_level,
#                     "father_background": parent.father_background,
#                     "mother_background": parent.mother_background,
#                     "location": parent.location,
#                     "annual_income_range": parent.annual_income_range,
#                     "expectations_from_student": parent.expectations_from_student
#                 }
#             else:
#                 response_data["parent"] = None

#             # ==========================
#             # 🔹 Academic History
#             # ==========================
#             academic_records = StudentAcademicHistory.objects.filter(
#                 student_profile=student_profile
#             )

#             response_data["academic_history"] = [
#                 {
#                     "academic_stage": record.academic_stage,
#                     "start_year": record.start_year,
#                     "end_year": record.end_year,
#                     "board_name": record.board_name,
#                     "coaching_entrance": record.coaching_entrance,
#                     "current_class_percentage": record.current_class_percentage,
#                     "special_notes": record.special_notes,
#                     "is_current": record.is_current
#                 }
#                 for record in academic_records
#             ]

#             # ==========================
#             # 🔹 Stream
#             # ==========================
#             # stream = StudentStream.objects.filter(
#             #     student_profile=student_profile
#             # ).select_related("stream").first()

#             # response_data["stream"] = {
#             #     "stream_id": stream.stream.id,
#             #     "stream_name": stream.stream.name
#             # } if stream else None
#             response_data["stream"] = student_profile.stream

#             # ==========================
#             # 🔹 Subject Preferences
#             # ==========================
#             preferences = StudentSubjectPreference.objects.filter(
#                 student_profile=student_profile
#             ).select_related("subject")

#             liked_subjects = []
#             disliked_subjects = []
#             moderate_subjects = []

#             for pref in preferences:
#                 subject_data = {
#                     "id": pref.subject.id,
#                     "name": pref.subject.name
#                 }

#                 if pref.preference_type == "like":
#                     liked_subjects.append(subject_data)
#                 elif pref.preference_type == "dislike":
#                     disliked_subjects.append(subject_data)
#                 elif pref.preference_type == "moderate":
#                     moderate_subjects.append(subject_data)

#             response_data["liked_subjects"] = liked_subjects
#             response_data["disliked_subjects"] = disliked_subjects
#             response_data["moderate_subjects"] = moderate_subjects
#             # ==========================
#             # 🔹 Hobbies
#             # ==========================
#             hobbies = StudentHobby.objects.filter(
#                 student_profile=student_profile
#             ).select_related("hobby")

#             response_data["hobbies"] = [
#                 {
#                     "id": hobby.hobby.id,
#                     "name": hobby.hobby.name
#                 }
#                 for hobby in hobbies
#             ]

#         # ==========================
#         # 🔹 Program & Package
#         # ==========================
#         # if user.role and user.role.name.lower() == "student":
            
#         #     upp = UserProgramPackage.objects.select_related("package", "program").filter(user=user).first()

#         #     aptitude_test_status = False

#         #     if upp:
#         #         if upp.package:
#         #             aptitude_test_status = upp.package.aptitude_test

#         #         response_data.update({
#         #             "program_id": upp.program.id if upp.program else None,
#         #             "program": upp.program.name if upp.program else None,
#         #             "package_id": upp.package.id if upp.package else None,
#         #             "package": upp.package.name if upp.package else None,
#         #             "aptitude_test": aptitude_test_status,
#         #             "engineering_test_analysis": upp.package.engineering_test_analysis if upp.package else False
#         #         })
#         #     else:
#         #         response_data["aptitude_test"] = False
#         # upp = UserProgramPackage.objects.select_related("package", "program").filter(user=user).first()
#         upp = UserProgramPackage.objects.select_related("package", "program")\
#             .filter(user=user)\
#             .order_by("-id")\
#             .first()

#         print("DEBUG UPP:", upp) 

#         if upp:
#             response_data.update({
#                 "program_id": upp.program.id if upp.program else None,
#                 "program": upp.program.name if upp.program else None,
#                 "package_id": upp.package.id if upp.package else None,
#                 "package": upp.package.name if upp.package else None,
#                 "aptitude_test": upp.package.aptitude_test if upp.package else False,
#                 "engineering_test_analysis": upp.package.engineering_test_analysis if upp.package else False
#             })
#         else:
#             print("❌ No valid package found for user:", user.id)
#             response_data.update({
#                 "program_id": None,
#                 "program": None,
#                 "package_id": None,
#                 "package": None,
#                 "aptitude_test": False,
#                 "engineering_test_analysis": False
#             })

#         # ✅ MOVE THIS OUTSIDE
#         payments = Payment.objects.filter(user=user).order_by("-created_at")

#         response_data["payments"] = [
#             {
#                 "payment_id": payment.id,
#                 "amount": payment.amount,
#                 "payment_type": payment.payment_type,
#                 "method": payment.method,
#                 "transaction_id": payment.transaction_id,
#                 "proof_file": request.build_absolute_uri(payment.proof_file.url)
#                 if payment.proof_file else None,
#                 "status": payment.status,
#                 "created_at": payment.created_at
#             }
#             for payment in payments
#         ]

#         return Response(response_data)
    
    
#     # @transaction.atomic
#     # def put(self, request):
#     #     print(">>> PUT request received at view <<<")
#     #     print(f"Request path: {request.path}")
#     #     print(f"Request method: {request.method}")
        
#     #     user = request.user
#     #     data = request.data

#     #     if 'email' in data:
#     #         return Response({"error": "Email cannot be updated"}, status=400)

#     #     if 'role' in data:
#     #         return Response({"error": "Role cannot be updated"}, status=400)
        
#     #     # ==========================
#     #     # 🔹 Validate Preferences & Hobbies (Only for students)
#     #     # ==========================
#     #     # Only validate if user is a student (handholding users don't need these)
#     #     if user.role and user.role.name.lower() == "student":
#     #         liked_subject_ids = data.get("liked_subject_ids")
#     #         disliked_subject_ids = data.get("disliked_subject_ids")
#     #         hobby_ids = data.get("hobby_ids")

#     #         errors = {}

#     #         if liked_subject_ids is not None and len(liked_subject_ids) == 0:
#     #             errors["liked_subjects"] = "Liked subjects are compulsory to complete the profile"

#     #         if disliked_subject_ids is not None and len(disliked_subject_ids) == 0:
#     #             errors["disliked_subjects"] = "Disliked subjects are compulsory to complete the profile"

#     #         if hobby_ids is not None and len(hobby_ids) == 0:
#     #             errors["hobbies"] = "Hobbies are compulsory to complete the profile"

#     #         if errors:
#     #             return Response(errors, status=status.HTTP_400_BAD_REQUEST)

#     #     # ==========================
#     #     # 🔹 Update User (Common for all roles)
#     #     # ==========================
#     #     user.first_name = data.get("first_name", user.first_name)
#     #     user.last_name = data.get("last_name", user.last_name)
#     #     user.phone = data.get("phone", user.phone)
#     #     user.save()
        
#     #     # ==========================
#     #     # 🔹 HANDHOLDING UPDATE
#     #     # ==========================
#     #     if user.role and user.role.name.lower() == "handholding":
#     #         print("✅ Entering handholding block")
#     #         participant, created = HandHoldingParticipant.objects.get_or_create(user=user)

#     #         print("CREATED:", created)
#     #         print("ID:", participant.id)
#     #         print("REQUEST FILES:", request.FILES)
#     #         print("REQUEST DATA:", data)

#     #         # ==========================
#     #         # TEXT FIELDS for HandHoldingParticipant
#     #         # ==========================
#     #         if "mobile" in data:
#     #             participant.mobile = data.get("mobile")
            
#     #         if "email" in data:
#     #             participant.email = data.get("email")
                
#     #         if "show_profile" in data:
#     #             participant.show_profile = data.get("show_profile")
            
#     #         if "full_address" in data:
#     #             participant.full_address = data.get("full_address")
#     #             print(f"Updating full_address to: {participant.full_address}")
                
#     #         if "city" in data:
#     #             participant.city = data.get("city")
#     #             print(f"Updating city to: {participant.city}")
                
#     #         if "state" in data:
#     #             participant.state = data.get("state")
                
#     #         if "pincode" in data:
#     #             participant.pincode = data.get("pincode")
                
#     #         if "preferred_counselling_mode" in data:
#     #             participant.preferred_counselling_mode = data.get("preferred_counselling_mode")
                
#     #         if "total_sessions" in data:
#     #             participant.total_sessions = data.get("total_sessions")

#     #         # ==========================
#     #         # FILE FIELDS for HandHoldingParticipant
#     #         # ==========================
#     #         photo = request.FILES.get("photo")
#     #         if photo:
#     #             print(f"Photo received: {photo.name}, size: {photo.size}")
#     #             participant.photo = photo

#     #         resume_file = request.FILES.get("resume_file")
#     #         if resume_file:
#     #             print(f"Resume received: {resume_file.name}, size: {resume_file.size}")
#     #             participant.resume_file = resume_file

#     #         # ==========================
#     #         # SAVE HandHoldingParticipant
#     #         # ==========================
#     #         participant.save()
            
#     #         # ==========================
#     #         # HANDLE PROOF FILE IN PAYMENT MODEL
#     #         # ==========================
#     #         proof_file = request.FILES.get("proof_file")
#     #         if proof_file:
#     #             print(f"Proof received: {proof_file.name}, size: {proof_file.size}")
                
#     #             # Get or create a payment record for this user
#     #             # You might want to filter by specific package or status
#     #             payment, payment_created = Payment.objects.get_or_create(
#     #                 user=user,
#     #                 status='verification_pending',  # or whatever status makes sense
#     #                 defaults={
#     #                     'proof_file': proof_file,
#     #                     'payment_type': 'offline',  # default value, adjust as needed
#     #                     'method': 'cash',  # default value, adjust as needed
#     #                 }
#     #             )
                
#     #             # If payment already exists, update the proof_file
#     #             if not payment_created:
#     #                 payment.proof_file = proof_file
#     #                 payment.save()
#     #                 print(f"Updated proof_file for existing payment ID: {payment.id}")
#     #             else:
#     #                 print(f"Created new payment record with proof_file ID: {payment.id}")
            
#     #         # Refresh from database to get proper file URLs
#     #         participant.refresh_from_db()
            
#     #         # Print values after save to verify
#     #         print("=" * 50)
#     #         print("AFTER SAVE - HandHoldingParticipant:")
#     #         print(f"  full_address: {participant.full_address}")
#     #         print(f"  city: {participant.city}")
#     #         print(f"  state: {participant.state}")
#     #         print(f"  pincode: {participant.pincode}")
            
#     #         # Safely print file URLs
#     #         if participant.resume_file:
#     #             try:
#     #                 print(f"  resume_file: {participant.resume_file.url}")
#     #             except (ValueError, AttributeError):
#     #                 print("  resume_file: File saved but URL not available yet")
#     #         else:
#     #             print("  resume_file: None")
                
#     #         if participant.photo:
#     #             try:
#     #                 print(f"  photo: {participant.photo.url}")
#     #             except (ValueError, AttributeError):
#     #                 print("  photo: File saved but URL not available yet")
#     #         else:
#     #             print("  photo: None")
            
#     #         # Print payment proof file info
#     #         if proof_file:
#     #             try:
#     #                 payment.refresh_from_db()
#     #                 if payment.proof_file:
#     #                     print(f"\nPAYMENT - proof_file: {payment.proof_file.url}")
#     #                 else:
#     #                     print("\nPAYMENT - proof_file: Saved but URL not available yet")
#     #             except Exception as e:
#     #                 print(f"\nPAYMENT - Error getting proof_file URL: {e}")
#     #         print("=" * 50)

#     #         # Prepare response data
#     #         response_data = {
#     #             "full_address": participant.full_address,
#     #             "city": participant.city,
#     #             "state": participant.state,
#     #             "pincode": participant.pincode,
#     #             "mobile": participant.mobile,
#     #             "email": participant.email,
#     #             "show_profile": participant.show_profile,
#     #             "preferred_counselling_mode": participant.preferred_counselling_mode,
#     #             "total_sessions": participant.total_sessions,
#     #         }
            
#     #         # Add file URLs only if they exist
#     #         if participant.photo:
#     #             try:
#     #                 response_data["photo"] = participant.photo.url
#     #             except (ValueError, AttributeError):
#     #                 response_data["photo"] = None
#     #         else:
#     #             response_data["photo"] = None
                
#     #         if participant.resume_file:
#     #             try:
#     #                 response_data["resume_file"] = participant.resume_file.url
#     #             except (ValueError, AttributeError):
#     #                 response_data["resume_file"] = None
#     #         else:
#     #             response_data["resume_file"] = None
            
#     #         # Add payment proof file URL to response if it exists
#     #         if proof_file:
#     #             try:
#     #                 payment.refresh_from_db()
#     #                 if payment.proof_file:
#     #                     response_data["proof_file"] = payment.proof_file.url
#     #                 else:
#     #                     response_data["proof_file"] = None
#     #             except Exception:
#     #                 response_data["proof_file"] = None
#     #         else:
#     #             response_data["proof_file"] = None

#     #         return Response({
#     #             "message": "Handholding profile updated successfully",
#     #             "data": response_data
#     #         }, status=status.HTTP_200_OK)
        
#     #     # ==========================
#     #     # 🔹 STUDENT UPDATE
#     #     # ==========================
#     #     if not (user.role and user.role.name.lower() == "student"):
#     #         return Response({"message": "Profile updated"}, status=200)

#     #     print("✅ Entering student block")
#     #     student_profile, created = StudentProfile.objects.get_or_create(user=user)
        
#     #     # ==========================
#     #     # 🔹 Update Student Basic Info
#     #     # ==========================
#     #     student_profile.study_class = data.get("study_class", student_profile.study_class)
#     #     student_profile.current_academic_year = data.get(
#     #         "current_academic_year",
#     #         student_profile.current_academic_year
#     #     )
#     #     dob = data.get("dob")
#     #     if dob not in ["", None]:
#     #         student_profile.dob = dob
#     #     student_profile.school_college = data.get(
#     #         "school_college",
#     #         student_profile.school_college
#     #     )
#     #     student_profile.city = data.get("city", student_profile.city)
#     #     student_profile.specialization = data.get(
#     #         "specialization",
#     #         student_profile.specialization
#     #     )
        
#     #     previous_percentage = data.get("previous_class_percentage")
#     #     if previous_percentage not in ["", None]:
#     #         student_profile.previous_class_percentage = previous_percentage

#     #     student_profile.board_exam_year = data.get(
#     #         "board_exam_year",
#     #         student_profile.board_exam_year
#     #     )

#     #     student_profile.improvement_areas = data.get(
#     #         "improvement_areas",
#     #         student_profile.improvement_areas
#     #     )
#     #     student_profile.save()
        
#     #     # ==========================
#     #     # 🔹 Parent Profile Update
#     #     # ==========================
#     #     parent_data = data.get("parent", {})

#     #     if parent_data:
#     #         parent_profile = student_profile.parent

#     #         # If parent profile does not exist OR parent user is same as student
#     #         if not parent_profile or parent_profile.user == user:
#     #             parent_user = User.objects.create(
#     #                 first_name="Parent",
#     #                 last_name="",
#     #                 email=f"parent_{user.id}_{timezone.now().timestamp()}@temp.com",
#     #                 role=None
#     #             )
#     #             parent_profile = ParentProfile.objects.create(
#     #                 user=parent_user
#     #             )

#     #         parent_name = parent_data.get("parent_name")
#     #         if parent_name:
#     #             name_parts = parent_name.split(" ", 1)
#     #             parent_profile.user.first_name = name_parts[0]
#     #             parent_profile.user.last_name = name_parts[1] if len(name_parts) > 1 else ""
#     #             parent_profile.user.save()

#     #         parent_profile.profession = parent_data.get(
#     #             "profession", parent_profile.profession
#     #         )
#     #         parent_profile.organization_name = parent_data.get(
#     #             "organization_name", parent_profile.organization_name
#     #         )
#     #         parent_profile.education_level = parent_data.get(
#     #             "education_level", parent_profile.education_level
#     #         )
#     #         parent_profile.father_background = parent_data.get(
#     #             "father_background",
#     #             parent_profile.father_background
#     #         )
#     #         parent_profile.mother_background = parent_data.get(
#     #             "mother_background",
#     #             parent_profile.mother_background
#     #         )
#     #         parent_profile.location = parent_data.get(
#     #             "location",
#     #             parent_profile.location
#     #         )
#     #         parent_profile.annual_income_range = parent_data.get(
#     #             "annual_income_range", parent_profile.annual_income_range
#     #         )
#     #         parent_profile.expectations_from_student = parent_data.get(
#     #             "expectations_from_student", parent_profile.expectations_from_student
#     #         )
#     #         parent_profile.save()
#     #         student_profile.parent = parent_profile
#     #         student_profile.save()

#     #     # ==========================
#     #     # 🔹 Academic History
#     #     # ==========================
#     #     academic_history = data.get("academic_history", [])
#     #     if academic_history:
#     #         StudentAcademicHistory.objects.filter(
#     #             student_profile=student_profile
#     #         ).delete()

#     #         for record in academic_history:
#     #             current_percentage = record.get("current_class_percentage")
#     #             StudentAcademicHistory.objects.create(
#     #                 student_profile=student_profile,
#     #                 academic_stage=record.get("academic_stage"),
#     #                 start_year=record.get("start_year"),
#     #                 end_year=record.get("end_year"),
#     #                 board_name=record.get("board_name"),
#     #                 coaching_entrance=record.get("coaching_entrance"),
#     #                 current_class_percentage=current_percentage if current_percentage not in ["", None] else None,
#     #                 special_notes=record.get("special_notes"),
#     #                 is_current=record.get("is_current", False),
#     #             )

#     #     # ==========================
#     #     # 🔹 Stream (One)
#     #     # ==========================
#     #     stream_id = data.get("stream_id")
#     #     if stream_id:
#     #         StudentStream.objects.filter(student_profile=student_profile).delete()
#     #         StudentStream.objects.create(
#     #             student_profile=student_profile,
#     #             stream_id=stream_id
#     #         )

#     #     # ==========================
#     #     # 🔹 Subject Preferences
#     #     # ==========================
#     #     liked_subject_ids = data.get("liked_subject_ids")
#     #     disliked_subject_ids = data.get("disliked_subject_ids")
#     #     moderate_subject_ids = data.get("moderate_subject_ids")

#     #     if liked_subject_ids is not None or disliked_subject_ids is not None:
#     #         # Delete existing preferences
#     #         StudentSubjectPreference.objects.filter(
#     #             student_profile=student_profile
#     #         ).delete()

#     #         if liked_subject_ids:
#     #             for subject_id in liked_subject_ids:
#     #                 StudentSubjectPreference.objects.create(
#     #                     student_profile=student_profile,
#     #                     subject_id=subject_id,
#     #                     preference_type="like"
#     #                 )
            
#     #         if disliked_subject_ids:
#     #             for subject_id in disliked_subject_ids:
#     #                 StudentSubjectPreference.objects.create(
#     #                     student_profile=student_profile,
#     #                     subject_id=subject_id,
#     #                     preference_type="dislike"
#     #                 )
                    
#     #         if moderate_subject_ids:
#     #             for subject_id in moderate_subject_ids:
#     #                 StudentSubjectPreference.objects.create(
#     #                     student_profile=student_profile,
#     #                     subject_id=subject_id,
#     #                     preference_type="moderate"
#     #                 )

#     #     # ==========================
#     #     # 🔹 Hobbies
#     #     # ==========================
#     #     hobby_ids = data.get("hobby_ids")
#     #     if hobby_ids is not None:
#     #         # Delete old hobbies
#     #         StudentHobby.objects.filter(
#     #             student_profile=student_profile
#     #         ).delete()

#     #         # Create new hobbies
#     #         for hobby_id in hobby_ids:
#     #             StudentHobby.objects.create(
#     #                 student_profile=student_profile,
#     #                 hobby_id=hobby_id
#     #             )
                
#     #     # ==========================
#     #     # 🔹 Update Profile Completion
#     #     # ==========================
#     #     student_profile.update_profile_completion()

#     #     return Response({
#     #         "message": "Profile updated! Redirecting to dashboard..."
#     #     }, status=status.HTTP_200_OK)
    
#     @transaction.atomic
#     def put(self, request):
#         print(">>> PUT request received at view <<<")
#         print(f"Request path: {request.path}")
#         print(f"Request method: {request.method}")
        
#         user = request.user
#         data = request.data

#         if 'email' in data:
#             return Response({"error": "Email cannot be updated"}, status=400)

#         if 'role' in data:
#             return Response({"error": "Role cannot be updated"}, status=400)
        
#         # ==========================
#         # 🔹 Validate Preferences & Hobbies (Only for students)
#         # ==========================
#         # Only validate if user is a student (handholding users don't need these)
#         if user.role and user.role.name.lower() == "student":
#             liked_subjects = data.get("liked_subjects")
#             disliked_subjects = data.get("disliked_subjects")
#             hobbies = data.get("hobbies")

#             errors = {}

#             if liked_subjects is not None and len(liked_subjects) == 0:
#                 errors["liked_subjects"] = "Liked subjects are compulsory"

#             if disliked_subjects is not None and len(disliked_subjects) == 0:
#                 errors["disliked_subjects"] = "Disliked subjects are compulsory"

#             if hobbies is not None and len(hobbies) == 0:
#                 errors["hobbies"] = "Hobbies are compulsory"

#             if errors:
#                 return Response(errors, status=status.HTTP_400_BAD_REQUEST)

#         # ==========================
#         # 🔹 Update User (Common for all roles)
#         # ==========================
#         user.first_name = data.get("first_name", user.first_name)
#         user.last_name = data.get("last_name", user.last_name)
#         user.phone = data.get("phone", user.phone)
#         user.save()
        
#         # ==========================
#         # 🔹 HANDHOLDING UPDATE
#         # ==========================
#         if user.role and user.role.name.lower() == "handholding":
#             print("✅ Entering handholding block")
#             participant, created = HandHoldingParticipant.objects.get_or_create(user=user)

#             print("CREATED:", created)
#             print("ID:", participant.id)
#             print("REQUEST FILES:", request.FILES)
#             print("REQUEST DATA:", data)

#             # ==========================
#             # TEXT FIELDS for HandHoldingParticipant
#             # ==========================
#             if "mobile" in data:
#                 participant.mobile = data.get("mobile")
            
#             if "email" in data:
#                 participant.email = data.get("email")
                
#             if "show_profile" in data:
#                 participant.show_profile = data.get("show_profile")
            
#             if "full_address" in data:
#                 participant.full_address = data.get("full_address")
#                 print(f"Updating full_address to: {participant.full_address}")
                
#             if "city" in data:
#                 participant.city = data.get("city")
#                 print(f"Updating city to: {participant.city}")
                
#             if "state" in data:
#                 participant.state = data.get("state")
                
#             if "pincode" in data:
#                 participant.pincode = data.get("pincode")
                
#             if "preferred_counselling_mode" in data:
#                 participant.preferred_counselling_mode = data.get("preferred_counselling_mode")
                
#             if "total_sessions" in data:
#                 participant.total_sessions = data.get("total_sessions")

#             # ==========================
#             # FILE FIELDS for HandHoldingParticipant
#             # ==========================
#             photo = request.FILES.get("photo")
#             if photo:
#                 print(f"Photo received: {photo.name}, size: {photo.size}")
#                 participant.photo = photo

#             resume_file = request.FILES.get("resume_file")
#             if resume_file:
#                 print(f"Resume received: {resume_file.name}, size: {resume_file.size}")
#                 participant.resume_file = resume_file

#             # ==========================
#             # SAVE HandHoldingParticipant
#             # ==========================
#             participant.save()
            
#             # ==========================
#             # HANDLE PROOF FILE IN PAYMENT MODEL
#             # ==========================
#             proof_file = request.FILES.get("proof_file")
#             if proof_file:
#                 print(f"Proof received: {proof_file.name}, size: {proof_file.size}")
                
#                 # Get or create a payment record for this user
#                 # You might want to filter by specific package or status
#                 payment, payment_created = Payment.objects.get_or_create(
#                     user=user,
#                     status='verification_pending',  # or whatever status makes sense
#                     defaults={
#                         'proof_file': proof_file,
#                         'payment_type': 'offline',  # default value, adjust as needed
#                         'method': 'cash',  # default value, adjust as needed
#                     }
#                 )
                
#                 # If payment already exists, update the proof_file
#                 if not payment_created:
#                     payment.proof_file = proof_file
#                     payment.save()
#                     print(f"Updated proof_file for existing payment ID: {payment.id}")
#                 else:
#                     print(f"Created new payment record with proof_file ID: {payment.id}")
            
#             # Refresh from database to get proper file URLs
#             participant.refresh_from_db()
            
#             # Print values after save to verify
#             print("=" * 50)
#             print("AFTER SAVE - HandHoldingParticipant:")
#             print(f"  full_address: {participant.full_address}")
#             print(f"  city: {participant.city}")
#             print(f"  state: {participant.state}")
#             print(f"  pincode: {participant.pincode}")
            
#             # Safely print file URLs
#             if participant.resume_file:
#                 try:
#                     print(f"  resume_file: {participant.resume_file.url}")
#                 except (ValueError, AttributeError):
#                     print("  resume_file: File saved but URL not available yet")
#             else:
#                 print("  resume_file: None")
                
#             if participant.photo:
#                 try:
#                     print(f"  photo: {participant.photo.url}")
#                 except (ValueError, AttributeError):
#                     print("  photo: File saved but URL not available yet")
#             else:
#                 print("  photo: None")
            
#             # Print payment proof file info
#             if proof_file:
#                 try:
#                     payment.refresh_from_db()
#                     if payment.proof_file:
#                         print(f"\nPAYMENT - proof_file: {payment.proof_file.url}")
#                     else:
#                         print("\nPAYMENT - proof_file: Saved but URL not available yet")
#                 except Exception as e:
#                     print(f"\nPAYMENT - Error getting proof_file URL: {e}")
#             print("=" * 50)

#             # Prepare response data
#             response_data = {
#                 "full_address": participant.full_address,
#                 "city": participant.city,
#                 "state": participant.state,
#                 "pincode": participant.pincode,
#                 "mobile": participant.mobile,
#                 "email": participant.email,
#                 "show_profile": participant.show_profile,
#                 "preferred_counselling_mode": participant.preferred_counselling_mode,
#                 "total_sessions": participant.total_sessions,
#             }
            
#             # Add file URLs only if they exist
#             if participant.photo:
#                 try:
#                     response_data["photo"] = participant.photo.url
#                 except (ValueError, AttributeError):
#                     response_data["photo"] = None
#             else:
#                 response_data["photo"] = None
                
#             if participant.resume_file:
#                 try:
#                     response_data["resume_file"] = participant.resume_file.url
#                 except (ValueError, AttributeError):
#                     response_data["resume_file"] = None
#             else:
#                 response_data["resume_file"] = None
            
#             # Add payment proof file URL to response if it exists
#             if proof_file:
#                 try:
#                     payment.refresh_from_db()
#                     if payment.proof_file:
#                         response_data["proof_file"] = payment.proof_file.url
#                     else:
#                         response_data["proof_file"] = None
#                 except Exception:
#                     response_data["proof_file"] = None
#             else:
#                 response_data["proof_file"] = None

#             return Response({
#                 "message": "Handholding profile updated successfully",
#                 "data": response_data
#             }, status=status.HTTP_200_OK)
        
#         # ==========================
#         # 🔹 STUDENT UPDATE
#         # ==========================
#         if not (user.role and user.role.name.lower() == "student"):
#             return Response({"message": "Profile updated"}, status=200)

#         print("✅ Entering student block")
#         student_profile, created = StudentProfile.objects.get_or_create(user=user)
        
#         # ==========================
#         # 🔹 Update Student Basic Info
#         # ==========================
#         student_profile.study_class = data.get("study_class", student_profile.study_class)
#         student_profile.current_academic_year = data.get(
#             "current_academic_year",
#             student_profile.current_academic_year
#         )
#         dob = data.get("dob")
#         if dob not in ["", None]:
#             student_profile.dob = dob
#         student_profile.school_college = data.get(
#             "school_college",
#             student_profile.school_college
#         )
#         student_profile.city = data.get("city", student_profile.city)
#         student_profile.specialization = data.get(
#             "specialization",
#             student_profile.specialization
#         )
#         student_profile.stream = data.get(
#             "stream_id",
#             student_profile.stream
#         )
        
#         previous_percentage = data.get("previous_class_percentage")
#         if previous_percentage not in ["", None]:
#             student_profile.previous_class_percentage = previous_percentage

#         student_profile.board_exam_year = data.get(
#             "board_exam_year",
#             student_profile.board_exam_year
#         )

#         student_profile.improvement_areas = data.get(
#             "improvement_areas",
#             student_profile.improvement_areas
#         )
#         student_profile.save()
        
#         # ==========================
#         # 🔹 Parent Profile Update
#         # ==========================
#         parent_data = data.get("parent", {})

#         if parent_data:
#             parent_profile = student_profile.parent

#             # If parent profile does not exist OR parent user is same as student
#             if not parent_profile or parent_profile.user == user:
#                 parent_user = User.objects.create(
#                     first_name="Parent",
#                     last_name="",
#                     email=f"parent_{user.id}_{timezone.now().timestamp()}@temp.com",
#                     role=None
#                 )
#                 parent_profile = ParentProfile.objects.create(
#                     user=parent_user
#                 )

#             parent_name = parent_data.get("parent_name")
#             if parent_name:
#                 name_parts = parent_name.split(" ", 1)
#                 parent_profile.user.first_name = name_parts[0]
#                 parent_profile.user.last_name = name_parts[1] if len(name_parts) > 1 else ""
#                 parent_profile.user.save()

#             parent_profile.profession = parent_data.get(
#                 "profession", parent_profile.profession
#             )
#             parent_profile.organization_name = parent_data.get(
#                 "organization_name", parent_profile.organization_name
#             )
#             parent_profile.education_level = parent_data.get(
#                 "education_level", parent_profile.education_level
#             )
#             parent_profile.father_background = parent_data.get(
#                 "father_background",
#                 parent_profile.father_background
#             )
#             parent_profile.mother_background = parent_data.get(
#                 "mother_background",
#                 parent_profile.mother_background
#             )
#             parent_profile.location = parent_data.get(
#                 "location",
#                 parent_profile.location
#             )
#             parent_profile.annual_income_range = parent_data.get(
#                 "annual_income_range", parent_profile.annual_income_range
#             )
#             parent_profile.expectations_from_student = parent_data.get(
#                 "expectations_from_student", parent_profile.expectations_from_student
#             )
#             parent_profile.save()
#             student_profile.parent = parent_profile
#             student_profile.save()

#         # ==========================
#         # 🔹 Academic History
#         # ==========================
#         academic_history = data.get("academic_history", [])
#         if academic_history:
#             StudentAcademicHistory.objects.filter(
#                 student_profile=student_profile
#             ).delete()

#             for record in academic_history:
#                 current_percentage = record.get("current_class_percentage")
#                 StudentAcademicHistory.objects.create(
#                     student_profile=student_profile,
#                     academic_stage=record.get("academic_stage"),
#                     start_year=record.get("start_year"),
#                     end_year=record.get("end_year"),
#                     board_name=record.get("board_name"),
#                     coaching_entrance=record.get("coaching_entrance"),
#                     current_class_percentage=current_percentage if current_percentage not in ["", None] else None,
#                     special_notes=record.get("special_notes"),
#                     is_current=record.get("is_current", False),
#                 )

#         # ==========================
#         # 🔹 Stream (One)
#         # ==========================
#         stream_id = data.get("stream_id")
#         if stream_id:
#             StudentStream.objects.filter(student_profile=student_profile).delete()
#             StudentStream.objects.create(
#                 student_profile=student_profile,
#                 stream_id=stream_id
#             )

#         # ==========================
#         # 🔹 Subject Preferences
#         # ==========================
#         liked_subject_ids = data.get("liked_subject_ids")
#         disliked_subject_ids = data.get("disliked_subject_ids")
#         moderate_subject_ids = data.get("moderate_subject_ids")

#         if liked_subject_ids is not None or disliked_subject_ids is not None or moderate_subject_ids is not None:

#             StudentSubjectPreference.objects.filter(
#                 student_profile=student_profile
#             ).delete()

#             def handle_subjects(subject_list, pref_type):
#                 if not subject_list:
#                     return

#                 for item in subject_list:
#                     if isinstance(item, int):
#                         StudentSubjectPreference.objects.create(
#                             student_profile=student_profile,
#                             subject_id=item,
#                             preference_type=pref_type
#                         )
#                     else:
#                         subject, _ = Subject.objects.get_or_create(name=item)

#                         StudentSubjectPreference.objects.create(
#                             student_profile=student_profile,
#                             subject=subject,
#                             preference_type=pref_type
#                         )

#             handle_subjects(liked_subject_ids, "like")
#             handle_subjects(disliked_subject_ids, "dislike")
#             handle_subjects(moderate_subject_ids, "moderate")

#         # ==========================
#         # 🔹 Hobbies
#         # ==========================
#         hobby_ids = data.get("hobby_ids")  # 👈 change from hobby_ids

#         if hobby_ids is not None:
#             StudentHobby.objects.filter(
#                 student_profile=student_profile
#             ).delete()

#             for item in hobby_ids:
#                 if isinstance(item, int):
#                     # existing hobby ID
#                     StudentHobby.objects.create(
#                         student_profile=student_profile,
#                         hobby_id=item
#                     )
#                 else:
#                     # new hobby string
#                     hobby, _ = Hobby.objects.get_or_create(name=item)

#                     StudentHobby.objects.create(
#                         student_profile=student_profile,
#                         hobby=hobby
#                     )
                    
#         # ==========================
#         # 🔹 Update Profile Completion
#         # ==========================
#         student_profile.update_profile_completion()

#         return Response({
#             "message": "Profile updated! Redirecting to dashboard..."
#         }, status=status.HTTP_200_OK)
    
class ProfileUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user

        student_profile = None

        if user.role and user.role.name.lower() == "student":
            try:
                student_profile = StudentProfile.objects.get(user=user)
            except StudentProfile.DoesNotExist:
                pass

        response_data = {
            "id": user.id,
            "student_id": student_profile.id if student_profile else None,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "password": user.original_password,
            "email": user.email,
            "phone": user.phone,
            "role": user.role.name if user.role else None,
            "is_active": user.is_active,
            "is_converted_lead": user.is_converted_lead,
            "created_at": user.created_at
        }
        # ==========================
        # 🔹 Handholding Info
        # ==========================
            
        if user.role and user.role.name.lower() == "handholding":

                participant = HandHoldingParticipant.objects.filter(user=user).first()

                if participant:
                    payment = Payment.objects.filter(
                        user=user,
                        proof_file__isnull=False
                    ).exclude(proof_file="").order_by("-created_at").first()
                    
                    response_data.update({
                        "participant_id": participant.id,
                        "mobile": participant.mobile,
                        "email": participant.email,
                        "show_profile": participant.show_profile,
                        "full_address": participant.full_address,
                        "city": participant.city,
                        "state": participant.state,
                        "pincode": participant.pincode,
                        "preferred_counselling_mode": participant.preferred_counselling_mode,
                        "total_sessions": participant.total_sessions,
                        "completed_sessions": participant.completed_sessions,
                        "status": participant.status,
                        "certificate_issued": participant.certificate_issued,
                        "photo": request.build_absolute_uri(participant.photo.url)
                            if participant.photo else None,
                        "resume_file": request.build_absolute_uri(participant.resume_file.url)
                            if participant.resume_file else None,
                        "proof_file": request.build_absolute_uri(payment.proof_file.url)
                            if payment and payment.proof_file else None,
                        "created_at": participant.created_at
                    })
                else:
                    response_data["handholding"] = None
            
        

        if student_profile:

            # ==========================
            # 🔹 Basic Student Info
            # ==========================
            response_data.update({
                "study_class": student_profile.study_class,
                "specialization": student_profile.specialization,
                "current_academic_year": student_profile.current_academic_year,
                "school_college": student_profile.school_college,
                "city": student_profile.city,
                "previous_class_percentage": student_profile.previous_class_percentage,
                "board_exam_year": student_profile.board_exam_year,
                "improvement_areas": student_profile.improvement_areas,
                "preferred_counselling_mode": student_profile.preferred_counselling_mode,
                "dob": student_profile.dob,
                "suggested_stream": student_profile.suggested_stream,
                "complete_profile": student_profile.is_profile_complete
            })
            
            
            # ==========================
            # 🔹 Parent Info
            # ==========================
            if student_profile.parent:
                parent = student_profile.parent
                response_data["parent"] = {
                    "parent_name": f"{parent.user.first_name} {parent.user.last_name}" if parent.user else None,
                    "profession": parent.profession,
                    "organization_name": parent.organization_name,
                    "education_level": parent.education_level,
                    "father_background": parent.father_background,
                    "mother_background": parent.mother_background,
                    "location": parent.location,
                    "annual_income_range": parent.annual_income_range,
                    "expectations_from_student": parent.expectations_from_student
                }
            else:
                response_data["parent"] = None

            # ==========================
            # 🔹 Academic History
            # ==========================
            academic_records = StudentAcademicHistory.objects.filter(
                student_profile=student_profile
            )

            response_data["academic_history"] = [
                {
                    "academic_stage": record.academic_stage,
                    "start_year": record.start_year,
                    "end_year": record.end_year,
                    "board_name": record.board_name,
                    "coaching_entrance": record.coaching_entrance,
                    "current_class_percentage": record.current_class_percentage,
                    "special_notes": record.special_notes,
                    "is_current": record.is_current
                }
                for record in academic_records
            ]

            # ==========================
            # 🔹 Stream
            # ==========================
            stream = StudentStream.objects.filter(
                student_profile=student_profile
            ).select_related("stream").first()

            response_data["stream"] = {
                "stream_id": stream.stream.id,
                "stream_name": stream.stream.name
            } if stream else None
            # response_data["stream"] = student_profile.stream

            # ==========================
            # 🔹 Subject Preferences
            # ==========================
            preferences = StudentSubjectPreference.objects.filter(
                student_profile=student_profile
            ).select_related("subject")

            liked_subjects = []
            disliked_subjects = []
            moderate_subjects = []

            for pref in preferences:
                subject_data = {
                    "id": pref.subject.id,
                    "name": pref.subject.name
                }

                if pref.preference_type == "like":
                    liked_subjects.append(subject_data)
                elif pref.preference_type == "dislike":
                    disliked_subjects.append(subject_data)
                elif pref.preference_type == "moderate":
                    moderate_subjects.append(subject_data)

            response_data["liked_subjects"] = liked_subjects
            response_data["disliked_subjects"] = disliked_subjects
            response_data["moderate_subjects"] = moderate_subjects
            # ==========================
            # 🔹 Hobbies
            # ==========================
            hobbies = StudentHobby.objects.filter(
                student_profile=student_profile
            ).select_related("hobby")

            response_data["hobbies"] = [
                {
                    "id": hobby.hobby.id,
                    "name": hobby.hobby.name
                }
                for hobby in hobbies
            ]

        # ==========================
        # 🔹 Program & Package
        # ==========================
        # if user.role and user.role.name.lower() == "student":
            
        #     upp = UserProgramPackage.objects.select_related("package", "program").filter(user=user).first()

        #     aptitude_test_status = False

        #     if upp:
        #         if upp.package:
        #             aptitude_test_status = upp.package.aptitude_test

        #         response_data.update({
        #             "program_id": upp.program.id if upp.program else None,
        #             "program": upp.program.name if upp.program else None,
        #             "package_id": upp.package.id if upp.package else None,
        #             "package": upp.package.name if upp.package else None,
        #             "aptitude_test": aptitude_test_status,
        #             "engineering_test_analysis": upp.package.engineering_test_analysis if upp.package else False
        #         })
        #     else:
        #         response_data["aptitude_test"] = False
        # upp = UserProgramPackage.objects.select_related("package", "program").filter(user=user).first()
        user_programs = UserProgramPackage.objects.select_related(
            "program", "package"
        ).filter(user=user, package__isnull=False)  # Ensure we only get records where program is not null

        response_data["program_packages"] = [
            {
                "program_id": upp.program.id if upp.program else None,
                "program_name": upp.program.name if upp.program else None,
                "package_id": upp.package.id if upp.package else None,
                "package_name": upp.package.name if upp.package else None,
                "package_price": upp.package.price if upp.package else None,
                "aptitude_test": upp.package.aptitude_test if upp.package else False,
                "engineering_test_analysis": (
                    upp.package.engineering_test_analysis
                    if upp.package else False
                )
            }
            for upp in user_programs
        ]
        if not user_programs.exists():
            response_data["program_packages"] = []

        # ✅ MOVE THIS OUTSIDE
        payments = Payment.objects.filter(user=user).order_by("-created_at")

        response_data["payments"] = [
            {
                "payment_id": payment.id,
                "amount": payment.amount,
                "payment_type": payment.payment_type,
                "method": payment.method,
                "transaction_id": payment.transaction_id,
                "proof_file": request.build_absolute_uri(payment.proof_file.url)
                if payment.proof_file else None,
                "status": payment.status,
                "created_at": payment.created_at
            }
            for payment in payments
        ]

        return Response(response_data)
    
    @transaction.atomic
    def put(self, request):
        print(">>> PUT request received at view <<<")
        print(f"Request path: {request.path}")
        print(f"Request method: {request.method}")
        
        user = request.user
        data = request.data

        if 'email' in data:
            return Response({"error": "Email cannot be updated"}, status=400)

        if 'role' in data:
            return Response({"error": "Role cannot be updated"}, status=400)
        
        # ==========================
        # 🔹 Validate Preferences & Hobbies (Only for students)
        # ==========================
        # Only validate if user is a student (handholding users don't need these)
        if user.role and user.role.name.lower() == "student":
            liked_subjects = data.get("liked_subjects")
            disliked_subjects = data.get("disliked_subjects")
            hobbies = data.get("hobbies")

            errors = {}

            if liked_subjects is not None and len(liked_subjects) == 0:
                errors["liked_subjects"] = "Liked subjects are compulsory"

            if disliked_subjects is not None and len(disliked_subjects) == 0:
                errors["disliked_subjects"] = "Disliked subjects are compulsory"

            if hobbies is not None and len(hobbies) == 0:
                errors["hobbies"] = "Hobbies are compulsory"

            if errors:
                return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        # ==========================
        # 🔹 Update User (Common for all roles)
        # ==========================
        user.first_name = data.get("first_name", user.first_name)
        user.last_name = data.get("last_name", user.last_name)
        user.phone = data.get("phone", user.phone)
        user.save()
        
        # ==========================
        # 🔹 HANDHOLDING UPDATE
        # ==========================
        if user.role and user.role.name.lower() == "handholding":
            print("✅ Entering handholding block")
            participant, created = HandHoldingParticipant.objects.get_or_create(user=user)

            print("CREATED:", created)
            print("ID:", participant.id)
            print("REQUEST FILES:", request.FILES)
            print("REQUEST DATA:", data)

            # ==========================
            # TEXT FIELDS for HandHoldingParticipant
            # ==========================
            if "mobile" in data:
                participant.mobile = data.get("mobile")
            
            if "email" in data:
                participant.email = data.get("email")
                
            if "show_profile" in data:
                participant.show_profile = data.get("show_profile")
            
            if "full_address" in data:
                participant.full_address = data.get("full_address")
                print(f"Updating full_address to: {participant.full_address}")
                
            if "city" in data:
                participant.city = data.get("city")
                print(f"Updating city to: {participant.city}")
                
            if "state" in data:
                participant.state = data.get("state")
                
            if "pincode" in data:
                participant.pincode = data.get("pincode")
                
            if "preferred_counselling_mode" in data:
                participant.preferred_counselling_mode = data.get("preferred_counselling_mode")
                
            if "total_sessions" in data:
                participant.total_sessions = data.get("total_sessions")

            # ==========================
            # FILE FIELDS for HandHoldingParticipant
            # ==========================
            photo = request.FILES.get("photo")
            if photo:
                print(f"Photo received: {photo.name}, size: {photo.size}")
                participant.photo = photo

            resume_file = request.FILES.get("resume_file")
            if resume_file:
                print(f"Resume received: {resume_file.name}, size: {resume_file.size}")
                participant.resume_file = resume_file

            # ==========================
            # SAVE HandHoldingParticipant
            # ==========================
            participant.save()
            
            # ==========================
            # HANDLE PROOF FILE IN PAYMENT MODEL
            # ==========================
            proof_file = request.FILES.get("proof_file")
            if proof_file:
                print(f"Proof received: {proof_file.name}, size: {proof_file.size}")
                
                # Get or create a payment record for this user
                # You might want to filter by specific package or status
                payment, payment_created = Payment.objects.get_or_create(
                    user=user,
                    status='verification_pending',  # or whatever status makes sense
                    defaults={
                        'proof_file': proof_file,
                        'payment_type': 'offline',  # default value, adjust as needed
                        'method': 'cash',  # default value, adjust as needed
                    }
                )
                
                # If payment already exists, update the proof_file
                if not payment_created:
                    payment.proof_file = proof_file
                    payment.save()
                    print(f"Updated proof_file for existing payment ID: {payment.id}")
                else:
                    print(f"Created new payment record with proof_file ID: {payment.id}")
            
            # Refresh from database to get proper file URLs
            participant.refresh_from_db()
            
            # Print values after save to verify
            print("=" * 50)
            print("AFTER SAVE - HandHoldingParticipant:")
            print(f"  full_address: {participant.full_address}")
            print(f"  city: {participant.city}")
            print(f"  state: {participant.state}")
            print(f"  pincode: {participant.pincode}")
            
            # Safely print file URLs
            if participant.resume_file:
                try:
                    print(f"  resume_file: {participant.resume_file.url}")
                except (ValueError, AttributeError):
                    print("  resume_file: File saved but URL not available yet")
            else:
                print("  resume_file: None")
                
            if participant.photo:
                try:
                    print(f"  photo: {participant.photo.url}")
                except (ValueError, AttributeError):
                    print("  photo: File saved but URL not available yet")
            else:
                print("  photo: None")
            
            # Print payment proof file info
            if proof_file:
                try:
                    payment.refresh_from_db()
                    if payment.proof_file:
                        print(f"\nPAYMENT - proof_file: {payment.proof_file.url}")
                    else:
                        print("\nPAYMENT - proof_file: Saved but URL not available yet")
                except Exception as e:
                    print(f"\nPAYMENT - Error getting proof_file URL: {e}")
            print("=" * 50)

            # Prepare response data
            response_data = {
                "full_address": participant.full_address,
                "city": participant.city,
                "state": participant.state,
                "pincode": participant.pincode,
                "mobile": participant.mobile,
                "email": participant.email,
                "show_profile": participant.show_profile,
                "preferred_counselling_mode": participant.preferred_counselling_mode,
                "total_sessions": participant.total_sessions,
            }
            
            # Add file URLs only if they exist
            if participant.photo:
                try:
                    response_data["photo"] = participant.photo.url
                except (ValueError, AttributeError):
                    response_data["photo"] = None
            else:
                response_data["photo"] = None
                
            if participant.resume_file:
                try:
                    response_data["resume_file"] = participant.resume_file.url
                except (ValueError, AttributeError):
                    response_data["resume_file"] = None
            else:
                response_data["resume_file"] = None
            
            # Add payment proof file URL to response if it exists
            if proof_file:
                try:
                    payment.refresh_from_db()
                    if payment.proof_file:
                        response_data["proof_file"] = payment.proof_file.url
                    else:
                        response_data["proof_file"] = None
                except Exception:
                    response_data["proof_file"] = None
            else:
                response_data["proof_file"] = None

            return Response({
                "message": "Handholding profile updated successfully",
                "data": response_data
            }, status=status.HTTP_200_OK)
        
        # ==========================
        # 🔹 STUDENT UPDATE
        # ==========================
        if not (user.role and user.role.name.lower() == "student"):
            return Response({"message": "Profile updated"}, status=200)

        print("✅ Entering student block")
        student_profile, created = StudentProfile.objects.get_or_create(user=user)
        
        # ==========================
        # 🔹 Update Student Basic Info
        # ==========================
        student_profile.study_class = data.get("study_class", student_profile.study_class)
        student_profile.current_academic_year = data.get(
            "current_academic_year",
            student_profile.current_academic_year
        )
        dob = data.get("dob")
        if dob not in ["", None]:
            student_profile.dob = dob
        student_profile.school_college = data.get(
            "school_college",
            student_profile.school_college
        )
        student_profile.city = data.get("city", student_profile.city)
        student_profile.specialization = data.get(
            "specialization",
            student_profile.specialization
        )
        student_profile.stream = data.get(
            "stream_id",
            student_profile.stream
        )
        
        previous_percentage = data.get("previous_class_percentage")
        if previous_percentage not in ["", None]:
            student_profile.previous_class_percentage = previous_percentage

        student_profile.board_exam_year = data.get(
            "board_exam_year",
            student_profile.board_exam_year
        )

        student_profile.improvement_areas = data.get(
            "improvement_areas",
            student_profile.improvement_areas
        )
        student_profile.save()
        
        # ==========================
        # 🔹 Parent Profile Update
        # ==========================
        parent_data = data.get("parent", {})

        if parent_data:
            parent_profile = student_profile.parent

            # If parent profile does not exist OR parent user is same as student
            if not parent_profile or parent_profile.user == user:
                parent_user = User.objects.create(
                    first_name="Parent",
                    last_name="",
                    email=f"parent_{user.id}_{timezone.now().timestamp()}@temp.com",
                    role=None
                )
                parent_profile = ParentProfile.objects.create(
                    user=parent_user
                )

            parent_name = parent_data.get("parent_name")
            if parent_name:
                name_parts = parent_name.split(" ", 1)
                parent_profile.user.first_name = name_parts[0]
                parent_profile.user.last_name = name_parts[1] if len(name_parts) > 1 else ""
                parent_profile.user.save()

            parent_profile.profession = parent_data.get(
                "profession", parent_profile.profession
            )
            parent_profile.organization_name = parent_data.get(
                "organization_name", parent_profile.organization_name
            )
            parent_profile.education_level = parent_data.get(
                "education_level", parent_profile.education_level
            )
            parent_profile.father_background = parent_data.get(
                "father_background",
                parent_profile.father_background
            )
            parent_profile.mother_background = parent_data.get(
                "mother_background",
                parent_profile.mother_background
            )
            parent_profile.location = parent_data.get(
                "location",
                parent_profile.location
            )
            parent_profile.annual_income_range = parent_data.get(
                "annual_income_range", parent_profile.annual_income_range
            )
            parent_profile.expectations_from_student = parent_data.get(
                "expectations_from_student", parent_profile.expectations_from_student
            )
            parent_profile.save()
            student_profile.parent = parent_profile
            student_profile.save()

        # ==========================
        # 🔹 Academic History
        # ==========================
        academic_history = data.get("academic_history", [])
        if academic_history:
            StudentAcademicHistory.objects.filter(
                student_profile=student_profile
            ).delete()

            for record in academic_history:
                current_percentage = record.get("current_class_percentage")
                StudentAcademicHistory.objects.create(
                    student_profile=student_profile,
                    academic_stage=record.get("academic_stage"),
                    start_year=record.get("start_year"),
                    end_year=record.get("end_year"),
                    board_name=record.get("board_name"),
                    coaching_entrance=record.get("coaching_entrance"),
                    current_class_percentage=current_percentage if current_percentage not in ["", None] else None,
                    special_notes=record.get("special_notes"),
                    is_current=record.get("is_current", False),
                )

        # # ==========================
        # # 🔹 Stream (One)
        # # ==========================
        # stream_id = data.get("stream_id")
        # if stream_id:
        #     StudentStream.objects.filter(student_profile=student_profile).delete()
        #     StudentStream.objects.create(
        #         student_profile=student_profile,
        #         stream_id=stream_id
        #     )
        
        # ==========================
        # 🔹 Stream (One)
        # ==========================
        stream_value = data.get("stream_id")

        if stream_value:

            # Existing Stream ID
            if str(stream_value).isdigit():

                stream = get_object_or_404(
                    Stream,
                    id=int(stream_value)
                )

            # New Stream Name
            else:

                stream, _ = Stream.objects.get_or_create(
                    name=stream_value.strip()
                )

            # Remove old mapping
            StudentStream.objects.filter(
                student_profile=student_profile
            ).delete()

            # Create new mapping
            StudentStream.objects.create(
                student_profile=student_profile,
                stream=stream
            )

            # Save STREAM NAME in StudentProfile
            student_profile.stream = stream.name
            student_profile.save(update_fields=["stream"])

        # ==========================
        # 🔹 Subject Preferences
        # ==========================
        liked_subject_ids = data.get("liked_subject_ids")
        disliked_subject_ids = data.get("disliked_subject_ids")
        moderate_subject_ids = data.get("moderate_subject_ids")

        if liked_subject_ids is not None or disliked_subject_ids is not None or moderate_subject_ids is not None:

            StudentSubjectPreference.objects.filter(
                student_profile=student_profile
            ).delete()

            def handle_subjects(subject_list, pref_type):
                if not subject_list:
                    return

                for item in subject_list:
                    if isinstance(item, int):
                        StudentSubjectPreference.objects.create(
                            student_profile=student_profile,
                            subject_id=item,
                            preference_type=pref_type
                        )
                    else:
                        subject, _ = Subject.objects.get_or_create(name=item)

                        StudentSubjectPreference.objects.create(
                            student_profile=student_profile,
                            subject=subject,
                            preference_type=pref_type
                        )

            handle_subjects(liked_subject_ids, "like")
            handle_subjects(disliked_subject_ids, "dislike")
            handle_subjects(moderate_subject_ids, "moderate")

        # ==========================
        # 🔹 Hobbies
        # ==========================
        hobby_ids = data.get("hobby_ids")  # 👈 change from hobby_ids

        if hobby_ids is not None:
            StudentHobby.objects.filter(
                student_profile=student_profile
            ).delete()

            for item in hobby_ids:
                if isinstance(item, int):
                    # existing hobby ID
                    StudentHobby.objects.create(
                        student_profile=student_profile,
                        hobby_id=item
                    )
                else:
                    # new hobby string
                    hobby, _ = Hobby.objects.get_or_create(name=item)

                    StudentHobby.objects.create(
                        student_profile=student_profile,
                        hobby=hobby
                    )
                    
        # ==========================
        # 🔹 Update Profile Completion
        # ==========================
        student_profile.update_profile_completion()

        return Response({
            "message": "Profile updated! Redirecting to dashboard..."
        }, status=status.HTTP_200_OK)
    

def build_student_profile_response(request, user, student_profile=None):

        response_data = {
            "id": user.id,
            "student_id": student_profile.id if student_profile else None,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role.name if user.role else None,
            "is_active": user.is_active,
            "created_at": user.created_at
        }

        if student_profile:
            
            response_data.update({
                "study_class": student_profile.study_class,
                "specialization": student_profile.specialization,
                "current_academic_year": student_profile.current_academic_year,
                "school_college": student_profile.school_college,
                "city": student_profile.city,
                "previous_class_percentage": student_profile.previous_class_percentage,
                "board_exam_year": student_profile.board_exam_year,
                "improvement_areas": student_profile.improvement_areas,
                "preferred_counselling_mode": student_profile.preferred_counselling_mode,
                "suggested_stream": student_profile.suggested_stream,
                "dob": student_profile.dob.strftime("%Y-%m-%d") if student_profile.dob else None,
                "complete_profile": student_profile.is_profile_complete
            })
            
            # Program & Package
            user_programs = UserProgramPackage.objects.filter(
                user=user
            ).select_related("program", "package")

            response_data["program_packages"] = [
                {
                    "program_id": up.program.id,
                    "program_name": up.program.name,
                    "package_id": up.package.id if up.package else None,
                    "package_name": up.package.name if up.package else None,
                    "assigned_by": up.assigned_by,
                    "created_at": up.created_at
                }
                for up in user_programs
            ]
            
            # Parent
            if student_profile.parent:
                parent = student_profile.parent
                response_data["parent"] = {
                    "parent_name": f"{parent.user.first_name} {parent.user.last_name}" if parent.user else None,
                    "profession": parent.profession,
                    "organization_name": parent.organization_name,
                    "education_level": parent.education_level,
                    "father_background": parent.father_background,
                    "mother_background": parent.mother_background,
                    "location": parent.location,
                    "annual_income_range": parent.annual_income_range,
                    "expectations_from_student": parent.expectations_from_student
                }
            else:
                response_data["parent"] = None

            # Academic History
            academic_records = StudentAcademicHistory.objects.filter(
                student_profile=student_profile
            )

            response_data["academic_history"] = [
                {
                    "academic_stage": r.academic_stage,
                    "start_year": r.start_year,
                    "end_year": r.end_year,
                    "board_name": r.board_name,
                    "coaching_entrance": r.coaching_entrance,
                    "current_class_percentage": r.current_class_percentage,
                    "special_notes": r.special_notes,
                    "is_current": r.is_current
                }
                for r in academic_records
            ]

            # Stream
            stream = StudentStream.objects.filter(
                student_profile=student_profile
            ).select_related("stream").first()

            response_data["stream"] = {
                "stream_id": stream.stream.id,
                "stream_name": stream.stream.name
            } if stream else None

            # Subject Preferences
            preferences = StudentSubjectPreference.objects.filter(
                student_profile=student_profile
            ).select_related("subject")

            liked_subjects = []
            disliked_subjects = []
            moderate_subjects = []

            for pref in preferences:

                subject_data = {
                    "id": pref.subject.id,
                    "name": pref.subject.name
                }

                if pref.preference_type == "like":
                    liked_subjects.append(subject_data)

                elif pref.preference_type == "dislike":
                    disliked_subjects.append(subject_data)

                elif pref.preference_type == "moderate":
                    moderate_subjects.append(subject_data)

            response_data["liked_subjects"] = liked_subjects
            response_data["disliked_subjects"] = disliked_subjects
            response_data["moderate_subjects"] = moderate_subjects

            # Hobbies
            hobbies = StudentHobby.objects.filter(
                student_profile=student_profile
            ).select_related("hobby")

            response_data["hobbies"] = [
                {
                    "id": hobby.hobby.id,
                    "name": hobby.hobby.name
                }
                for hobby in hobbies
            ]

        return response_data
        
class StudentProfileByIdAPIView(APIView):
    permission_classes = [IsAuthenticated]

    # def get(self, request, student_id):

    #     # 🔹 Get student profile using ID from URL
    #     student_profile = get_object_or_404(
    #         StudentProfile.objects.select_related("user", "parent"),
    #         id=student_id
    #     )

    #     user = student_profile.user

    #     response_data = {
    #         "id": user.id,
    #         "student_id": student_profile.id,
    #         "first_name": user.first_name,
    #         "last_name": user.last_name,
    #         "email": user.email,
    #         "phone": user.phone,
    #         "role": user.role.name if user.role else None,
    #         "is_active": user.is_active,
    #         "created_at": user.created_at
    #     }

    #     # ==========================
    #     # 🔹 Basic Student Info
    #     # ==========================
    #     response_data.update({
    #         "study_class": student_profile.study_class,
    #         "specialization": student_profile.specialization,
    #         "current_academic_year": student_profile.current_academic_year,
    #         "school_college": student_profile.school_college,
    #         "city": student_profile.city,
    #         "previous_class_percentage": student_profile.previous_class_percentage,
    #         "board_exam_year": student_profile.board_exam_year,
    #         "improvement_areas": student_profile.improvement_areas,
    #         "preferred_counselling_mode": student_profile.preferred_counselling_mode,
    #         "dob": student_profile.dob,
    #         "complete_profile": student_profile.is_profile_complete
    #     })

    #     # ==========================
    #     # 🔹 Parent Info
    #     # ==========================
    #     if student_profile.parent:
    #         parent = student_profile.parent
    #         response_data["parent"] = {
    #             "parent_name": f"{parent.user.first_name} {parent.user.last_name}",
    #             "profession": parent.profession,
    #             "organization_name": parent.organization_name,
    #             "education_level": parent.education_level,
    #             "father_background": parent.father_background,
    #             "mother_background": parent.mother_background,
    #             "location": parent.location,
    #             "annual_income_range": parent.annual_income_range,
    #             "expectations_from_student": parent.expectations_from_student
    #         }
    #     else:
    #         response_data["parent"] = None

    #     # ==========================
    #     # 🔹 Academic History
    #     # ==========================
    #     academic_records = StudentAcademicHistory.objects.filter(
    #         student_profile=student_profile
    #     )

    #     response_data["academic_history"] = [
    #         {
    #             "academic_stage": record.academic_stage,
    #             "start_year": record.start_year,
    #             "end_year": record.end_year,
    #             "is_current": record.is_current
    #         }
    #         for record in academic_records
    #     ]

    #     # ==========================
    #     # 🔹 Stream
    #     # ==========================
    #     stream = StudentStream.objects.filter(
    #         student_profile=student_profile
    #     ).select_related("stream").first()

    #     response_data["stream"] = {
    #         "stream_id": stream.stream.id,
    #         "stream_name": stream.stream.name
    #     } if stream else None

    #     # ==========================
    #     # 🔹 Subject Preferences
    #     # ==========================
    #     preferences = StudentSubjectPreference.objects.filter(
    #         student_profile=student_profile
    #     ).select_related("subject")

    #     liked_subjects = []
    #     disliked_subjects = []

    #     for pref in preferences:
    #         subject_data = {
    #             "id": pref.subject.id,
    #             "name": pref.subject.name
    #         }

    #         if pref.preference_type is True:
    #             liked_subjects.append(subject_data)
    #         elif pref.preference_type is False:
    #             disliked_subjects.append(subject_data)

    #     response_data["liked_subjects"] = liked_subjects
    #     response_data["disliked_subjects"] = disliked_subjects

    #     # ==========================
    #     # 🔹 Hobbies
    #     # ==========================
    #     hobbies = StudentHobby.objects.filter(
    #         student_profile=student_profile
    #     ).select_related("hobby")

    #     response_data["hobbies"] = [
    #         {
    #             "id": hobby.hobby.id,
    #             "name": hobby.hobby.name
    #         }
    #         for hobby in hobbies
    #     ]

    #     return Response(response_data)
    def get(self, request, student_id):

        student_profile = get_object_or_404(
            StudentProfile.objects.select_related("user", "parent"),
            id=student_id
        )

        user = student_profile.user

        response_data = build_student_profile_response(
            request,
            user,
            student_profile
        )

        return Response(response_data)
    
    @transaction.atomic
    def put(self, request, student_id):

        data = request.data

        # 🔹 Get student profile
        student_profile = get_object_or_404(
            StudentProfile.objects.select_related("user"),
            id=student_id
        )

        user = student_profile.user

        # ==========================
        # 🔹 Prevent Email & Role Update
        # ==========================
        if 'email' in data:
            return Response({"error": "Email cannot be updated"}, status=400)

        if 'role' in data:
            return Response({"error": "Role cannot be updated"}, status=400)

        # ==========================
        # 🔹 Validate Preferences & Hobbies
        # ==========================
        liked_subject_ids = data.get("liked_subject_ids")
        disliked_subject_ids = data.get("disliked_subject_ids")
        hobby_ids = data.get("hobby_ids")

        errors = {}

        if liked_subject_ids is not None and len(liked_subject_ids) == 0:
            errors["liked_subjects"] = "Liked subjects are compulsory to complete the profile"

        if disliked_subject_ids is not None and len(disliked_subject_ids) == 0:
            errors["disliked_subjects"] = "Disliked subjects are compulsory to complete the profile"

        if hobby_ids is not None and len(hobby_ids) == 0:
            errors["hobbies"] = "Hobbies are compulsory to complete the profile"

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        # ==========================
        # 🔹 Update User
        # ==========================
        user.first_name = data.get("first_name", user.first_name)
        user.last_name = data.get("last_name", user.last_name)
        user.phone = data.get("phone", user.phone)
        user.save()

        # ==========================
        # 🔹 Update Student Basic Info
        # ==========================
        student_profile.study_class = data.get(
            "study_class", student_profile.study_class
        )

        student_profile.current_academic_year = data.get(
            "current_academic_year",
            student_profile.current_academic_year
        )

        dob = data.get("dob")
        if dob not in ["", None]:
            student_profile.dob = dob

        student_profile.school_college = data.get(
            "school_college",
            student_profile.school_college
        )

        student_profile.city = data.get(
            "city",
            student_profile.city
        )

        student_profile.specialization = data.get(
            "specialization",
            student_profile.specialization
        )
        
        student_profile.suggested_stream = data.get(
            "suggested_stream",
            student_profile.suggested_stream
        )

        # student_profile.previous_class_percentage = data.get(
        #     "previous_class_percentage",
        #     student_profile.previous_class_percentage
        # )
        percentage = data.get("previous_class_percentage")

        if percentage in ["", None]:
            student_profile.previous_class_percentage = None
        else:
            try:
                student_profile.previous_class_percentage = float(percentage)
            except:
                return Response(
                    {"error": "previous_class_percentage must be a valid number"},
                    status=400
                )

        student_profile.board_exam_year = data.get(
            "board_exam_year",
            student_profile.board_exam_year
        )

        student_profile.improvement_areas = data.get(
            "improvement_areas",
            student_profile.improvement_areas
        )

        student_profile.save()

        # ==========================
        # 🔹 Parent Profile Update
        # ==========================
        parent_data = data.get("parent", {})

        if parent_data:

            parent_profile = student_profile.parent

            if not parent_profile or parent_profile.user == user:

                parent_user = User.objects.create(
                    first_name="Parent",
                    last_name="",
                    email=f"parent_{user.id}_{timezone.now().timestamp()}@temp.com",
                    role=None
                )

                parent_profile = ParentProfile.objects.create(
                    user=parent_user
                )

            parent_name = parent_data.get("parent_name")

            if parent_name:
                name_parts = parent_name.split(" ", 1)

                parent_profile.user.first_name = name_parts[0]
                parent_profile.user.last_name = name_parts[1] if len(name_parts) > 1 else ""
                parent_profile.user.save()

            parent_profile.profession = parent_data.get(
                "profession",
                parent_profile.profession
            )

            parent_profile.organization_name = parent_data.get(
                "organization_name",
                parent_profile.organization_name
            )

            parent_profile.education_level = parent_data.get(
                "education_level",
                parent_profile.education_level
            )

            parent_profile.father_background = parent_data.get(
                "father_background",
                parent_profile.father_background
            )

            parent_profile.mother_background = parent_data.get(
                "mother_background",
                parent_profile.mother_background
            )

            parent_profile.location = parent_data.get(
                "location",
                parent_profile.location
            )

            parent_profile.annual_income_range = data.get(
                "annual_income_range",
                parent_profile.annual_income_range
            )

            parent_profile.expectations_from_student = parent_data.get(
                "expectations_from_student",
                parent_profile.expectations_from_student
            )

            parent_profile.save()

            student_profile.parent = parent_profile
            student_profile.save()

        # ==========================
        # 🔹 Academic History
        # ==========================
        academic_history = data.get("academic_history", [])

        if academic_history:

            StudentAcademicHistory.objects.filter(
                student_profile=student_profile
            ).delete()

            for record in academic_history:
                percentage = record.get("current_class_percentage")

                if percentage in ["", None]:
                    percentage = None
                else:
                    try:
                        percentage = float(percentage)
                    except:
                        return Response(
                            {"error": "current_class_percentage must be a valid number"},
                            status=400
                        )

                StudentAcademicHistory.objects.create(
                    student_profile=student_profile,
                    academic_stage=record.get("academic_stage"),
                    start_year=record.get("start_year"),
                    end_year=record.get("end_year"),
                    board_name=record.get("board_name"),
                    coaching_entrance=record.get("coaching_entrance"),
                    current_class_percentage=percentage,
                    special_notes=record.get("special_notes"),
                    is_current=record.get("is_current", False)
                )

        # # ==========================
        # # 🔹 Stream
        # # ==========================
        # stream_id = data.get("stream_id")

        # if stream_id:

        #     StudentStream.objects.filter(
        #         student_profile=student_profile
        #     ).delete()

        #     StudentStream.objects.create(
        #         student_profile=student_profile,
        #         stream_id=stream_id
        #     )
        
        # ==========================
        # 🔹 Stream
        # ==========================
        stream_value = data.get("stream_id")

        if stream_value:

            # Existing Stream ID
            if str(stream_value).isdigit():

                stream = get_object_or_404(
                    Stream,
                    id=int(stream_value)
                )

            # New Stream Name
            else:

                stream, _ = Stream.objects.get_or_create(
                    name=stream_value.strip()
                )

            # Remove old stream mapping
            StudentStream.objects.filter(
                student_profile=student_profile
            ).delete()

            # Create new mapping
            StudentStream.objects.create(
                student_profile=student_profile,
                stream=stream
            )

            # Update StudentProfile stream field
            student_profile.stream = stream.name
            student_profile.save(update_fields=["stream"])

        # ==========================
        # 🔹 Subject Preferences
        # ==========================
        liked_subject_ids = data.get("liked_subject_ids")
        disliked_subject_ids = data.get("disliked_subject_ids")
        moderate_subject_ids = data.get("moderate_subject_ids")

        if liked_subject_ids is not None or disliked_subject_ids is not None:

            StudentSubjectPreference.objects.filter(
                student_profile=student_profile
            ).delete()

            if liked_subject_ids:
                for subject_id in liked_subject_ids:

                    StudentSubjectPreference.objects.create(
                        student_profile=student_profile,
                        subject_id=subject_id,
                        preference_type="like"
                    )

            if disliked_subject_ids:
                for subject_id in disliked_subject_ids:

                    StudentSubjectPreference.objects.create(
                        student_profile=student_profile,
                        subject_id=subject_id,
                        preference_type="dislike"
                    )

            if moderate_subject_ids:
                for subject_id in moderate_subject_ids:

                    StudentSubjectPreference.objects.create(
                        student_profile=student_profile,
                        subject_id=subject_id,
                        preference_type="moderate"
                    )

        # ==========================
        # 🔹 Hobbies
        # ==========================
        hobby_ids = data.get("hobby_ids")

        if hobby_ids is not None:

            StudentHobby.objects.filter(
                student_profile=student_profile
            ).delete()

            for hobby_id in hobby_ids:

                StudentHobby.objects.create(
                    student_profile=student_profile,
                    hobby_id=hobby_id
                )

        # ==========================
        # 🔹 Update Profile Completion
        # ==========================
        student_profile.update_profile_completion()

        return Response({
            "message": "Student profile updated successfully"
        }, status=status.HTTP_200_OK)
    

 
        
class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            
            if not refresh_token:
                return Response(
                    {"error": "Refresh token is required"},
                    status=400
                )
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            return Response({"message": "Logged out successfully"})
        
        except Exception:
            return Response(
                {"error": "Invalid or expired token"},
                status=400
            )
            
            
class AdminUserListAPIView(APIView):
    """
    Returns a list of all non-student and non-parent users.

    This API is used for admin dashboards to fetch users such as
    super_admin, admin, counsellor, and other staff roles.
    Student and parent users are explicitly excluded from the response.
    """
    
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # -----------------------------
        # 1. EXCLUDE STUDENT & PARENT
        # -----------------------------
        users = User.objects.exclude(
            role__name__in=["student", "parent"]
        ).select_related("role")

        # -----------------------------
        # 2. BUILD RESPONSE
        # -----------------------------
        data = []
        for user in users:
            data.append({
                "public_id": user.public_id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "phone": user.phone,
                "role": user.role.name if user.role else None,
                "is_active": user.is_active,
                "created_at": user.created_at
            })

        return Response({
            "count": len(data),
            "users": data
        }, status=200)
        
      
class StudentListAPIView(APIView):
    """
    Fetch students with profile, program, package, exams, payment, sessions
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        students = (
            User.objects
            .filter(role__name="student")
            .select_related()
        )
        students = StudentProfile.objects.select_related("user")
        serializer = StudentListSerializer(students, many=True, context={"request": request} )

        return Response(
            {
                "success": True,
                "message": "Student list fetched successfully",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK
        )
        
class HandholdingUsersListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        # ✅ Subquery FIRST
        not_booked_session = HandHoldingParticipantSession.objects.filter(
            handholding_participant=OuterRef("pk"),
            status="not_booked"
        ).order_by("session_no")

        # ✅ APPLY annotation here
        handholding_users = HandHoldingParticipant.objects.select_related("user").annotate(
            next_not_booked_session_no=Subquery(
                not_booked_session.values("session_no")[:1]
            )
        )

        # ✅ THEN serialize
        serializer = HandholdingUsersListSerializer(
            handholding_users,
            many=True,
            context={"request": request}
        )

        return Response(
            {
                "success": True,
                "message": "Handholding users fetched successfully",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK
        )

class AdminDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = now().date()

        
        # =====================================
        # 🔹 1. LEADS (Enquiry + Converted)
        # =====================================
        lead_counts = Lead.objects.aggregate(
            total_enquiry=Count('id', filter=Q(status='enquiry')),
            total_converted=Count('id', filter=Q(status='converted')),
            total_leads=Count('id')
        )

        # =====================================
        # 🔹 2. REGISTERED STUDENTS (Only Student Role)
        # =====================================
        registered_students = User.objects.filter(
            role__name__iexact='student'
        ).count()

        # =====================================
        # 🔹 3. PAYMENT EXPECTED (Unique User-Package)
        # =====================================
        # user_packages = Payment.objects.values(
        #     'user_id', 'package_id', 'package__price'
        # ).distinct()

        # total_expected = sum(
        #     item['package__price'] for item in user_packages
        # ) if user_packages else 0
        total_expected = UserProgramPackage.objects.aggregate(
            total=Sum('package__price')
        )['total'] or 0

        # =====================================
        # 🔹 4. TOTAL COLLECTED
        # =====================================
        total_collected = Payment.objects.aggregate(
            collected=Sum(
                'amount',
                filter=Q(status__in=['fully_paid', 'partial_paid'])
            )
        )['collected'] or 0
        
        
        # =====================================
        # 🔹 5. PAYMENT PENDING REVIEW
        # =====================================
        pending_revenue = total_expected - total_collected

        # =====================================
        # 🔹 6. TODAY SESSIONS
        # =====================================
        today_sessions = Booking.objects.filter(date=today)

        today_session_counts = today_sessions.aggregate(
            total=Count('id'),
            booked=Count('id', filter=Q(status='booked')),
            completed=Count('id', filter=Q(status='completed')),
        )

        # =====================================
        # 🔹 7. USER EXAMS
        # =====================================
        user_exam_counts = UserExam.objects.aggregate(
            total=Count('id'),
            in_progress=Count('id', filter=Q(status='in_progress')),
            pending_approval=Count('id', filter=Q(status='pending_approval')),
            completed=Count('id', filter=Q(status='completed')),
        )

        # =====================================
        # 🔹 8. REPORT NOT RECEIVED
        # =====================================
        report_not_received = Report.objects.filter(
            report_status='not_received'
        ).count()

        # =====================================
        # 🔹 9. CONTENT (Free vs Premium)
        # =====================================
        content_counts = Content.objects.aggregate(
            total=Count('id'),
            free=Count('id', filter=Q(free_content=True)),
            premium=Count('id', filter=Q(payment_required=True)),
        )

        # =====================================
        # 🔥 FINAL RESPONSE
        # =====================================
        return Response({            
            "leads": {
                "total_leads": lead_counts.get('total_leads', 0),
                "total_enquiry": lead_counts.get('total_enquiry', 0),
                "total_converted": lead_counts.get('total_converted', 0),
            },

            "students": {
                "registered_students": registered_students
            },

            "payments": {
                "total_expected": total_expected,
                "total_collected": total_collected,
                "total_pending": pending_revenue
            },

            "today_sessions": {
                "date": today,
                "total": today_session_counts.get('total', 0),
                "booked": today_session_counts.get('booked', 0),
                "completed": today_session_counts.get('completed', 0),
            },

            "user_exams": {
                "total": user_exam_counts.get('total', 0),
                "in_progress": user_exam_counts.get('in_progress', 0),
                "pending_approval": user_exam_counts.get('pending_approval', 0),
                "completed": user_exam_counts.get('completed', 0),
            },

            "reports": {
                "not_received": report_not_received
            },

            "content": {
                "total": content_counts.get('total', 0),
                "free": content_counts.get('free', 0),
                "premium": content_counts.get('premium', 0),
            }
        })
        
class LeadStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        current_year = datetime.now().year
        start_year = current_year - 4

        # ======================================
        # 🔹 FILTER LAST 5 YEARS DATA
        # ======================================

        start_date = datetime(start_year, 1, 1)

        leads = Lead.objects.filter(
            created_at__gte=start_date
        )

        # ======================================
        # 🔹 YEARLY DATA
        # ======================================

        yearly_data = leads.values(
            "created_at__year",
            "status"
        ).annotate(
            count=Count("id")
        )

        yearly_result = defaultdict(lambda: {"enquiry": 0, "converted": 0})

        for entry in yearly_data:
            year = entry["created_at__year"]
            status = entry["status"]
            yearly_result[year][status] = entry["count"]

        # ensure all 5 years exist
        # for year in range(start_year, current_year + 1):
        #     yearly_result[year]
        for year in range(start_year, current_year + 1):
            data = yearly_result[year]
            data["total"] = data["enquiry"] + data["converted"]

        # ======================================
        # 🔹 MONTHLY DATA (Last 12 Months)
        # ======================================

        today = datetime.now().replace(day=1)

        monthly_result = {}
        months_list = []

        for i in range(11, -1, -1):
            month_start = today - relativedelta(months=i)
            months_list.append(month_start)

            label = f"{month_abbr[month_start.month]} {month_start.year}"

            monthly_result[label] = {
                "enquiry": 0,
                "converted": 0
            }

        start_month = months_list[0]

        monthly_counts = leads.filter(
            created_at__gte=start_month
        ).annotate(
            month=TruncMonth("created_at")
        ).values(
            "month",
            "status"
        ).annotate(
            count=Count("id")
        )

        for entry in monthly_counts:
            month_date = entry["month"]
            label = f"{month_abbr[month_date.month]} {month_date.year}"

            monthly_result[label][entry["status"]] = entry["count"]
            
        for month in monthly_result:
            data = monthly_result[month]
            data["total"] = data["enquiry"] + data["converted"]

        # ======================================
        # 🔹 WEEKLY DATA (Current Month)
        # ======================================

        today = datetime.now()

        year = today.year
        month = today.month

        month_key = f"{year}-{str(month).zfill(2)}"

        first_day = datetime(year, month, 1).date()
        last_day = datetime(year, month, monthrange(year, month)[1]).date()

        start_calendar = first_day - timedelta(days=(first_day.weekday() + 1) % 7)
        end_calendar = last_day + timedelta(days=(5 - last_day.weekday()) % 7)

        weekly_result = {month_key: {}}

        week_number = 1
        current_start = start_calendar

        while current_start <= end_calendar:
            weekly_result[month_key][f"week{week_number}"] = {
                "enquiry": 0,
                "converted": 0
            }

            current_start += timedelta(days=7)
            week_number += 1

        # filter current month leads

        month_leads = leads.filter(
            created_at__year=year,
            created_at__month=month
        )

        for lead in month_leads:

            delta_days = (lead.created_at.date() - start_calendar).days
            week_number = (delta_days // 7) + 1
            week_key = f"week{week_number}"

            if week_key in weekly_result[month_key]:
                weekly_result[month_key][week_key][lead.status] += 1
                
        for week in weekly_result[month_key]:
            data = weekly_result[month_key][week]
            data["total"] = data["enquiry"] + data["converted"]

        # ======================================
        # 🔹 RESPONSE
        # ======================================

        return Response({
            "yearly": dict(yearly_result),
            "monthly": monthly_result,
            "weekly": weekly_result
        })  
        
        
             
class RevenueStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        current_year = datetime.now().year

        # =====================================================
        # 🔹 MONTHLY EXPECTED REVENUE (DISTINCT USER + PACKAGE)
        # =====================================================
        monthly_expected_queryset = Payment.objects.filter(
            created_at__year=current_year
        ).values(
            'user_id',
            'package_id',
            'package__price',
            'created_at__month'
        ).distinct()

        monthly_expected = defaultdict(lambda: Decimal('0.00'))

        for item in monthly_expected_queryset:
            month_key = f"{current_year}-{str(item['created_at__month']).zfill(2)}"
            monthly_expected[month_key] += item['package__price'] or Decimal('0.00')

        # =====================================================
        # 🔹 MONTHLY RECEIVED REVENUE (ACTUAL PAYMENTS)
        # =====================================================
        monthly_received_queryset = Payment.objects.filter(
            created_at__year=current_year,
            status__in=["fully_paid", "partial_paid"]
        ).values(
            'created_at__month'
        ).annotate(
            total_received=Sum('amount')
        )

        monthly_received = {}
        for item in monthly_received_queryset:
            month_key = f"{current_year}-{str(item['created_at__month']).zfill(2)}"
            monthly_received[month_key] = item['total_received'] or Decimal('0.00')

        # =====================================================
        # 🔹 PREPARE ALL 12 MONTHS
        # =====================================================
        revenue_result = {}

        for month in range(1, 13):
            key = f"{current_year}-{str(month).zfill(2)}"

            revenue_result[key] = {
                "expected_revenue": monthly_expected.get(key, Decimal('0.00')),
                "received_revenue": monthly_received.get(key, Decimal('0.00'))
            }

        # =====================================================
        # 🔹 OVERALL TOTAL (CORRECT LOGIC)
        # =====================================================

        # Expected (Distinct user + package)
        overall_expected_queryset = Payment.objects.values(
            'user_id',
            'package_id',
            'package__price'
        ).distinct()

        total_expected = sum(
            item['package__price'] or Decimal('0.00')
            for item in overall_expected_queryset
        )

        # Received
        total_received = Payment.objects.filter(
            status__in=["fully_paid", "partial_paid"]
        ).aggregate(
            total=Sum('amount')
        )["total"] or Decimal('0.00')

        # =====================================================
        # 🔹 RESPONSE
        # =====================================================
        return Response({
            "overall": {
                "expected_revenue": total_expected,
                "received_revenue": total_received,
                "outstanding_revenue": total_expected - total_received
            },
            "monthly": revenue_result
        })