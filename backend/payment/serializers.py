import re

from rest_framework import serializers
from django.db.models import Sum


from accounts.models import User
from event.models import HandHoldingParticipant
from lead_registration.models import StudentProfile
from payment.models import Payment


from program_package.models import Package
from .models import Payment, PaymentLog

    
# class PaymentCreateSerializer(serializers.ModelSerializer):
#     student_profile = serializers.PrimaryKeyRelatedField(
#         queryset=StudentProfile.objects.all(),
#         write_only=True
#     )

#     transaction_id = serializers.CharField(
#         required=False,
#         allow_blank=False,
#         allow_null=True
#     )

#     proof_file = serializers.FileField(
#         required=False,
#         allow_null=True
#     )

#     class Meta:
#         model = Payment
#         fields = [
#             "student_profile",
#             "package",
#             "amount",
#             "payment_type",
#             "method",
#             "transaction_id",
#             "payment_date",
#             "proof_file",
#         ]

#     def validate(self, attrs):

#         # ✅ Handle UPDATE case
#         if self.instance:
#             student_profile = attrs.get("student_profile", None)
#             package = attrs.get("package", None)
#             amount = attrs.get("amount", None)

#             # If not sent in PUT → use existing values
#             if not student_profile:
#                 student_profile = StudentProfile.objects.filter(
#                     user=self.instance.user
#                 ).first()

#             if not package:
#                 package = self.instance.package

#             if amount is None:
#                 amount = self.instance.amount

#         else:
#             # ✅ CREATE case
#             student_profile = attrs.get("student_profile")
#             package = attrs.get("package")
#             amount = attrs.get("amount")

#             if not student_profile:
#                 raise serializers.ValidationError("student_profile is required.")
#             if not package:
#                 raise serializers.ValidationError("package is required.")
#             if amount is None:
#                 raise serializers.ValidationError("amount is required.")

#         # 🔥 SAFETY CHECK
#         if not package:
#             raise serializers.ValidationError("Package not found.")

#         package_amount = package.price
#         user = student_profile.user

#         # 🔥 IMPORTANT: exclude current instance when updating
#         payments_qs = Payment.objects.filter(
#             user=user,
#             package=package
#         ).exclude(status="not_paid")

#         if self.instance:
#             payments_qs = payments_qs.exclude(id=self.instance.id)

#         total_paid = payments_qs.aggregate(
#             total=Sum("amount")
#         )["total"] or 0

#         remaining_amount = package_amount - total_paid

#        # 🚨 Already fully paid
#         if remaining_amount <= 0:
#             raise serializers.ValidationError(
#                 {"message": "You already paid the full package amount."}
#             )

#         # 🚨 Payment exceeds package price
#         if amount > remaining_amount:
#             raise serializers.ValidationError(
#                 {
#                     "message": f"You are paying more than the package amount."
#                 }
#             )

#         attrs["remaining_amount"] = remaining_amount
#         attrs["student_profile"] = student_profile
#         attrs["package"] = package

#         return attrs


#     def create(self, validated_data):
#         student_profile = validated_data.pop("student_profile")
#         remaining_amount = validated_data.pop("remaining_amount")

#         amount = validated_data.get("amount")
#         user = student_profile.user
#         package = validated_data.get("package")

#         validated_data["user"] = user

#         # 🔥 Decide status BEFORE creating object
#         if amount == remaining_amount:
#             validated_data["status"] = "fully_paid"
#         else:
#             validated_data["status"] = "partial_paid"

#         # ✅ Create payment with correct status
#         payment = super().create(validated_data)

#         # 🔥 Recalculate total after creation
#         total_paid_after = (
#             Payment.objects.filter(
#                 user=user,
#                 package=package
#             ).aggregate(total=Sum("amount"))["total"] or 0
#         )

#         package_amount = package.price

#         # If fully paid → update all entries
#         # if total_paid_after >= package_amount:
#         #     Payment.objects.filter(
#         #         user=user,
#         #         package=package
#         #     ).update(status="fully_paid")

#         return payment
    
#     # def create(self, validated_data):
#     #     student_profile = validated_data.pop("student_profile")
#     #     remaining_amount = validated_data.pop("remaining_amount")

#     #     amount = validated_data.get("amount")
#     #     user = student_profile.user
#     #     package = validated_data.get("package")

#     #     validated_data["user"] = user

#     #     # 🔥 Get previous latest payment
#     #     last_payment = Payment.objects.filter(
#     #         user=user,
#     #         package=package
#     #     ).order_by("-id").first()

