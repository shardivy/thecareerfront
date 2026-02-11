from django.shortcuts import get_object_or_404, render
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

from accounts.permissions import IsAdmin, IsSuperAdmin
from accounts.serializers import PermissionSerializer, RolePermissionSerializer, RoleSerializer, StudentListSerializer, UserSerializer
from lead_registration.models import StudentProfile
from program_package.models import UserProgramPackage

from .models import PasswordResetOTP, Permission, Role, RolePermission, User
from .utils import  generate_otp, generate_role_id, send_otp_email, send_password_reset_email


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

class AdminStaffRegisterAPIView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        data = request.data

        email = data.get("email")
        password = data.get("password")
        role_name = data.get("role")

        first_name = data.get("first_name")
        last_name = data.get("last_name")
        phone = data.get("phone")

        # -----------------------------
        # 1. BASIC VALIDATION
        # -----------------------------
        if not email or not password or not role_name:
            return Response(
                {"error": "Email, password and role are required"},
                status=400
            )

        # -----------------------------
        # 2. ROLE WHITELIST
        # -----------------------------
        allowed_roles = [
            "super_admin",
            "admin",
            "lead_counsellor",
            "counsellor"
        ]

        if role_name not in allowed_roles:
            return Response(
                {"error": "You are not allowed to register with this role"},
                status=403
            )

        # -----------------------------
        # 3. CHECK DUPLICATES
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
        # 4. GET ROLE
        # -----------------------------
        role = Role.objects.filter(name=role_name).first()
        if not role:
            return Response(
                {"error": "Role not configured"},
                status=500
            )

        # -----------------------------
        # 5. CREATE USER
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
        # 6. GENERATE ROLE ID
        # -----------------------------
        user.public_id = generate_role_id(
            role_name,
            User,
            "public_id"
        )
        user.save()

        return Response({
            "message": "User registered successfully",
            "user": {
                "email": user.email,
                "role": role_name,
                "user_id": user.public_id
            }
        }, status=201)

# class LoginAPIView(APIView):
#     permission_classes = [AllowAny]

#     def post(self, request):
#         email = request.data.get('email')
#         password = request.data.get('password')

#         if not email or not password:
#             return Response(
#                 {"error": "Email and password are required"},
#                 status=400
#             )

#         # 🔥 IMPORTANT FIX
#         user = authenticate(username=email, password=password)

#         if not user:
#             return Response({"error": "Invalid credentials"}, status=401)

#         if not user.is_active:
#             return Response(
#                 {"error": "Account is inactive"},
#                 status=403
#             )

#         refresh = RefreshToken.for_user(user)

#         return Response({
#             "access": str(refresh.access_token),
#             "refresh": str(refresh),
#             "user": {
#                 "id": user.id,
#                 "email": user.email,
#                 "role": user.role.name
#             }
#         })



# class LoginAPIView(APIView):
#     permission_classes = [AllowAny]

#     def post(self, request):
#         email = request.data.get("email")
#         password = request.data.get("password")
#         requested_role = request.data.get("role")  # OPTIONAL

#         # -----------------------------
#         # 1. BASIC VALIDATION
#         # -----------------------------
#         if not email or not password:
#             return Response(
#                 {"error": "Email and password are required"},
#                 status=400
#             )

#         # -----------------------------
#         # 2. AUTHENTICATION
#         # -----------------------------
#         user = authenticate(username=email, password=password)

#         if not user:
#             return Response({"error": "Invalid credentials"}, status=401)

#         if not user.is_active:
#             return Response({"error": "Account is inactive"}, status=403)

#         if not user.role:
#             return Response(
#                 {"error": "User role not assigned. Contact admin."},
#                 status=403
#             )

#         actual_role = user.role.name

#         # -----------------------------
#         # 3. ROLE VALIDATION RULES
#         # -----------------------------
#         admin_roles = ["super_admin", "admin", "lead_counsellor", "counsellor", ]

#         if actual_role in admin_roles:
#             # 🔒 Admin-side login MUST send role
#             if not requested_role:
#                 return Response(
#                     {"error": "Role is required for admin login"},
#                     status=400
#                 )

#             if requested_role != actual_role:
#                 return Response(
#                     {"error": "Role mismatch. Access denied."},
#                     status=403
#                 )

#         # 🔓 Student / Parent → role auto-detected
#         elif actual_role in ["student", "parent"]:
#             pass  # no role check needed

#         else:
#             return Response(
#                 {"error": "Invalid user role"},
#                 status=403
#             )

#         # -----------------------------
#         # 4. ROLE-SPECIFIC USER ID
#         # -----------------------------
#         response_user_id = None

#         if actual_role in ["super_admin", "admin", "counsellor"]:
#             if not user.public_id:
#                 user.public_id = generate_role_id(
#                     actual_role,
#                     User,
#                     "public_id"
#                 )
#                 user.save()
#             response_user_id = user.public_id

#         elif actual_role == "student":
#             if not hasattr(user, "studentprofile"):
#                 return Response(
#                     {"error": "Student profile not found"},
#                     status=404
#                 )
#             response_user_id = user.studentprofile.id

#         elif actual_role == "parent":
#             if not hasattr(user, "parentprofile"):
#                 return Response(
#                     {"error": "Parent profile not found"},
#                     status=404
#                 )
#             response_user_id = user.parentprofile.id

#         # -----------------------------
#         # 5. TOKEN GENERATION
#         # -----------------------------
#         refresh = RefreshToken.for_user(user)

#         return Response({
#             "access": str(refresh.access_token),
#             "refresh": str(refresh),
#             "user": {
#                 "email": user.email,
#                 "role": actual_role,
#                 "user_id": response_user_id
#             },
#             "message": "Login Successfully.",
#         }, status=status.HTTP_200_OK)

# class LoginAPIView(APIView):
#     permission_classes = [AllowAny]

#     # 🔑 Login API: generates new JWT tokens and returns user info
#     def post(self, request):
#         email = request.data.get("email")
#         password = request.data.get("password")
#         requested_role = request.data.get("role")  # optional, required for admin

#         # 1️⃣ Validate credentials
#         if not email or not password:
#             return Response({"error": "Email and password are required"}, status=400)

#         user = authenticate(username=email, password=password)
#         if not user:
#             return Response({"error": "Invalid credentials"}, status=401)
#         if not user.is_active:
#             return Response({"error": "Account is inactive"}, status=403)
#         if not user.role:
#             return Response({"error": "User role not assigned. Contact admin."}, status=403)

#         actual_role = user.role.name

#         # 2️⃣ Role validation
#         admin_roles = ["superadmin", "admin", "lead_counsellor", "counsellor"]
#         if actual_role in admin_roles:
#             if not requested_role:
#                 return Response({"error": "Role is required for admin login"}, status=400)
#             if requested_role != actual_role:
#                 return Response({"error": "Role mismatch. Access denied."}, status=403)
#         elif actual_role not in ["student", "parent"]:
#             return Response({"error": "Invalid user role"}, status=403)

#         # 3️⃣ Determine role-specific user ID
#         response_user_id = None
#         if actual_role in ["superadmin", "admin", "counsellor"]:
#             if not user.public_id:
#                 user.public_id = generate_role_id(actual_role, User, "public_id")
#                 user.save()
#             response_user_id = user.public_id
#         elif actual_role == "student":
#             if not hasattr(user, "studentprofile"):
#                 return Response({"error": "Student profile not found"}, status=404)
#             response_user_id = user.studentprofile.id
#         elif actual_role == "parent":
#             if not hasattr(user, "parentprofile"):
#                 return Response({"error": "Parent profile not found"}, status=404)
#             response_user_id = user.parentprofile.id

#         # 4️⃣ Generate fresh JWT tokens
#         refresh = RefreshToken.for_user(user)

