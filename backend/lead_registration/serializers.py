from decimal import Decimal
import json
import re
from urllib import request

from rest_framework import serializers

from accounts.models import User
from event.models import HandHoldingParticipant
from lead_registration.models import Hobby, Lead, Stream, StudentAcademicHistory, StudentHobby, StudentProfile, StudentStream, StudentSubjectPreference, Subject
from program_package.models import Package, Program, UserProgramPackage
from program_package.serializers import PackageSerializer, ProgramSerializer
from payment.models import Payment  


class LeadPackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Package
        fields = (
            "id",
            "name",
            "price",
            "description",
            "is_active",
            "created_at",
        )
        
class HandHoldingParticipantSerializer(serializers.ModelSerializer):
    photo = serializers.SerializerMethodField()
    resume_file = serializers.SerializerMethodField()
    proof_file = serializers.SerializerMethodField()
    
    class Meta:
        model = HandHoldingParticipant
        fields = [
            "show_profile",
            "photo",
            "resume_file",
            "proof_file", 
            "full_address",
            "city",
            "state",
            "preferred_counselling_mode",
            "payment"
        ]
        
    def get_photo(self, obj):
        request = self.context.get("request")
        if obj.photo:
            return request.build_absolute_uri(obj.photo.url)
        return None

    def get_resume_file(self, obj):
        request = self.context.get("request")
        if obj.resume_file:
            return request.build_absolute_uri(obj.resume_file.url)
        return None
    
    def get_proof_file(self, obj):
        request = self.context.get("request")

        payment = Payment.objects.filter(
            user=obj.user,
            proof_file__isnull=False
        ).exclude(proof_file="").order_by("-created_at").first()

        if payment and payment.proof_file and request:
            return request.build_absolute_uri(payment.proof_file.url)

        return None


class LeadSerializer(serializers.ModelSerializer):
    program = serializers.PrimaryKeyRelatedField(
        queryset=Program.objects.all(),
        many=True,
        required=False
    )

    program_detail = ProgramSerializer(
        source="program",
        many=True,
        read_only=True
    )
    # package_detail = serializers.SerializerMethodField()
    preferred_counselling_mode = serializers.SerializerMethodField()
    handholding_details = serializers.SerializerMethodField() 
       
    class Meta:
        model = Lead
        fields = (
            'id',
            'first_name',
            'last_name',
            'phone',
            'email',
            'dob',
            'preferred_counselling_mode',
            'program',
            'program_detail',
            # 'package_detail',
            'handholding_details',
            'source',
            'status',
            'date',
        )
        read_only_fields = ('status',) 
        
    def create(self, validated_data):
        programs = validated_data.pop("program", [])

        lead = Lead.objects.create(**validated_data)

        if programs:
            lead.program.set(programs)

        return lead


    def update(self, instance, validated_data):
        programs = validated_data.pop("program", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if programs is not None:
            instance.program.set(programs)

        return instance
    
    # =========================================
    # ✅ PROGRAM IDS
    # =========================================
    # def get_program(self, obj):
    #     try:
    #         if not obj.email:
    #             return []

    #         user = User.objects.filter(
    #             email__iexact=obj.email.strip()
    #         ).first()

    #         if not user:
    #             return []

    #         return list(
    #             UserProgramPackage.objects.filter(
    #                 user=user
    #             ).values_list(
    #                 "program_id",
    #                 flat=True
    #             ).distinct()
    #         )

    #     except Exception as e:
    #         print("PROGRAM ERROR:", e)
    #         return []
        
    # =========================================
    # ✅ PROGRAM DETAILS
    # =========================================
    # def get_program_detail(self, obj):
    #     try:
    #         if not obj.email:
    #             return []

    #         user = User.objects.filter(
    #             email__iexact=obj.email.strip()
    #         ).first()

    #         if not user:
    #             return []

    #         programs = Program.objects.filter(
    #             userprogrampackage__user=user
    #         ).distinct()

    #         return ProgramSerializer(
    #             programs,
    #             many=True
    #         ).data

    #     except Exception as e:
    #         print("PROGRAM DETAIL ERROR:", e)
    #         return []


        
   
    def get_preferred_counselling_mode(self, obj):
        try:
            user = User.objects.filter(email=obj.email).first()
            if not user:
                return None

            # ✅ 1. Try StudentProfile (normal users)
            profile = getattr(user, "student_profile", None)
            if profile and profile.preferred_counselling_mode:
                return profile.preferred_counselling_mode

            # ✅ 2. Fallback to HandHoldingParticipant
            participant = HandHoldingParticipant.objects.filter(user=user).first()

            if not participant:
                # fallback via email (important)
                participant = HandHoldingParticipant.objects.filter(email=obj.email).first()

            if participant:
                return participant.mode

            return None

        except Exception:
            return None
        
   
    
    # def get_package_detail(self, obj):
    #     try:
    #         if not obj.email:
    #             return None

    #         user = User.objects.filter(email__iexact=obj.email.strip()).first()
    #         if not user:
    #             return None

    #         upp = (
    #             UserProgramPackage.objects
    #             .filter(user=user)
    #             .select_related('package')
    #             .order_by('-id')
    #             .first()
    #         )

    #         if not upp or not upp.package:
    #             return None

    #         return LeadPackageSerializer(upp.package).data

    #     except Exception as e:
    #         print("PACKAGE ERROR:", e)
    #         return None
    
    def get_handholding_details(self, obj):
        try:
            user = User.objects.filter(email=obj.email).first()

            participant = None

            # ✅ First try via user
            if user:
                participant = HandHoldingParticipant.objects.filter(user=user).first()

            # ✅ Fallback via email
            if not participant and obj.email:
                participant = HandHoldingParticipant.objects.filter(email=obj.email).first()

            if not participant:
                return None

            return HandHoldingParticipantSerializer(participant, context={"request": self.context.get("request")}).data

        except Exception as e:
            print("ERROR:", e)
            return None

    def validate_phone(self, value):
        if value and not value.isdigit():
            raise serializers.ValidationError("Phone number must contain only digits.")
        return value

    def validate_email(self, value):
        lead_id = self.instance.id if self.instance else None

        if Lead.objects.exclude(id=lead_id).filter(email=value).exists():
            raise serializers.ValidationError(
                "Enquiry with this email already exists."
            )
            
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "A user with this email already exists."
            )

        return value
    