#     #     # 🔥 Update previous payment amount
#     #     if last_payment:
#     #         last_payment.amount = last_payment.amount + amount
#     #         last_payment.save()

#     #     # Decide status
#     #     if amount == remaining_amount:
#     #         validated_data["status"] = "fully_paid"
#     #     else:
#     #         validated_data["status"] = "partial_paid"

#     #     payment = super().create(validated_data)

#     #     return payment

    
#     def update(self, instance, validated_data):

#         student_profile = validated_data.pop("student_profile", None)
#         validated_data.pop("remaining_amount", None)

#         # If student_profile sent, update user
#         if student_profile:
#             instance.user = student_profile.user

#         for attr, value in validated_data.items():
#             setattr(instance, attr, value)

#         instance.save()

#         # 🔥 Recalculate total
#         total_paid_after = (
#             Payment.objects.filter(
#                 user=instance.user,
#                 package=instance.package
#             ).aggregate(total=Sum("amount"))["total"] or 0
#         )

#         package_amount = instance.package.price

#         if total_paid_after >= package_amount:
#             Payment.objects.filter(
#                 user=instance.user,
#                 package=instance.package
#             ).update(status="fully_paid")
#         else:
#             Payment.objects.filter(
#                 user=instance.user,
#                 package=instance.package
#             ).update(status="partial_paid")

#         return instance

