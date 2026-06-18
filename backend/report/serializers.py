from rest_framework import serializers

class CompletedExamReportSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    user_id = serializers.IntegerField()
    student_id = serializers.IntegerField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    phone = serializers.CharField()

    program_id = serializers.IntegerField(allow_null=True)
    program = serializers.CharField()
    package_id = serializers.IntegerField(allow_null=True)
    package = serializers.CharField()
    exam_status = serializers.CharField()
    booking_status = serializers.CharField(allow_null=True)
    
    report_status = serializers.CharField(allow_null=True)
    file_path = serializers.CharField(allow_null=True)
    file_name = serializers.CharField(allow_null=True)
    file_path_count = serializers.IntegerField(allow_null=True)
    
    report_status_v2 = serializers.CharField(allow_null=True)
    file_path1 = serializers.CharField(allow_null=True)
    file_name1 = serializers.CharField(allow_null=True)
    file_path1_count = serializers.IntegerField(allow_null=True)
    
    report_status_v3 = serializers.CharField(allow_null=True)
    file_path2 = serializers.CharField(allow_null=True)
    file_name2 = serializers.CharField(allow_null=True)
    file_path2_count = serializers.IntegerField(allow_null=True)
    
    
    
    uploaded_at = serializers.DateTimeField(allow_null=True)
    payment_status = serializers.CharField(allow_null=True)
    
    
class EngineeringTestAnalysisReportSerializer(serializers.Serializer):

    id = serializers.IntegerField(read_only=True)
    user_id = serializers.IntegerField()
    student_id = serializers.IntegerField()

    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    phone = serializers.CharField()

    program_id = serializers.IntegerField(allow_null=True)
    program = serializers.CharField()

    package_id = serializers.IntegerField(allow_null=True)
    package = serializers.CharField()

    analysis_status = serializers.CharField(allow_null=True)

    report_status = serializers.CharField(allow_null=True)
    file_path = serializers.CharField(allow_null=True)
    file_name = serializers.CharField(allow_null=True)
    file_path_count = serializers.IntegerField(allow_null=True)
    
    report_status_v2 = serializers.CharField(allow_null=True)
    file_path1 = serializers.CharField(allow_null=True)
    file_name1 = serializers.CharField(allow_null=True)
    file_path1_count = serializers.IntegerField(allow_null=True)
    
    report_status_v3 = serializers.CharField(allow_null=True)
    file_path2 = serializers.CharField(allow_null=True)
    file_name2 = serializers.CharField(allow_null=True)
    file_path2_count = serializers.IntegerField(allow_null=True)
    
    booking_status = serializers.CharField(allow_null=True)
    
    
    
    uploaded_at = serializers.DateTimeField(allow_null=True)

    payment_status = serializers.CharField(allow_null=True)