#         return Response(
#             {
#                 "access": str(refresh.access_token),   # use this token in Authorization header
#                 "refresh": str(refresh),               # store securely for refresh
#                 "user": {
#                     "email": user.email,
#                     "role": actual_role,
#                     "user_id": response_user_id,
#                 },
#                 "message": "Login Successfully.",
#             },
#             status=status.HTTP_200_OK,
#         )


class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        # 1️⃣ Validate credentials
        if not email or not password:
            return Response({"error": "Email and password are required"}, status=400)

        user = authenticate(username=email, password=password)
        if not user:
            return Response({"error": "Invalid credentials"}, status=401)
        if not user.is_active:
            return Response({"error": "Account is inactive"}, status=403)
        if not user.role:
            return Response({"error": "User role not assigned. Contact admin."}, status=403)

        # 2️⃣ Determine actual role automatically
        actual_role = user.role.name  # role from DB

        # Optional: Restrict login for unknown roles
        allowed_roles = ["superadmin", "admin", "lead_counsellor", "counsellor", "student", "parent"]
        if actual_role not in allowed_roles:
            return Response({"error": "Invalid user role"}, status=403)

        # 3️⃣ Determine role-specific user ID
        response_user_id = None
        if actual_role in ["superadmin", "admin", "counsellor"]:
            if not user.public_id:
                user.public_id = generate_role_id(actual_role, User, "public_id")
                user.save()
            response_user_id = user.public_id
        elif actual_role == "student":
            if not hasattr(user, "studentprofile"):
                return Response({"error": "Student profile not found"}, status=404)
            response_user_id = user.studentprofile.id
        elif actual_role == "parent":
            if not hasattr(user, "parentprofile"):
                return Response({"error": "Parent profile not found"}, status=404)
            response_user_id = user.parentprofile.id

        # 4️⃣ Generate fresh JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "email": user.email,
                    "role": actual_role,          # automatically returned
                    "user_id": response_user_id,
                },
                "message": "Login Successfully.",
            },
            status=status.HTTP_200_OK,
        )

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
        
class ProfileUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user

        return Response({
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role.name if user.role else None,
            "is_active": user.is_active,
            "created_at": user.created_at
        })

    @transaction.atomic
    def put(self, request):
        user = request.user
        data = request.data

        # 🔒 Email & role are NOT editable
        if 'email' in data:
            return Response(
                {"error": "Email cannot be updated"},
                status=400
            )

        if 'role' in data:
            return Response(
                {"error": "Role cannot be updated"},
                status=400
            )

        # ✅ Allowed fields
        user.first_name = data.get('first_name', user.first_name)
        user.last_name = data.get('last_name', user.last_name)
        user.phone = data.get('phone', user.phone)

        user.save()

        return Response({
            "message": "Profile updated successfully",
            "user": {
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "phone": user.phone,
                "role": user.role.name if user.role else None
            }
        })
        
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
        
        
# class StudentListAPIView(APIView):
#     """
#     Returns a list of users with the 'student' role 
#     """
#     permission_classes = [IsAdmin  | IsSuperAdmin]

#     def get(self, request):
#         # Filter users with role 'student'
#         students = User.objects.filter(role__name='student')  # adjust field name if needed
#         serializer = UserSerializer(students, many=True)
#         return Response(
#             {
#                 "success": True,
#                 "data": serializer.data,
#                 "message": "List of student users"
#             },
#             status=status.HTTP_200_OK
#         )

      
class StudentListAPIView(APIView):
    """
    Fetch students with profile, program, package, exams, payment, sessions
    """
    permission_classes = [IsAdmin | IsSuperAdmin]

    def get(self, request):
        students = (
            User.objects
            .filter(role__name="student")
            .select_related()
        )
        students = StudentProfile.objects.select_related("user")
        serializer = StudentListSerializer(students, many=True)

        return Response(
            {
                "success": True,
                "message": "Student list fetched successfully",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK
        )
