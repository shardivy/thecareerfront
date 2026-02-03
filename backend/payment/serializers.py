from rest_framework import serializers

from accounts.models import User
from lead_registration.models import StudentProfile
from payment.models import Payment

from rest_framework import serializers

from program_package.models import Package
from .models import Payment, PaymentLog

# class PaymentCreateSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Payment
#         fields = [
#             "user",          # ✅ accept from form-data
#             "package",
#             "amount",
#             "payment_type",
#             "method",
#             "transaction_id",
#             "payment_date",
#             "proof_file",
#         ]

#     def validate(self, data):
#         if data["method"] == "online" and not data.get("transaction_id"):
#             raise serializers.ValidationError(
#                 {"transaction_id": "Transaction ID is required for online payments"}
#             )
#         return data


class PaymentCreateSerializer(serializers.ModelSerializer):
    student_profile = serializers.PrimaryKeyRelatedField(
        queryset=StudentProfile.objects.all(),
        write_only=True
    )

    transaction_id = serializers.CharField(
        required=False,
        allow_blank=False,
        allow_null=True
    )

    class Meta:
        model = Payment
        fields = [
            "student_profile",
            "package",
            "amount",
            "payment_type",
            "method",
            "transaction_id",
            "payment_date",
            "proof_file",
        ]

    def validate(self, data):
        method = data.get("method")
        transaction_id = data.get("transaction_id")

        if method == "upi" and not transaction_id:
            raise serializers.ValidationError({
                "transaction_id": "Transaction ID is required for UPI payments."
            })

        if method != "upi":
            data["transaction_id"] = None

        return data

    def create(self, validated_data):
        student_profile = validated_data.pop("student_profile")
        validated_data["user"] = student_profile.user
        return super().create(validated_data)



class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "email"]

class PackageMiniSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source="program.name", read_only=True)

    class Meta:
        model = Package
        fields = ["id", "name", "price", "program_name"]


class PaymentResponseSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)
    package = PackageMiniSerializer(read_only=True)

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
            "created_at",
        ]


class PaymentListSerializer(serializers.ModelSerializer):
    user_first_name = serializers.CharField(source='user.first_name', read_only=True)
    user_last_name = serializers.CharField(source='user.last_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

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