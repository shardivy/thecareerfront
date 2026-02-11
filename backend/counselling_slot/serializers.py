from rest_framework import serializers

from accounts.models import User
from django.contrib.auth import get_user_model

from counselling_slot.models import Booking, Counsellor, Slot
from datetime import date, datetime, timedelta



User = get_user_model()

class LeadCounsellorUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'role', 'is_active']


class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "phone"
        ]
        
class CounsellorResponseSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer()

    class Meta:
        model = Counsellor
        fields = [
            "id",
            "user",
            "specialization",
            "is_active"
        ]

class AddCounsellorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'specialization', 'is_active']

    def validate(self, attrs):
        user = self.instance or self.context['user']
        if user.role == 'counsellor':
            raise serializers.ValidationError(
                "User is already a counsellor"
            )
        return attrs

    def update(self, instance, validated_data):
        instance.role = 'counsellor'
        instance.specialization = validated_data.get(
            'specialization', instance.specialization
        )
        instance.is_active = validated_data.get(
            'is_active', instance.is_active
        )
        instance.save()
        return instance

    
# ================== slot create serializers ======================

# class SlotCreateSerializer(serializers.ModelSerializer):
#     lead_counsellor = serializers.PrimaryKeyRelatedField(
#         queryset=User.objects.all()
#     )
#     normal_counsellor = serializers.PrimaryKeyRelatedField(
#         queryset=User.objects.all(),
#         required=False,
#         allow_null=True
#     )

#     class Meta:
#         model = Slot
#         fields = [
#             'id',
#             'lead_counsellor',
#             'normal_counsellor',
#             'date',
#             'start_time',
#             'end_time',
#             'mode',
#             'duration_minutes',
#             'is_available',
#         ]

#     def validate(self, attrs):
#         lead = attrs.get('lead_counsellor')
#         normal = attrs.get('normal_counsellor')

#         if lead.role.name != 'lead_counsellor':
#             raise serializers.ValidationError(
#                 {"lead_counsellor": "Selected user is not a lead counsellor"}
#             )

#         if normal and normal.role.name != 'counsellor':
#             raise serializers.ValidationError({
#                 "normal_counsellor": "Selected user is not a counsellor"
#             })

#         return attrs


class SlotCreateSerializer(serializers.ModelSerializer):
    lead_counsellor = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all()
    )
    normal_counsellor = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Slot
        fields = [
            'id',
            'lead_counsellor',
            'normal_counsellor',
            'date',
            'start_time',
            'end_time',
            'mode',
            'duration_minutes',
            'is_available',
        ]
        read_only_fields = ('end_time',)

    def _parse_time(self, value):
        """Accept HH:MM and HH:MM AM/PM"""
        for fmt in ("%H:%M", "%I:%M %p"):
            try:
                return datetime.strptime(value, fmt).time()
            except ValueError:
                continue
        raise serializers.ValidationError({
            "start_time": "Invalid time format. Use HH:MM or HH:MM AM/PM."
        })

    def validate(self, attrs):
        lead = attrs.get('lead_counsellor')
        normal = attrs.get('normal_counsellor')
        start_time = attrs.get('start_time')
        duration = attrs.get('duration_minutes')

        if lead.role.name != 'lead_counsellor':
            raise serializers.ValidationError({
                "lead_counsellor": "Selected user is not a lead counsellor"
            })

        if normal and normal.role.name != 'counsellor':
            raise serializers.ValidationError({
                "normal_counsellor": "Selected user is not a counsellor"
            })

        if start_time and duration:
            if isinstance(start_time, str):
                start_time_obj = self._parse_time(start_time)
            else:
                start_time_obj = start_time

            end_time = (
                datetime.combine(date.today(), start_time_obj)
                + timedelta(minutes=duration)
            ).time()

            # store as string since model uses CharField
            attrs['start_time'] = start_time_obj.strftime("%I:%M %p")
            attrs['end_time'] = end_time.strftime("%I:%M %p")

        return attrs



    
class SlotResponseSerializer(serializers.ModelSerializer):
    lead_counsellor = UserBasicSerializer()
    normal_counsellor = UserBasicSerializer()

    class Meta:
        model = Slot
        fields = [
            'id',
            'lead_counsellor',
            'normal_counsellor',
            'date',
            'start_time',
            'end_time',
            'mode',
            'duration_minutes',
            'is_available',
        ]

