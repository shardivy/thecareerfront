import logging
from django.shortcuts import get_object_or_404, render

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import  IsAuthenticated

from accounts.permissions import IsAdmin, IsSuperAdmin
from program_package.models import Package, PackageFeature, Program, UserProgramPackage
from program_package.serializers import PackageCreateSerializer, PackageListSerializer, PackageSerializer, ProgramListSerializer, ProgramSerializer, ProgramWithPackagesSerializer
from django.db.models import Count


class ProgramListAPIView(APIView):
    """
    List all programs with enrolled users count
    """
    permission_classes = [IsAuthenticated]
    def get(self, request):
        programs = Program.objects.annotate(
            enrolled_users=Count("userprogrampackage", distinct=True)
        ).order_by("-created_at")

        serializer = ProgramListSerializer(programs, many=True)

        return Response(
            {
                "success": True,
                "count": programs.count(),
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )

class AddProgramAPIView(APIView):
    """
    API to allow super_admin users to create a new Program.
    """
    permission_classes = [IsSuperAdmin | IsAdmin ]
    

    def post(self, request):
        serializer = ProgramSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        program = serializer.save()

        return Response(
            {
                "success": True,
                "message": "Program added successfully",
                "data": serializer.data
            },
            status=status.HTTP_201_CREATED
        )
        
        
class UpdateProgramAPIView(APIView):
    """
    API to update or delete an existing Program
    """
    permission_classes = [IsSuperAdmin]

    # =========================
    # UPDATE PROGRAM (PUT)
    # =========================
    def put(self, request, program_id):
        try:
            program = Program.objects.get(id=program_id)
        except Program.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Program not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ProgramSerializer(
            program,
            data=request.data,
            partial=False  # PUT = full update
        )

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer.save()

        return Response(
            {
                "success": True,
                "message": "Program updated successfully",
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )
        
    # =========================
    # DELETE PROGRAM
    # =========================
    def delete(self, request, program_id):
        try:
            program = Program.objects.get(id=program_id)
        except Program.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Program not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        program.delete()

        return Response(
            {
                "success": True,
                "message": "Program deleted successfully"
            },
            status=status.HTTP_200_OK
        )

        
logger = logging.getLogger(__name__)

class PackageCreateAPIView(APIView):
    """
    Creates a package along with its features
    """
    permission_classes = [IsAdmin | IsSuperAdmin]

    def post(self, request):
        serializer = PackageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        package = serializer.save()

        return Response(
            {
                "success": True,
                "message": "Package created successfully",
                "data": {
                    "package_id": package.id,
                    "program": {
                        "id": package.program.id,
                        "name": package.program.name
                    },
                    "name": package.name,
                    "price": float(package.price),
                    "description": package.description,
                    "is_active": package.is_active,
                    "features": [
                        {
                            "id": feature.id,
                            "description": feature.description
                        }
                        for feature in package.packagefeature_set.all()
                    ]
                }
            },
            status=status.HTTP_201_CREATED
        )
        
    def put(self, request, pk):
        # Update package and replace its features
        package = get_object_or_404(Package, pk=pk)

        serializer = PackageCreateSerializer(
            package,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        package = serializer.save()

        # 🔁 Replace features if provided
        features = request.data.get("features", None)
        if features is not None:
            PackageFeature.objects.filter(package=package).delete()
            PackageFeature.objects.bulk_create([
                PackageFeature(
                    package=package,
                    description=feature
                )
                for feature in features
            ])

        return Response(
            {
                "success": True,
                "message": "Package updated successfully",
                "data": {
                    "package_id": package.id,
                    "program": {
                        "id": package.program.id,
                        "name": package.program.name
                    },
                    "name": package.name,
                    "price": float(package.price),
                    "description": package.description,
                    "is_active": package.is_active,
                    "features": [
                        {
                            "id": f.id,
                            "description": f.description
                        }
                        for f in package.packagefeature_set.all()
                    ]
                }
            },
            status=status.HTTP_200_OK
        )
        
class PackageListAPIView(APIView):
    """
    List all packages with active user count
    """
    # permission_classes = [IsAdmin]

    def get(self, request):
        packages = (
            Package.objects
            .select_related("program")
            .prefetch_related("packagefeature_set")  # improve query for features
            .annotate(
                active_users=Count("userprogrampackage")
            )
            .order_by("program__name", "name")
        )

        serializer = PackageListSerializer(packages, many=True)

        return Response(
            {
                "success": True,
                "count": packages.count(),
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )
        
class DashboardCountAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        total_programs = Program.objects.count()
        total_packages = Package.objects.count()
        total_enrolled_students = (
            UserProgramPackage.objects
            .values("user")
            .distinct()
            .count()
        )

        return Response({
            "total_programs": total_programs,
            "total_packages": total_packages,
            "total_enrolled_students": total_enrolled_students
        })
 
# Fetch packages for a specific program        
class ProgramPackagesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, program_id):
        program = get_object_or_404(Program, id=program_id, is_active=True)

        serializer = ProgramWithPackagesSerializer(program)

        return Response(
            {
                "message": "Program packages fetched successfully",
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )



# class AddPackageAPIView(APIView):
#     """
#     API to allow admin and super_admin users to create a new Package.
#     """
#     permission_classes = [IsAdmin | IsSuperAdmin]

#     def post(self, request):
#         try:
#             serializer = PackageSerializer(data=request.data)

#             if serializer.is_valid():
#                 package = serializer.save()

#                 logger.info(
#                     f"Package created | Package ID: {package.id} | "
#                     f"Program: {package.program.name} | "
#                     f"Name: {package.name}"
#                 )

#                 return Response(
#                     {
#                         "message": "Package added successfully",
#                         "data": serializer.data
#                     },
#                     status=status.HTTP_201_CREATED
#                 )

#             logger.warning(
#                 f"Package creation validation failed | Errors: {serializer.errors}"
#             )

#             return Response(
#                 {
#                     "message": "Validation error",
#                     "errors": serializer.errors
#                 },
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         except Exception as e:
#             logger.error(f"Package creation failed | Error: {str(e)}")

#             return Response(
#                 {
#                     "message": "Something went wrong while adding package",
#                     "error": str(e)
#                 },
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )
            
#     def put(self, request, package_id):
#         try:
#             try:
#                 package = Package.objects.get(id=package_id)
#             except Package.DoesNotExist:
#                 logger.warning(f"Package update failed | Package ID not found: {package_id}")
#                 return Response(
#                     {"message": "Package not found"},
#                     status=status.HTTP_404_NOT_FOUND
#                 )

#             serializer = PackageSerializer(
#                 package,
#                 data=request.data,
#                 partial=True  # allow partial updates
#             )

#             if serializer.is_valid():
#                 package = serializer.save()

#                 logger.info(
#                     f"Package updated | Package ID: {package.id} | "
#                     f"Program: {package.program.name} | "
#                     f"Name: {package.name}"
#                 )

#                 return Response(
#                     {
#                         "message": "Package updated successfully",
#                         "data": serializer.data
#                     },
#                     status=status.HTTP_200_OK
#                 )

#             logger.warning(
#                 f"Package update validation failed | Package ID: {package_id} | "
#                 f"Errors: {serializer.errors}"
#             )

#             return Response(
#                 {
#                     "message": "Validation error",
#                     "errors": serializer.errors
#                 },
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         except Exception as e:
#             logger.error(
#                 f"Package update failed | Package ID: {package_id} | Error: {str(e)}"
#             )

#             return Response(
#                 {
#                     "message": "Something went wrong while updating package",
#                     "error": str(e)
#                 },
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )

