from rest_framework import serializers

class CompletedExamReportSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    user_id = serializers.IntegerField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    phone = serializers.CharField()

    program_id = serializers.IntegerField(allow_null=True)
    program = serializers.CharField()
    exam_status = serializers.CharField()
    report_status = serializers.CharField(allow_null=True)
    file_path = serializers.CharField(allow_null=True)
    uploaded_at = serializers.DateTimeField(allow_null=True)
    payment_status = serializers.CharField(allow_null=True)