# class AddUserSerializer(serializers.Serializer):
#     # -------------------------
#     # User fields
#     # -------------------------
#     first_name = serializers.CharField()
#     last_name = serializers.CharField()
#     email = serializers.EmailField(required=False)
#     phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)
#     password = serializers.CharField(required=False, write_only=True)
    
#     photo = serializers.FileField(required=False, allow_null=True)
#     resume_file = serializers.FileField(required=False, allow_null=True)
#     show_profile = serializers.BooleanField(required=False, default=False)


#     # -------------------------
#     # StudentProfile fields
#     # -------------------------
#     study_class = serializers.CharField(required=False, allow_blank=True)
#     current_academic_stage = serializers.CharField(required=False, allow_blank=True)
#     current_academic_year = serializers.CharField(required=False, allow_blank=True)
#     school_college = serializers.CharField(required=False, allow_blank=True)
#     city = serializers.CharField(required=False, allow_blank=True)
#     preferred_counselling_mode = serializers.CharField(required=False, allow_blank=True)

#     # -------------------------
#     # Program & Package
#     # -------------------------
#     program = serializers.PrimaryKeyRelatedField(queryset=Program.objects.all())
#     package = serializers.PrimaryKeyRelatedField(queryset=Package.objects.all(), required=False, allow_null=True)

#     # -------------------------
#     # Payment (optional)
#     # -------------------------
#     amount = serializers.DecimalField(
#         max_digits=20, decimal_places=2, required=False, allow_null=True
#     )
#     payment_type = serializers.ChoiceField(
#         choices=Payment.PAYMENTTYPE_CHOICE, required=False, allow_null=True, allow_blank=True
#     )
#     transaction_id = serializers.CharField(
#         required=False, allow_blank=True, allow_null=True
#     )
#     method = serializers.CharField(required=False, allow_blank=True)
#     proof_file = serializers.FileField(required=False, allow_null=True)

#     # -------------------------
#     # Email Validation
#     # -------------------------
#     def validate_email(self, value):
#         user_id = self.context.get("user_id")

#         qs = User.objects.filter(email=value)
#         if user_id:
#             qs = qs.exclude(id=user_id)

#         if qs.exists():
#             raise serializers.ValidationError("Email already exists.")

#         return value

#     # def validate_phone(self, value):
#     #     if not value:
#     #         return value

#     #     # normalize phone (optional but recommended)
#     #     phone = value.strip().replace(" ", "")

#     #     user_id = self.context.get("user_id")

#     #     qs = User.objects.filter(phone=phone)

#     #     # ✅ exclude current user (VERY IMPORTANT)
#     #     if user_id:
#     #         qs = qs.exclude(id=user_id)

#     #     if qs.exists():
#     #         raise serializers.ValidationError("Phone number already exists.")

#     #     return phone

#     # -------------------------
#     # Cross-field Validation
#     # -------------------------
    
#     def validate(self, attrs):
#         package = attrs.get("package")
#         program = attrs.get("program")
#         amount = attrs.get("amount")
#         payment_type = attrs.get("payment_type")

#         is_handholding = package.is_handholding if package else False

#         # ================================
#         # ✅ PACKAGE VALIDATION
#         # ================================
#         if not is_handholding:
#             # Package required for other programs
#             if not package:
#                 raise serializers.ValidationError({
#                     "package": "This field is required."
#                 })

#             # Ensure package belongs to program
#             if package and program and package.program != program:
#                 raise serializers.ValidationError({
#                     "package": "Selected package does not belong to the selected program."
#                 })

#         # ================================
#         # ✅ PAYMENT VALIDATION
#         # ================================
#         if amount is not None and not is_handholding:

#             package_price = package.price if package else Decimal("0")

#             # ❌ Exceeding package amount
#             if amount > package_price:
#                 raise serializers.ValidationError({
#                     "amount": f"Amount cannot exceed package price ₹{package_price}."
#                 })

#             # (Optional) enforce payment type
#             # if amount > 0 and not payment_type:
#             #     raise serializers.ValidationError({
#             #         "payment_type": "Payment type is required when amount is provided."
#             #     })

#         return attrs

class AddUserSerializer(serializers.Serializer):
    # -------------------------
    # User fields
    # -------------------------
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    password = serializers.CharField(required=False, write_only=True)
    
    photo = serializers.FileField(required=False, allow_null=True)
    resume_file = serializers.FileField(required=False, allow_null=True)
    show_profile = serializers.BooleanField(required=False, default=False)


    # -------------------------
    # StudentProfile fields
    # -------------------------
    study_class = serializers.CharField(required=False, allow_blank=True)
    current_academic_stage = serializers.CharField(required=False, allow_blank=True)
    current_academic_year = serializers.CharField(required=False, allow_blank=True)
    school_college = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True)
    preferred_counselling_mode = serializers.CharField(required=False, allow_blank=True)

    # -------------------------
    # Program & Package
    # -------------------------
    program = serializers.PrimaryKeyRelatedField(
        queryset=Program.objects.all(),
        many=True
    )

    package = serializers.PrimaryKeyRelatedField(
        queryset=Package.objects.all(),
        many=True,
        required=False
    )
    # -------------------------
    # Payment (optional)
    # -------------------------
    amount = serializers.DecimalField(
        max_digits=20, decimal_places=2, required=False, allow_null=True
    )
    payment_type = serializers.ChoiceField(
        choices=Payment.PAYMENTTYPE_CHOICE, required=False, allow_null=True, allow_blank=True
    )
    transaction_id = serializers.CharField(
        required=False, allow_blank=True, allow_null=True
    )
    method = serializers.CharField(required=False, allow_blank=True)
    proof_file = serializers.FileField(required=False, allow_null=True)

    # -------------------------
    # Email Validation
    # -------------------------
    def validate_email(self, value):
        user_id = self.context.get("user_id")

        qs = User.objects.filter(email__iexact=value)
        if user_id:
            qs = qs.exclude(id=user_id)

        if qs.exists():
            raise serializers.ValidationError("Email already exists.")

        return value

    # def validate_phone(self, value):
    #     if not value:
    #         return value

    #     # normalize phone (optional but recommended)
    #     phone = value.strip().replace(" ", "")

    #     user_id = self.context.get("user_id")

    #     qs = User.objects.filter(phone=phone)

    #     # ✅ exclude current user (VERY IMPORTANT)
    #     if user_id:
    #         qs = qs.exclude(id=user_id)

    #     if qs.exists():
    #         raise serializers.ValidationError("Phone number already exists.")

    #     return phone

    # -------------------------
    # Cross-field Validation
    # -------------------------
    
    def validate(self, attrs):
        programs = attrs.get("program", [])
        packages = attrs.get("package", [])
        amount = attrs.get("amount")
        payment_type = attrs.get("payment_type")
        transaction_id = attrs.get("transaction_id")

        if len(programs) != len(packages):
            raise serializers.ValidationError(
                "Programs and packages count must match."
            )

        # ================================
        # ✅ PROGRAM-PACKAGE VALIDATION
        # ================================
        for program, package in zip(programs, packages):
            if package.program_id != program.id:
                raise serializers.ValidationError(
                    f"Package {package.id} does not belong to Program {program.id}"
                )

        amount = attrs.get("amount")
        payment_type = attrs.get("payment_type")

        # ================================
        # ✅ HANDHOLDING CHECK
        # ================================
        is_handholding = any(
            package.is_handholding
            for package in packages
        )

        # ================================
        # ✅ PACKAGE VALIDATION
        # ================================
        if not is_handholding:

            if not packages:
                raise serializers.ValidationError({
                    "package": "This field is required."
                })

            for program, package in zip(programs, packages):
                if package.program != program:
                    raise serializers.ValidationError({
                        "package": (
                            f"Selected package '{package.name}' "
                            f"does not belong to program '{program.name}'."
                        )
                    })
        # ================================
        # ✅ ONLINE PAYMENT VALIDATION
        # ================================
        if payment_type == "online":

            if not transaction_id:
                raise serializers.ValidationError({
                    "transaction_id": "Transaction ID is required for online payments."
                })

            transaction_id = transaction_id.strip()

            # Generic transaction/reference number validation
            # Allows:
            # 123456789012
            # T240610123456789
            # pay_QxY12AbCd34
            # TXN123456789
            # RRN123456789012
            # UTR1234567890123456

            if not re.match(r"^[A-Za-z0-9@\-_]{6,30}$", transaction_id):
                raise serializers.ValidationError({
                    "transaction_id": (
                        "Enter a valid transaction ID. "
                        "Only letters, numbers, @, hyphen (-) and underscore (_) are allowed."
                    )
                })

        # ================================
        # ✅ PAYMENT VALIDATION
        # ================================
        if amount is not None and not is_handholding:

            total_package_price = sum(
                (package.price or Decimal("0"))
                for package in packages
            )

            # Amount cannot exceed TOTAL package amount
            if amount > total_package_price:
                raise serializers.ValidationError({
                    "amount": (
                        f"Amount cannot exceed total package price "
                        f"₹{total_package_price}."
                    )
                })

        return attrs


class UserProgramPackageResponseSerializer(serializers.ModelSerializer):
    program = ProgramSerializer(read_only=True)
    package = PackageSerializer(read_only=True)

    class Meta:
        model = UserProgramPackage
        fields = ['program', 'package']
        
class StudentAcademicHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentAcademicHistory
        fields = (
            'id',
            'academic_stage',
            'start_year',
            'end_year',
            'is_current',
            'created_at',
            'updated_at',
        )
        