class PaymentCreateSerializer(serializers.ModelSerializer):
    student_profile = serializers.PrimaryKeyRelatedField(
        queryset=StudentProfile.objects.all(),
        required=False,
        allow_null=True,
        write_only=True
    )

    handholding_participant = serializers.PrimaryKeyRelatedField(
        queryset=HandHoldingParticipant.objects.all(),
        required=False,
        allow_null=True,
        write_only=True
    )

    transaction_id = serializers.CharField(
        required=False,
        allow_blank=False,
        allow_null=True
    )

    proof_file = serializers.FileField(
        required=False,
        allow_null=True
    )

    class Meta:
        model = Payment
        fields = [
            "student_profile",
            "handholding_participant",
            "package",
            "amount",
            "payment_type",
            "method",
            "transaction_id",
            "payment_date",
            "proof_file",
        ]

    def validate(self, attrs):

        student_profile = attrs.get("student_profile")
        handholding_participant = attrs.get("handholding_participant")
        payment_type = attrs.get("payment_type")
        transaction_id = attrs.get("transaction_id")
        # package = attrs.get("package")

        # if isinstance(package, list):
        #     package = package[0] if package else None
        package = attrs.get("package")

        if not package:
            raise serializers.ValidationError("Package is required.")
        amount = attrs.get("amount")

        
        # ✅ Only required during CREATE
        if not self.instance:
            if not student_profile and not handholding_participant:
                raise serializers.ValidationError(
                    "Either student_profile OR handholding_participant is required."
                )

            if student_profile and handholding_participant:
                raise serializers.ValidationError(
                    "Provide only one: student_profile OR handholding_participant."
                )

        # ❌ Optional: prevent both together
        if student_profile and handholding_participant:
            raise serializers.ValidationError(
                "Provide only one: student_profile OR handholding_participant."
            )

        # 🎯 Get user
        if student_profile:
            user = student_profile.user
        elif handholding_participant:
            user = handholding_participant.user
        else:
            user = self.instance.user if self.instance else None

        if not user:
            raise serializers.ValidationError("User mapping missing.")

        # ✅ Required fields
        if not package:
            raise serializers.ValidationError("Package is required.")

        if amount is None:
            raise serializers.ValidationError("Amount is required.")

        # =========================
        # 💰 PAYMENT CALCULATION
        # =========================
        # package_amount = package.price

        # payments_qs = Payment.objects.filter(
        #     user=user,
        #     package=package
        # ).exclude(status="not_paid")

        # if self.instance:
        #     payments_qs = payments_qs.exclude(id=self.instance.id)

        # total_paid = payments_qs.aggregate(
        #     total=Sum("amount")
        # )["total"] or 0

        # remaining_amount = package_amount - total_paid

        # # 🚨 Already fully paid
        # if remaining_amount <= 0:
        #     raise serializers.ValidationError(
        #         {"message": "You already paid the full package amount."}
        #     )

        # # 🚨 Overpayment check
        # if amount > remaining_amount:
        #     raise serializers.ValidationError(
        #         {"message": "You are paying more than the package amount."}
        #     )

        # # ✅ Save computed values
        # attrs["remaining_amount"] = remaining_amount
        # attrs["user"] = user   # 🔥 IMPORTANT FIX
        from decimal import Decimal

        packages = attrs.get("package")

        if not isinstance(packages, (list, tuple)):
            packages = [packages]

        package_amount = sum(
            (pkg.price or Decimal("0"))
            for pkg in packages
        )

        # =========================================
        # 🚨 NEW VALIDATION (YOUR REQUIREMENT)
        # =========================================
        if amount > package_amount:
            raise serializers.ValidationError({
                "amount": f"Payment amount cannot exceed package price ₹{package_amount}."
            })
        
        package_amount = sum(
            (pkg.price or Decimal("0"))
            for pkg in packages
        )

        payments_qs = Payment.objects.filter(
            user=user,
            package__in=packages
        ).distinct().exclude(status="not_paid")

        # exclude current instance (for update)
        if self.instance:
            payments_qs = payments_qs.exclude(id=self.instance.id)

        total_paid = payments_qs.aggregate(
            total=Sum("amount")
        )["total"] or 0

        # ✅ include current amount
        new_total = total_paid + amount

        # 🚨 Already fully paid
        if total_paid >= package_amount:
            raise serializers.ValidationError({
                "message": "Full payment already completed. No further payment allowed."
            })

        # 🚨 Overpayment check
        if new_total > package_amount:
            remaining = package_amount - total_paid

            raise serializers.ValidationError({
                "message": f"Payment exceeds package price. You can only pay ₹{remaining} more."
            })

        # ✅ Save remaining correctly
        attrs["remaining_amount"] = package_amount - new_total

        # ✅ IMPORTANT
        attrs["user"] = user
        
        # ========================================= 
        # ✅ ONLINE PAYMENT VALIDATION
        # =========================================
        if payment_type and payment_type.lower() == "online":

            # Transaction ID required
            if not transaction_id:
                raise serializers.ValidationError({
                    "transaction_id": "Transaction ID is required for online payments."
                })

            transaction_id = str(transaction_id).strip()

            # Common payment reference formats:
            # UPI Ref No: 12 digits
            # UTR No: 12-22 chars
            # Bank Txn ID: alphanumeric
            pattern = r"^[A-Za-z0-9@\-_]{6,30}$"

            if not re.match(pattern, transaction_id):
                raise serializers.ValidationError({
                    "transaction_id": (
                        "Invalid transaction ID format. "
                        "Only letters, numbers, @, '-' and '_' are allowed "
                        "(6 to 30 characters)."
                    )
                })

            # Duplicate transaction ID check
            qs = Payment.objects.filter(
                transaction_id__iexact=transaction_id
            )

            if self.instance:
                qs = qs.exclude(id=self.instance.id)

            if qs.exists():
                raise serializers.ValidationError({
                    "transaction_id": "Transaction ID already exists."
                })

        # =========================================
        # ✅ OFFLINE PAYMENT VALIDATION
        # =========================================
        else:
            attrs["transaction_id"] = None

        return attrs

    def create(self, validated_data):
        validated_data.pop("student_profile", None)
        validated_data.pop("handholding_participant", None)

        remaining_amount = validated_data.pop("remaining_amount")

        user = validated_data.get("user")
        amount = validated_data.get("amount")
        packages = validated_data.get("package")

        package_amount = sum(
            (pkg.price or 0)
            for pkg in packages
        )

        total_paid_after = (
            Payment.objects.filter(
                user=user,
                package__in=packages
            )
            .distinct()
            .aggregate(total=Sum("amount"))["total"] or 0
        ) + amount

        if total_paid_after >= package_amount:
            validated_data["status"] = "fully_paid"
        else:
            validated_data["status"] = "partial_paid"

        payment = super().create(validated_data)

        print("NEW PAYMENT ID =", payment.id)

        return payment
    
    def update(self, instance, validated_data):

        student_profile = validated_data.pop("student_profile", None)
        validated_data.pop("remaining_amount", None)

        packages = validated_data.pop("package", None)

        # Update user if student profile provided
        if student_profile:
            instance.user = student_profile.user

        # Update normal fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        # Update many-to-many packages
        if packages is not None:
            instance.package.set(packages)

        # =========================
        # Recalculate payment status
        # =========================

        package_amount = sum(
            (pkg.price or 0)
            for pkg in instance.package.all()
        )

        total_paid_after = (
            Payment.objects.filter(
                user=instance.user,
                package__in=instance.package.all()
            )
            .distinct()
            .aggregate(total=Sum("amount"))["total"] or 0
        )

        if total_paid_after >= package_amount:
            instance.status = "fully_paid"
        else:
            instance.status = "partial_paid"

        instance.save(update_fields=["status"])

        return instance

    def to_internal_value(self, data):
        data = data.copy()   # ✅ MAKE IT MUTABLE

        student_profile = data.get("student_profile")

        if student_profile in ["null", "", None]:
            data["student_profile"] = None

        return super().to_internal_value(data)


