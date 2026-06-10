from rest_framework import serializers
from django.db.models import Sum

from counselling_slot.models import Booking
from program_package.models import UserProgramPackage
from payment.models import Payment
from event.models import Advertisement, Certificate, CertificateTemplate, HandHoldingParticipant, HandHoldingParticipantSession, HandHoldingSession

class HandHoldingSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = HandHoldingSession
        fields = ["id", "title", "description", "ordering", "created_at"]
        read_only_fields = ["id", "created_at"]

class HandHoldingParticipantSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    
    # preferred_mode = serializers.CharField(source="mode", read_only=True)
    photo = serializers.SerializerMethodField()
    resume_file = serializers.SerializerMethodField()
    proof_file = serializers.SerializerMethodField()
    show_profile = serializers.BooleanField(read_only=True)
    payment_status = serializers.SerializerMethodField()
    
    program_id = serializers.SerializerMethodField()
    program_name = serializers.SerializerMethodField()
    package_id = serializers.SerializerMethodField()
    package_name = serializers.SerializerMethodField()
    
    package_price = serializers.SerializerMethodField()
    total_paid_amount = serializers.SerializerMethodField()
    remaining_amount = serializers.SerializerMethodField()
        
    booked_sessions = serializers.IntegerField(source="booked_sessions_count", read_only=True)
    pending_sessions = serializers.IntegerField(source="pending_sessions_count", read_only=True)
    cancelled_sessions = serializers.IntegerField(source="cancelled_sessions_count", read_only=True)
    in_progress_sessions = serializers.IntegerField(source="in_progress_sessions_count", read_only=True)
    next_session_no = serializers.IntegerField(read_only=True)
    next_session_status = serializers.CharField(read_only=True)
    progress = serializers.SerializerMethodField()
    session_status = serializers.SerializerMethodField() 
    certificate_status = serializers.SerializerMethodField()

    class Meta:
        model = HandHoldingParticipant
        fields = "__all__"
        
    def get_certificate_status(self, obj):
        cert = Certificate.objects.filter(
            user=obj.user,
            program_type="handholding"
        ).order_by("-issued_at").first()

        if not cert:
            return "pending"

        return cert.certificate_status
        
    def get_user_program_package(self, obj):
        return UserProgramPackage.objects.filter(
            user=obj.user
        ).select_related("program", "package").order_by("-created_at").first()


    def get_program_id(self, obj):
        upp = self.get_user_program_package(obj)
        return upp.program.id if upp and upp.program else None


    def get_program_name(self, obj):
        upp = self.get_user_program_package(obj)
        return upp.program.name if upp and upp.program else None


    def get_package_id(self, obj):
        upp = self.get_user_program_package(obj)
        return upp.package.id if upp and upp.package else None


    def get_package_name(self, obj):
        upp = self.get_user_program_package(obj)
        return upp.package.name if upp and upp.package else None
    
    def get_package_price(self, obj):
        upp = self.get_user_program_package(obj)
        if upp and upp.package and upp.package.price:
            return float(upp.package.price)
        return 0
    
    def get_total_paid_amount(self, obj):
        total = Payment.objects.filter(
            user=obj.user,
            status__in=["partial_paid", "fully_paid", "verification_pending"]
        ).aggregate(total=Sum("amount"))["total"]

        return float(total) if total else 0
        
    def get_remaining_amount(self, obj):
        package_price = self.get_package_price(obj)
        total_paid = self.get_total_paid_amount(obj)

        remaining = package_price - total_paid
        return float(remaining) if remaining > 0 else 0
    
    def get_session_status(self, obj):
        total = getattr(obj, "total_sessions_count", 0) or 0
        completed = getattr(obj, "completed_sessions_count", 0) or 0

        if total > 0 and completed == total:
            return "completed"
        return "in_progress"
        
    def get_photo(self, obj):
        request = self.context.get("request")
        if obj.photo and request:
            return request.build_absolute_uri(obj.photo.url)
        return None

    # ✅ FULL URL for resume
    def get_resume_file(self, obj):
        request = self.context.get("request")
        if obj.resume_file and request:
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
        
    def get_progress(self, obj):
        total = getattr(obj, "total_sessions_count", 0) or 0
        completed = getattr(obj, "completed_sessions_count", 0) or 0

        if total == 0:
            return {
                "percentage": 0,
                "label": "0/0"
            }

        percentage = (completed / total) * 100

        return {
            "percentage": round(percentage, 2),
            "label": f"{completed}/{total}"
        }
    
    def get_payment_status(self, obj):

        # 🔹 Get all payments for this user
        payments = Payment.objects.filter(user=obj.user)

        if not payments.exists():
            return "not_paid"

        # 🔹 Total paid
        total_paid = payments.filter(
            status__in=["partial_paid", "fully_paid", "verification_pending"]
        ).aggregate(total=Sum("amount"))["total"] or 0

        # 🔹 Get package price (latest payment)
        latest_payment = payments.order_by("-created_at").first()

        package_price = 0

        if latest_payment:  
            package_price = sum(
                pkg.price or 0
                for pkg in latest_payment.package.all()
            )

        # 🔹 Determine status
        if total_paid == 0:
            return "not_paid"
        elif total_paid < package_price:
            return "partial_paid"
        else:
            return "fully_paid"
        
class HandHoldingParticipantSessionSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source="handholding_participant.user.first_name", read_only=True)
    last_name = serializers.CharField(source="handholding_participant.user.last_name", read_only=True)
    email = serializers.CharField(source="handholding_participant.email")
    
    preferred_counselling_mode = serializers.CharField(
        source="handholding_participant.preferred_counselling_mode",
        read_only=True
    )
    participant_id = serializers.IntegerField(
        source="handholding_participant.id",
        read_only=True
    )
    start_time = serializers.SerializerMethodField()
    # end_time = serializers.SerializerMethodField()
    
    student_id = serializers.SerializerMethodField()

    class Meta:
        model = HandHoldingParticipantSession
        fields = [
            "id",
            "participant_id",
            "first_name",
            "last_name",
            "email",
            "preferred_counselling_mode",
            "start_time",
            # "end_time",
            "session_no",
            "session_date",
            "status", 
            "student_id",          
        ]
        
    def get_start_time(self, obj):
        return obj.slot.start_time if obj.slot else None

    # def get_end_time(self, obj):
    #     return obj.slot.end_time if obj.slot else None
    
    def get_student_id(self, obj):  
        if not obj.slot:
            return None

        booking = Booking.objects.filter(
            slot=obj.slot
        ).exclude(status="cancelled").select_related("student").first()

        return booking.student.id if booking and booking.student else None
            
# ====================== Advertisement Serializer ======================

class AdvertisementSerializer(serializers.ModelSerializer):

    class Meta:
        model = Advertisement
        fields = "__all__"
        read_only_fields = ["created_by", "created_at", "updated_at"]

    # def validate(self, data):
    #     start = data.get("ad_start_date")
    #     end = data.get("ad_end_date")

    #     if start and end and end < start:
    #         raise serializers.ValidationError("End date cannot be before start date")

    #     return data
    
    
# ============================ Certificate Template Serializer ============================

class CertificateTemplateSerializer(serializers.ModelSerializer):

    class Meta:
        model = CertificateTemplate
        fields = "__all__"

    def to_representation(self, instance):
        data = super().to_representation(instance)

        request = self.context.get("request")

        if instance.template_file and request:
            data["template_file"] = request.build_absolute_uri(instance.template_file.url)

        return data
    
class CertificateSerializer(serializers.ModelSerializer):
    certificate_file = serializers.SerializerMethodField()

    class Meta:
        model = Certificate
        fields = [
            "id",
            "program_type",
            "certificate_status",
            "certificate_file",
            "issued_at"
        ]

    def get_certificate_file(self, obj):
        request = self.context.get("request")
        if obj.certificate_file and request:
            return request.build_absolute_uri(obj.certificate_file.url)
        return None