class SlotUpdateSerializer(serializers.ModelSerializer):
    lead_counsellor = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False
    )
    normal_counsellor = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Slot
        fields = [
            'lead_counsellor',
            'normal_counsellor',
            'date',
            'start_time',
            'end_time',      # auto-generated
            'mode',
            'duration_minutes',
            'is_available',
        ]
        read_only_fields = ('end_time',)

    def _parse_time(self, value):
        """
        Accepts:
        - 14:00
        - 02:00 PM
        """
        if not isinstance(value, str):
            return value

        for fmt in ("%H:%M", "%I:%M %p"):
            try:
                return datetime.strptime(value, fmt).time()
            except ValueError:
                pass

        raise serializers.ValidationError({
            "start_time": "Invalid time format. Use HH:MM or HH:MM AM/PM."
        })

    def validate(self, attrs):
        instance = self.instance

        # FINAL values (incoming OR existing)
        start_time = attrs.get('start_time', instance.start_time)
        duration = attrs.get('duration_minutes', instance.duration_minutes)

        lead = attrs.get('lead_counsellor')
        normal = attrs.get('normal_counsellor')

        # counsellor validation
        if lead is not None and lead.role.name != 'lead_counsellor':
            raise serializers.ValidationError({
                "lead_counsellor": "Selected user is not a lead counsellor"
            })

        if normal is not None and normal.role.name != 'counsellor':
            raise serializers.ValidationError({
                "normal_counsellor": "Selected user is not a counsellor"
            })

        # auto-calculate end_time
        if start_time and duration:
            start_time_obj = self._parse_time(start_time)

            end_time_obj = (
                datetime.combine(date.today(), start_time_obj)
                + timedelta(minutes=duration)
            ).time()

            # store as string (model uses CharField)
            attrs['start_time'] = start_time_obj.strftime("%I:%M %p")
            attrs['end_time'] = end_time_obj.strftime("%I:%M %p")

        return attrs

    def update(self, instance, validated_data):
        """
        FORCE UPDATE — never create new row
        """
        for field, value in validated_data.items():
            setattr(instance, field, value)

        instance.save(update_fields=validated_data.keys())
        return instance



# =================== Add counselling booking slot =========================
class StudentMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "first_name", "last_name", "email")

class CounsellorMiniSerializer(serializers.ModelSerializer):
    user = StudentMiniSerializer(read_only=True)

    class Meta:
        model = Counsellor
        fields = ("id", "user", "specialization")

class SlotMiniSerializer(serializers.ModelSerializer):
    counsellor = CounsellorMiniSerializer(read_only=True)

    class Meta:
        model = Slot
        fields = ("id", "date", "start_time", "end_time", "mode", "counsellor")


class BookingCreateSerializer(serializers.ModelSerializer):
    # READ (nested objects with proper details)
    student = StudentMiniSerializer(read_only=True)
    slot = SlotMiniSerializer(read_only=True)
    lead_counsellor = StudentMiniSerializer(read_only=True)
    normal_counsellor = StudentMiniSerializer(read_only=True)

    # WRITE (accept User IDs directly)
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source="student",
        write_only=True
    )
    slot_id = serializers.PrimaryKeyRelatedField(
        queryset=Slot.objects.all(),
        source="slot",
        write_only=True
    )
    lead_counsellor_id = serializers.IntegerField(write_only=True)
    normal_counsellor_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "student",
            "student_id",
            "slot",
            "slot_id",
            "lead_counsellor",
            "lead_counsellor_id",
            "normal_counsellor",
            "normal_counsellor_id",
            "mode",
            "date",
            "meeting_link",
            "status",
            "created_at",
        ]
        read_only_fields = ("id", "status", "created_at")

    def validate(self, attrs):
        # Validate lead_counsellor
        lead_user_id = attrs.pop("lead_counsellor_id", None)
        try:
            lead_user = User.objects.get(id=lead_user_id)
        except User.DoesNotExist:
            raise serializers.ValidationError({"lead_counsellor_id": "Lead counsellor does not exist."})

        if lead_user.role.name != "lead_counsellor":
            raise serializers.ValidationError({"lead_counsellor_id": "User is not a lead counsellor."})

        attrs["lead_counsellor"] = lead_user

        # Validate normal_counsellor if provided
        normal_user_id = attrs.pop("normal_counsellor_id", None)
        if normal_user_id:
            try:
                normal_user = User.objects.get(id=normal_user_id)
            except User.DoesNotExist:
                raise serializers.ValidationError({"normal_counsellor_id": "Normal counsellor does not exist."})

            if normal_user.role.name != "counsellor":
                raise serializers.ValidationError({"normal_counsellor_id": "User is not a counsellor."})

            attrs["normal_counsellor"] = normal_user
        else:
            attrs["normal_counsellor"] = None

        # Prevent duplicate slot bookings for same date
        slot = attrs.get("slot", self.instance.slot if self.instance else None)
        date = attrs.get("date", self.instance.date if self.instance else None)
        qs = Booking.objects.filter(slot=slot, date=date)
        if self.instance:
            qs = qs.exclude(id=self.instance.id)
        if qs.exists():
            raise serializers.ValidationError({"slot": "This slot is already booked for the selected date."})

        return attrs

    def create(self, validated_data):
        validated_data["status"] = "scheduled"
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # allow partial update via PUT
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
