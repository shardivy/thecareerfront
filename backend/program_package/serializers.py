from rest_framework import serializers

from program_package.models import Package, PackageFeature, Program, UserProgramPackage


class ProgramListSerializer(serializers.ModelSerializer):
    enrolled_users = serializers.IntegerField(read_only=True)

    class Meta:
        model = Program
        fields = [
            "id",
            "name",
            "description",
            "duration",
            "session",
            "is_active",
            "enrolled_users",
        ]

class ProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = [
            "id",
            "name",
            "description",
            "duration",
            "session",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
        
class PackageSerializer(serializers.ModelSerializer):
    program = serializers.PrimaryKeyRelatedField(
        queryset=Program.objects.all(), write_only=True
    )
    program_details = ProgramSerializer(
        source='program', read_only=True
    )

    class Meta:
        model = Package
        fields = [
            'id',
            'program',          # for POST
            'program_details',  # for RESPONSE
            'name',
            'price',
            'description',
            'is_active',
            'created_at'
        ]
        
class PackageCreateSerializer(serializers.ModelSerializer):
    program_id = serializers.PrimaryKeyRelatedField(
        queryset=Program.objects.all(),
        source="program"
    )
    features = serializers.ListField(
        child=serializers.CharField(),
        write_only=True
    )

    class Meta:
        model = Package
        fields = [
            "program_id",
            "name",
            "price",
            "description",
            "link_url",
            "is_active",
            "aptitude_test",
            "features"
        ]

    def create(self, validated_data):
        features = validated_data.pop("features")

        # 1️⃣ Create package
        package = Package.objects.create(**validated_data)

        # 2️⃣ Create related features
        feature_objects = [
            PackageFeature(
                package=package,
                description=feature
            )
            for feature in features
        ]
        PackageFeature.objects.bulk_create(feature_objects)

        return package
   
   
# GET API serializer 
class PackageListSerializer(serializers.ModelSerializer):
    program = serializers.SerializerMethodField()
    active_users = serializers.IntegerField(read_only=True)
    features = serializers.SerializerMethodField()  # include features like POST response

    class Meta:
        model = Package
        fields = [
            "id",
            "name",
            "price",
            "is_active",
            "program",
            "description",
            "link_url",
            "active_users",
            "aptitude_test",
            "features"
        ]

    def get_program(self, obj):
        return {
            "id": obj.program.id,
            "name": obj.program.name
        }

    def get_features(self, obj):
        # Convert all related features to desired format
        return [
            {
                "id": feature.id,
                "description": feature.description
            }
            for feature in obj.packagefeature_set.all()
        ]
        
# Serializer for features inside a package
class PackageFeatureMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackageFeature
        fields = ("id", "description")


# Serializer for packages including features
class PackageWithFeaturesSerializer(serializers.ModelSerializer):
    features = serializers.SerializerMethodField()
    program = serializers.SerializerMethodField()
    active_users = serializers.SerializerMethodField()  # optional if you want to include count

    class Meta:
        model = Package
        fields = (
            "id",
            "name",
            "price",
            "description",
            "link_url",
            "is_active",
            "program",
            "active_users",
            "features",
        )

    def get_features(self, obj):
        features = PackageFeature.objects.filter(
            package=obj,
            is_enabled=True
        )
        return PackageFeatureMiniSerializer(features, many=True).data

    def get_program(self, obj):
        return {"id": obj.program.id, "name": obj.program.name}

    def get_active_users(self, obj):
        # Replace with your actual logic for active users count
        return obj.users.filter(is_active=True).count() if hasattr(obj, 'users') else 0


# Serializer for Program including packages with features
class ProgramWithPackagesSerializer(serializers.ModelSerializer):
    packages = serializers.SerializerMethodField()

    class Meta:
        model = Program
        fields = (
            "id",
            "name",
            "description",
            "duration",
            "session",
            "is_active",
            "packages",
        )

    def get_packages(self, obj):
        packages = Package.objects.filter(
            program=obj,
            is_active=True
        )
        return PackageWithFeaturesSerializer(packages, many=True).data