class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "email"]

class PackageMiniSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source="program.name", read_only=True)

    class Meta:
        model = Package
        fields = ["id", "name", "price", "program_name"]

# class PaymentResponseSerializer(serializers.ModelSerializer):
#     user = UserMiniSerializer(read_only=True)
#     package = PackageMiniSerializer(read_only=True)
#     remaining_amount = serializers.SerializerMethodField()
#     total_paid = serializers.SerializerMethodField()

#     class Meta:
#         model = Payment
#         fields = [
#             "id",
#             "user",
#             "package",
#             "amount",
#             "payment_type",
#             "method",
#             "status",
#             "transaction_id",
#             "payment_date",
#             "proof_file",
#             "total_paid",
#             "remaining_amount",
#             "created_at",
#         ]
#     def get_total_paid(self, obj):
#         total_paid = (
#             Payment.objects.filter(
#                 user=obj.user,
#                 package=obj.package
#             ).aggregate(total=Sum("amount"))["total"] or 0
#         )
#         return total_paid

#     def get_remaining_amount(self, obj):
#         total_paid = (
#             Payment.objects.filter(
#                 user=obj.user,
#                 package=obj.package
#             ).aggregate(total=Sum("amount"))["total"] or 0
#         )

#         package_amount = obj.package.price
#         remaining = package_amount - total_paid

#         return max(remaining, 0)

class PaymentResponseSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)
    package = PackageMiniSerializer(many=True, read_only=True)
    remaining_amount = serializers.SerializerMethodField()
    total_paid = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            "id",
            "user",
            "package",
            "amount",
            "payment_type",
            "method",
            "status",
            "transaction_id",
            "payment_date",
            "proof_file",
            "total_paid",
            "remaining_amount",
            "created_at",
        ]
    def get_total_paid(self, obj):

        package_ids = obj.package.values_list("id", flat=True)

        total_paid = (
            Payment.objects.filter(
                user=obj.user,
                package__id__in=package_ids
            )
            .distinct()
            .aggregate(total=Sum("amount"))["total"] or 0
        )

        return total_paid

    def get_remaining_amount(self, obj):

        package_ids = obj.package.values_list("id", flat=True)

        total_paid = (
            Payment.objects.filter(
                user=obj.user,
                package__id__in=package_ids
            )
            .distinct()
            .aggregate(total=Sum("amount"))["total"] or 0
        )

        package_amount = (
            Package.objects.filter(
                id__in=package_ids
            ).aggregate(
                total=Sum("price")
            )["total"] or 0
        )

        return max(package_amount - total_paid, 0)

class PaymentListSerializer(serializers.ModelSerializer):
    user_first_name = serializers.CharField(source='user.first_name', read_only=True)
    user_last_name = serializers.CharField(source='user.last_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    proof_file = serializers.SerializerMethodField()

    package_name = serializers.CharField(source='package.name', read_only=True)
    package_price = serializers.DecimalField(
        source='package.price',
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    program_name = serializers.CharField(source='package.program.name', read_only=True)

    verified_by_email = serializers.EmailField(source='verified_by.email', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id',
            'user',
            'user_first_name',
            'user_last_name',
            'user_email',
            'package',
            'package_name',
            'package_price',
            'program_name',
            'amount',
            'payment_type',
            'method',
            'status',
            'payment_date',
            'transaction_id',
            'proof_file',
            'verified_by',
            'verified_by_email',
            'created_at',
            'updated_at',
        ]
    def get_proof_file(self, obj):
        request = self.context.get('request')
        if obj.proof_file and request:
            return request.build_absolute_uri(obj.proof_file.url)
        return None
        
        
class PaymentLogSerializer(serializers.ModelSerializer):
    changed_by = serializers.SerializerMethodField()

    class Meta:
        model = PaymentLog
        fields = [
            "id",
            "old_status",
            "new_status",
            "changed_by",
            "changed_at",
            "created_at"
        ]

    def get_changed_by(self, obj):
        if obj.changed_by:
            return {
                "id": obj.changed_by.id,
                "name": f"{obj.changed_by.first_name} {obj.changed_by.last_name}",
                "email": obj.changed_by.email
            }
        return None
    
# ========================================= Student API =================================

class PackageDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Package
        fields = "__all__"
        
class StudentPaymentSerializer(serializers.ModelSerializer):
    package = PackageDetailSerializer()
    # verified_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            "id",
            "amount",
            "payment_type",
            "method",
            "status",
            "payment_date",
            "transaction_id",
            "proof_file",
            "created_at",
            "package",
            # "verified_by_name"
        ]

    # def get_verified_by_name(self, obj):
    #     if obj.verified_by:
    #         return f"{obj.verified_by.first_name} {obj.verified_by.last_name}"
    #     return None
    
class StudentPaymentDetailSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source="user.first_name")
    last_name = serializers.CharField(source="user.last_name")
    email = serializers.EmailField(source="user.email")
    phone = serializers.CharField(source="user.phone")

    payments = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "phone",
            "payments"
        ]

    def get_payments(self, obj):
        payments = Payment.objects.filter(user=obj.user).select_related("package", "verified_by")
        return StudentPaymentSerializer(payments, many=True).data
    
    