class StreamSerializer(serializers.ModelSerializer):

    # For create/update
    programs = serializers.PrimaryKeyRelatedField(
        queryset=Program.objects.all(),
        many=True,
        required=False,
        write_only=True
    )

    # For GET response
    program_details = serializers.SerializerMethodField()

    class Meta:
        model = Stream
        fields = (
            "id",
            "name",
            "programs",
            "program_details",
            "is_active",
            "created_at",
            "updated_at"
        )

    def get_program_details(self, obj):
        return [
            {
                "id": program.id,
                "name": program.name
            }
            for program in obj.programs.all()
        ]

    def create(self, validated_data):
        programs = validated_data.pop("programs", [])
        stream = Stream.objects.create(**validated_data)
        stream.programs.set(programs)
        return stream

    def update(self, instance, validated_data):
        programs = validated_data.pop("programs", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if programs is not None:
            instance.programs.set(programs)

        return instance
    
    
class StudentStreamSerializer(serializers.ModelSerializer):
    stream_detail = StreamSerializer(source="stream", read_only=True)

    class Meta:
        model = StudentStream
        fields = ("id", "stream", "stream_detail", "created_at")
        read_only_fields = ("created_at",)
        
class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ("id", "name")

class StudentSubjectPreferenceSerializer(serializers.ModelSerializer):
    subject_detail = SubjectSerializer(source="subject", read_only=True)

    class Meta:
        model = StudentSubjectPreference
        fields = (
            "id",
            "subject",
            "subject_detail",
            "preference_type",
            "created_at",
        )
        
class HobbySerializer(serializers.ModelSerializer):
    class Meta:
        model = Hobby
        fields = ("id", "name")
        
class StudentHobbySerializer(serializers.ModelSerializer):
    hobby_detail = HobbySerializer(source="hobby", read_only=True)

    class Meta:
        model = StudentHobby
        fields = (
            "id",
            "hobby",
            "hobby_detail",
            "created_at",
        )
        

class UserDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            # "password",
            "phone",
            "is_active"
        ]

class StudentProfileDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = "__all__"
class ProgramMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = ["id", "name"]
class PackageMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Package
        fields = ["id", "name", "price"]
class UserProgramPackageDetailSerializer(serializers.ModelSerializer):
    program = ProgramMiniSerializer()
    package = PackageMiniSerializer()

    class Meta:
        model = UserProgramPackage
        fields = "__all__"
        
# class PaymentDetailSerializer(serializers.ModelSerializer):
#     proof_file = serializers.SerializerMethodField()
#     payment_date = serializers.SerializerMethodField()
#     program_id = serializers.SerializerMethodField()
#     program = serializers.SerializerMethodField()
#     package_id = serializers.SerializerMethodField()
#     package = serializers.SerializerMethodField()
#     package_price = serializers.SerializerMethodField()

#     class Meta:
#         model = Payment
#         fields = [
#             "id",
#             "amount",
#             "payment_type",
#             "method",
#             "transaction_id",
#             "status",
#             "payment_date",
#             "program_id",
#             "program",
#             "package_id",
#             "package",
#             "package_price",
#             "proof_file",
#             "created_at"
#         ]

#     def get_proof_file(self, obj):
#         request = self.context.get("request")
#         if obj.proof_file and request:
#             return request.build_absolute_uri(obj.proof_file.url)
#         return None
    
#     def get_payment_date(self, obj):
#         """
#         First payment → show created_at
#         Other payments → show date field
#         """
#         request = self.context.get("request")
#         payments = self.context.get("payments")

#         if not payments:
#             return obj.created_at

#         # Get first payment (latest because ordered by -created_at)
#         first_payment = payments.first()

#         if obj.id == first_payment.id:
#             return obj.created_at
#         else:
#             return obj.payment_date   # 👈 your Payment model date field
        
#     def get_program_id(self, obj):
#         upp = self.context.get("upp")
#         if upp:
#             return getattr(upp.program, "id", None)
#         return None

#     def get_program(self, obj):
#         upp = self.context.get("upp")
#         if upp:
#             return getattr(upp.program, "name", None)
#         return None

#     def get_package_id(self, obj):
#         upp = self.context.get("upp")
#         if upp:
#             return getattr(upp.package, "id", None)
#         return None

#     def get_package(self, obj):
#         upp = self.context.get("upp")
#         if upp:
#             return getattr(upp.package, "name", None)
#         return None

#     def get_package_price(self, obj):
#         upp = self.context.get("upp")
#         if upp:
#             return getattr(upp.package, "price", None)
#         return None

class PaymentDetailSerializer(serializers.ModelSerializer):
    proof_file = serializers.SerializerMethodField()
    payment_date = serializers.SerializerMethodField()
    package_price = serializers.SerializerMethodField()
    programs = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            "id",
            "amount",
            "payment_type",
            "method",
            "transaction_id",
            "status",
            "payment_date",
            "package_price",
            "programs",
            "proof_file",
            "created_at"
        ]

    def get_proof_file(self, obj):
        request = self.context.get("request")
        if obj.proof_file and request:
            return request.build_absolute_uri(obj.proof_file.url)
        return None
    
    def get_payment_date(self, obj):
        """
        First payment → show created_at
        Other payments → show date field
        """
        request = self.context.get("request")
        payments = self.context.get("payments")

        if not payments:
            return obj.created_at

        # Get first payment (latest because ordered by -created_at)
        first_payment = payments.first()

        if obj.id == first_payment.id:
            return obj.created_at
        else:
            return obj.payment_date   # 👈 your Payment model date field
    
    def get_package_price(self, obj):
        return str(
            sum(
                package.price
                for package in obj.package.all()
            )
        )
        
    def get_programs(self, obj):

        data = []

        for package in obj.package.all():

            data.append({
                "program_id": package.program.id,
                "program_name": package.program.name,
                "package": {
                    "id": package.id,
                    "name": package.name,
                    "price": str(package.price)
                }
            })

        return data
    
    



# ============================ Student Registration form serializers below =========================

class StudentRegistrationSerializer(serializers.Serializer):
    # =========================
    # 👨‍🎓 Student
    # =========================
    student_name = serializers.CharField(required=True)
    dob = serializers.DateField(required=False, allow_null=True)
    student_email = serializers.EmailField(required=True)
    student_mobile = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    study_class = serializers.CharField(required=True)
    specialization = serializers.CharField(required=False, allow_blank=True)
    stream = serializers.CharField(required=False, allow_blank=True)

    # =========================
    # 👨‍👩 Parent
    # =========================
    parent_mobile = serializers.CharField(required=True)
    parent_email = serializers.EmailField(required=True)
    parent_name = serializers.CharField(required=False, allow_blank=True)
    
#     programs = serializers.PrimaryKeyRelatedField(
#     queryset=Program.objects.all(),
#     many=True
# )
    program = serializers.PrimaryKeyRelatedField(
        queryset=Program.objects.all(),
        many=True, 
        required=True
    )

    # =========================
    # 🔐 Auth
    # =========================
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):

        # 🔐 Password match check
        # if attrs["password"] != attrs["confirm_password"]:
        #     raise serializers.ValidationError({
        #         "password": "Passwords do not match"
        #     })
        if attrs.get("password") != attrs.get("confirm_password"):
            raise serializers.ValidationError({
                "message": "Passwords do not match"
            })

        # =========================
        # 👨‍🎓 Student must be unique
        # =========================
        # if User.objects.filter(email=attrs["student_email"]).exists():
        #     raise serializers.ValidationError({
        #         "student_email": "Student email already exists"
        #     })
        if User.objects.filter(email__iexact=attrs.get("student_email")).exists():
            raise serializers.ValidationError({
                "message": "Student email already exists"
            })
            
        # Check Lead table
        if Lead.objects.filter(email__iexact=attrs.get("student_email")).exists():
            raise serializers.ValidationError({
                "message": "An enquiry with this email already exists"
            })

        # if User.objects.filter(phone=attrs["student_mobile"]).exists():
        #     raise serializers.ValidationError({
        #         "student_mobile": "Student mobile already exists"
        #     })

        # =========================
        # 👨‍👩 Parent can already exist
        # DO NOT validate uniqueness here
        # =========================

        # 🎓 Stream validation
        # stream_id = attrs.get("stream_id")
        # if stream_id and not Stream.objects.filter(id=stream_id).exists():
        #     raise serializers.ValidationError({
        #         "stream_id": "Invalid stream selected"
        #     })
        stream_id = attrs.get("stream_id")
        if stream_id and not Stream.objects.filter(id=stream_id).exists():
            raise serializers.ValidationError({
                "message": "Invalid stream selected"
            })

        return attrs

    
class ParentDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "first_name", "last_name", "email", "phone")


