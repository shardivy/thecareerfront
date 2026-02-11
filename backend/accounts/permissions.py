from rest_framework.permissions import BasePermission

class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role
            and request.user.role.name in ['superadmin']
        )


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role
            and request.user.role.name in ['admin']
        )

# class IsLeadCounsellor(BasePermission):
#     def has_permission(self, request, view):
#         return (
#             request.user
#             and request.user.is_authenticated
#             and request.user.role
#             and request.user.role.name in ['lead_counsellor']
#         )

class IsCounsellor(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role
            and request.user.role.name in ['counsellor']
        )


class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role
            and request.user.role.name == 'student'
        )
