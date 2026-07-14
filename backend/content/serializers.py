# serializers.py

import os

from django.urls import reverse
from rest_framework import serializers

from lead_registration.models import Stream
from program_package.models import Package, Program
from .models import Content, ContentPackage

class ProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = ["id", "name"]


class ContentUploadSerializer(serializers.ModelSerializer):
    # file_url = serializers.SerializerMethodField()

    # ✅ Accept program IDs while creating/updating
    program = serializers.PrimaryKeyRelatedField(
        queryset=Program.objects.all(),
        many=True,
        write_only=True
    )

    # ✅ Return full program objects in GET
    program_details = serializers.SerializerMethodField()
    
    package = serializers.PrimaryKeyRelatedField(
        queryset=Package.objects.all(),
        many=True,
        write_only=True,
        required=False
    )

    stream = serializers.PrimaryKeyRelatedField(
        queryset=Stream.objects.all(),
        many=True,
        write_only=True,
        required=False
    )
    content_mapping = serializers.JSONField(
        write_only=True,
        required=False
    )

    package_details = serializers.SerializerMethodField()
    stream_details = serializers.SerializerMethodField()
    

    class Meta:
        model = Content
        fields = [
            "id",
            "title",
            "type",
            "category",
            "description",

            "program",
            "program_details",

            "package",
            "package_details",

            "stream",
            "stream_details",
            
            "content_mapping",

            "file_url",
            "video_link",
            "image",

            "download_count",

            "is_student_visible",
            "is_active",

            "free_content",
            "payment_required",

            "is_draft",
        ]
    # ✅ Override representation to show preview URL instead of file path
    def to_representation(self, instance):
        representation = super().to_representation(instance)

        request = self.context.get("request")

        if instance.file_url and request:
            # ✅ Public file preview/download route
            representation["file_url"] = request.build_absolute_uri(
                f"/api/content/content-file/{instance.id}/"
            )
            
            # ✅ Show proper uploaded file name
            representation["file_name"] = os.path.basename(instance.file_url.name)


        return representation
    
    def get_stream_objects(self, program_id, stream_values):
        stream_objects = []

        for value in stream_values:

            # Existing stream ID
            if isinstance(value, int):
                stream = Stream.objects.filter(
                    id=value,
                    programs__id=program_id,
                    is_active=True
                ).first()

                if stream:
                    stream_objects.append(stream)

            # New stream name
            elif isinstance(value, str):

                stream, created = Stream.objects.get_or_create(
                    name=value.strip(),
                    defaults={"is_active": True}
                )

                # attach program if not already attached
                stream.programs.add(program_id)

                stream_objects.append(stream)

        return stream_objects
        
    def create(self, validated_data):

        mapping_data = validated_data.pop("content_mapping", [])

        validated_data.pop("program", None)
        validated_data.pop("package", None)
        validated_data.pop("stream", None)

        content = Content.objects.create(**validated_data)

        for item in mapping_data:

            program_id = item.get("program")

            package_ids = item.get("package", [])

            stream_values = item.get("stream", [])

            streams = self.get_stream_objects(
                program_id,
                stream_values
            )

            valid_packages = list(
                Package.objects.filter(
                    id__in=package_ids,
                    program_id=program_id,
                    is_active=True
                )
            )

            # ---------------------------------
            # Program Only
            # ---------------------------------
            if not package_ids and not streams:

                ContentPackage.objects.create(
                    content=content,
                    program_id=program_id
                )

            # ---------------------------------
            # Program + Stream
            # ---------------------------------
            elif not package_ids and streams:

                for stream in streams:

                    ContentPackage.objects.create(
                        content=content,
                        program_id=program_id,
                        stream=stream
                    )

            # ---------------------------------
            # Program + Package
            # ---------------------------------
            elif valid_packages and not streams:

                for package in valid_packages:

                    ContentPackage.objects.create(
                        content=content,
                        program_id=program_id,
                        package=package
                    )

            # ---------------------------------
            # Program + Package + Stream
            # ---------------------------------
            else:

                for package in valid_packages:

                    for stream in streams:

                        ContentPackage.objects.create(
                            content=content,
                            program_id=program_id,
                            package=package,
                            stream=stream
                        )

        return content

    def update(self, instance, validated_data):

        mapping_data = validated_data.pop("content_mapping", None)

        validated_data.pop("program", None)
        validated_data.pop("package", None)
        validated_data.pop("stream", None)
        
        # If changing to video, remove previous uploaded file
        if (
            validated_data.get("type") == "video"
            and instance.file_url
        ):
            instance.file_url.delete(save=False)
            instance.file_url = None

        instance = super().update(instance, validated_data)

        if mapping_data is not None:

            ContentPackage.objects.filter(
                content=instance
            ).delete()

            for item in mapping_data:

                program_id = item.get("program")

                package_ids = item.get("package", [])

                stream_values = item.get("stream", [])

                streams = self.get_stream_objects(
                    program_id,
                    stream_values
                )

                valid_packages = list(
                    Package.objects.filter(
                        id__in=package_ids,
                        program_id=program_id,
                        is_active=True
                    )
                )

                # Program Only
                if not package_ids and not streams:

                    ContentPackage.objects.create(
                        content=instance,
                        program_id=program_id
                    )

                # Program + Stream
                elif not package_ids and streams:

                    for stream in streams:

                        ContentPackage.objects.create(
                            content=instance,
                            program_id=program_id,
                            stream=stream
                        )

                # Program + Package
                elif valid_packages and not streams:

                    for package in valid_packages:

                        ContentPackage.objects.create(
                            content=instance,
                            program_id=program_id,
                            package=package
                        )

                # Program + Package + Stream
                else:

                    for package in valid_packages:

                        for stream in streams:

                            ContentPackage.objects.create(
                                content=instance,
                                program_id=program_id,
                                package=package,
                                stream=stream
                            )

        return instance
    
    def get_program_names(self, obj):
        return [program.name for program in obj.programs.all()]
    
    # def get_package(self, obj):
    #     packages = Package.objects.filter(program__in=obj.program.all()).distinct()
    #     return [pkg.id for pkg in packages]
    
    def get_program_details(self, obj):
        content_packages = (
            ContentPackage.objects.filter(content=obj)
            .select_related("program")
        )

        seen = set()
        data = []

        for cp in content_packages:
            if cp.program and cp.program.id not in seen:
                seen.add(cp.program.id)
                data.append({
                    "id": cp.program.id,
                    "name": cp.program.name
                })

        return data


    def get_package_details(self, obj):
        content_packages = (
            ContentPackage.objects.filter(content=obj)
            .select_related("package")
        )

        seen = set()
        data = []

        for cp in content_packages:
            if cp.package and cp.package.id not in seen:
                seen.add(cp.package.id)
                data.append({
                    "id": cp.package.id,
                    "name": cp.package.name,
                    "description": cp.package.description
                })

        return data
        
    def get_stream_details(self, obj):
        content_packages = (
            ContentPackage.objects.filter(content=obj)
            .select_related("stream")
        )

        seen = set()
        data = []

        for cp in content_packages:
            if cp.stream and cp.stream.id not in seen:
                seen.add(cp.stream.id)
                data.append({
                    "id": cp.stream.id,
                    "name": cp.stream.name
                })

        return data
        
    def validate(self, data):
        content_type = data.get("type")
        uploaded_file = data.get("file_url")
        existing_file = getattr(self.instance, "file_url", None) if self.instance else None
        video_link = data.get("video_link")
        description = data.get("description")

        # Allowed types
        allowed_types = [
            "pdf",
            "excel",
            "xlsx",
            "csv",
            "txt",
            "xls",
            "doc",
            "ppt",
            "zip",
            "image",
            "video",
            "article"
        ]

        # Validate content type
        if content_type not in allowed_types:
            raise serializers.ValidationError({
                "type": f"Invalid type. Allowed types are: {', '.join(allowed_types)}"
            })

        # Prevent both free and paid
        if data.get("free_content") and data.get("payment_required"):
            raise serializers.ValidationError(
                "Content cannot be both free and payment required."
            )

        # VIDEO TYPE
        if content_type == "video":

            if not video_link:
                raise serializers.ValidationError({
                    "video_link": "Video link is required when type is video."
                })

            # Only block if user uploads a NEW file while selecting video
            if uploaded_file:
                raise serializers.ValidationError({
                    "file_url": "File upload not allowed for Video type."
                })

        # ARTICLE TYPE
        elif content_type == "article":
            if not description:
                raise serializers.ValidationError({
                    "description": "Description required for article type."
                })

        # ALL OTHER FILE TYPES
        else:

            if not uploaded_file and not existing_file:
                raise serializers.ValidationError({
                    "file_url": "File upload is required."
                })

        return data
    
class ContentListSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    file_name = serializers.SerializerMethodField()

    class Meta:
        model = Content
        fields = [
            "id",
            "title",
            "type",
            "category",
            "description",
            "image",
            "video_link",
            "file_url",
            "file_name",
            "free_content",
            "payment_required",
            "is_student_visible"
        ]

    def get_file_url(self, obj):
        request = self.context.get("request")

        if obj.file_url:
            return request.build_absolute_uri(
                f"/api/content/content-file/{obj.id}/"
            )

        return None  
    
    def get_file_name(self, obj):
        if obj.file_url:
            return os.path.basename(obj.file_url.name)
        return None  
    
class AssignStreamContentSerializer(serializers.Serializer):

    student_id = serializers.IntegerField()
    program_id = serializers.IntegerField()
    package_id = serializers.IntegerField()

    # Existing Stream ID OR New Stream Name
    stream_id = serializers.ListField(
        child=serializers.CharField(),
        required=True
    )

    content_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        default=[]
    )    
    
    
    