class PaymentCreateStudentSerializer(serializers.ModelSerializer):
    student_profile = serializers.PrimaryKeyRelatedField(
        queryset=StudentProfile.objects.all(),
        required=False,
        allow_null=True,
        write_only=True
    )

    handholding_participant = serializers.PrimaryKeyRelatedField(
        queryset=HandHoldingParticipant.objects.all(),
        required=False,
        allow_null=True,
        write_only=True
    )
    package = serializers.PrimaryKeyRelatedField(
        queryset=Package.objects.all(),
        many=True
    )

    transaction_id = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True
    )

    proof_file = serializers.FileField(
        required=False,
        allow_null=True
    )

    class Meta:
        model = Payment
        fields = [
            "student_profile",
            "handholding_participant",
            "package",
            "amount",
            "payment_type",
            "method",
            "transaction_id",
            "payment_date",
            "proof_file",
        ]

    def validate(self, attrs):

        student_profile = attrs.get("student_profile")
        handholding_participant = attrs.get("handholding_participant")
        packages = attrs.get("package")
        amount = attrs.get("amount")

        
        # ✅ Only required during CREATE
        if not self.instance:
            if not student_profile and not handholding_participant:
                raise serializers.ValidationError(
                    "Either student_profile OR handholding_participant is required."
                )

            if student_profile and handholding_participant:
                raise serializers.ValidationError(
                    "Provide only one: student_profile OR handholding_participant."
                )

        # ❌ Optional: prevent both together
        if student_profile and handholding_participant:
            raise serializers.ValidationError(
                "Provide only one: student_profile OR handholding_participant."
            )

        # 🎯 Get user
        if student_profile:
            user = student_profile.user
        elif handholding_participant:
            user = handholding_participant.user
        else:
            user = self.instance.user if self.instance else None

        if not user:
            raise serializers.ValidationError("User mapping missing.")

        # ✅ Required fields
        if not packages:
            raise serializers.ValidationError("Package is required.")

        if amount is None:
            raise serializers.ValidationError("Amount is required.")

        # =========================
        # 💰 PAYMENT CALCULATION
        # =========================
        # package_amount = package.price

        # payments_qs = Payment.objects.filter(
        #     user=user,
        #     package=package
        # ).exclude(status="not_paid")

        # if self.instance:
        #     payments_qs = payments_qs.exclude(id=self.instance.id)

        # total_paid = payments_qs.aggregate(
        #     total=Sum("amount")
        # )["total"] or 0

        # remaining_amount = package_amount - total_paid

        # # 🚨 Already fully paid
        # if remaining_amount <= 0:
        #     raise serializers.ValidationError(
        #         {"message": "You already paid the full package amount."}
        #     )

        # # 🚨 Overpayment check
        # if amount > remaining_amount:
        #     raise serializers.ValidationError(
        #         {"message": "You are paying more than the package amount."}
        #     )

        # # ✅ Save computed values
        # attrs["remaining_amount"] = remaining_amount
        # attrs["user"] = user   # 🔥 IMPORTANT FIX
        from decimal import Decimal

        package_amount = sum(
            (pkg.price or Decimal("0"))
            for pkg in packages
        )

        # =========================================
        # 🚨 NEW VALIDATION (YOUR REQUIREMENT)
        # =========================================
        if amount > package_amount:
            raise serializers.ValidationError({
                "amount": f"Payment amount cannot exceed package price ₹{package_amount}."
            })
        
        # package_amount = package.price

        payments_qs = Payment.objects.filter(
            user=user
            # package=package
        ).exclude(status="not_paid")

        # exclude current instance (for update)
        if self.instance:
            payments_qs = payments_qs.exclude(id=self.instance.id)

        total_paid = payments_qs.aggregate(
            total=Sum("amount")
        )["total"] or 0

        # ✅ include current amount
        new_total = total_paid + amount

        # 🚨 Already fully paid
        if total_paid >= package_amount:
            raise serializers.ValidationError({
                "message": "Full payment already completed. No further payment allowed."
            })

        # 🚨 Overpayment check
        if new_total > package_amount:
            remaining = package_amount - total_paid

            raise serializers.ValidationError({
                "message": f"Payment exceeds package price. You can only pay ₹{remaining} more."
            })

        # ✅ Save remaining correctly
        attrs["remaining_amount"] = package_amount - new_total

        # ✅ IMPORTANT
        attrs["user"] = user
        
        # =========================================
        # ✅ ONLINE PAYMENT TRANSACTION VALIDATION
        # =========================================

        payment_type = attrs.get("payment_type")
        transaction_id = attrs.get("transaction_id")

        if payment_type and str(payment_type).lower() == "online":

            # Transaction ID required
            if not transaction_id:
                raise serializers.ValidationError({
                    "transaction_id": "Transaction ID is required for online payments."
                })

            transaction_id = transaction_id.strip()

            # Common UPI / UTR / Bank Transaction formats
            pattern = r"^[A-Za-z0-9@\-_]{6,30}$"

            if not re.match(pattern, transaction_id):
                raise serializers.ValidationError({
                    "transaction_id": (
                        "Invalid transaction ID format. "
                        "Only letters, numbers, @, '-' and '_' are allowed "
                        "(6-30 characters)."
                    )
                })

            # Duplicate transaction id check
            qs = Payment.objects.filter(
                transaction_id__iexact=transaction_id
            )

            # exclude current record while update
            if self.instance:
                qs = qs.exclude(id=self.instance.id)

            if qs.exists():
                raise serializers.ValidationError({
                    "transaction_id": "Transaction ID already exists."
                })

        # =========================================
        # ✅ OFFLINE PAYMENT
        # =========================================
        else:
            attrs["transaction_id"] = None

        return attrs

    def create(self, validated_data):
        validated_data.pop("student_profile", None)
        validated_data.pop("handholding_participant", None)

        remaining_amount = validated_data.pop("remaining_amount")

        user = validated_data.get("user")
        amount = validated_data.get("amount")
        package = validated_data.get("package")

        # 🔥 Status logic
        # if amount == remaining_amount:
        #     validated_data["status"] = "fully_paid"
        # else:
        #     validated_data["status"] = "partial_paid"
        if remaining_amount <= 0:
            validated_data["status"] = "fully_paid"
        else:
            validated_data["status"] = "partial_paid"
        
        packages = validated_data.pop("package")

        payment = super().create(validated_data)
        payment.package.set(packages)

        # 🔁 Update all payments if fully paid
        total_paid_after = (
            Payment.objects.filter(
                user=user
                # package=package
            ).aggregate(total=Sum("amount"))["total"] or 0
        )

        # if total_paid_after >= package.price:
        #     Payment.objects.filter(
        #         user=user,
        #         package=package
        #     ).update(status="fully_paid")
        payment.status = "verification_pending"
        payment.save(update_fields=["status"])

        return payment
        
    def update(self, instance, validated_data):

        student_profile = validated_data.pop("student_profile", None)
        validated_data.pop("remaining_amount", None)

        # =========================
        # 🎓 Update user
        # =========================
        if student_profile:
            instance.user = student_profile.user
        
        packages = validated_data.pop("package", None)

        # =========================
        # 🔄 Update fields
        # =========================
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # =========================
        # 📌 Keep verification pending
        # =========================
        instance.status = "verification_pending"

        # =========================
        # 💾 Save same record
        # =========================
        instance.save()
        
        if packages is not None:
            instance.package.set(packages)      

        # ✅ No new payment created
        return instance

    def to_internal_value(self, data):
        data = data.copy()   # ✅ MAKE IT MUTABLE

        student_profile = data.get("student_profile")

        if student_profile in ["null", "", None]:
            data["student_profile"] = None

        return super().to_internal_value(data)


