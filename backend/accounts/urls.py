from django.urls import path

from accounts.views import AdminDashboardAPIView, AdminStaffRegisterAPIView, AdminUserListAPIView, AssignPermissionsToRoleAPIView, ForgotPasswordAPIView, HandholdingUsersListAPIView, LeadStatsAPIView, LoginAPIView, LogoutAPIView, PermissionListCreateAPIView, ProfileUpdateAPIView,  ResetPasswordAPIView, RevenueStatsAPIView, RoleListCreateAPIView, RolePermissionListAPIView, RoleUpdateAPIView, StudentListAPIView, StudentProfileByIdAPIView, VerifyOTPAPIView

urlpatterns = [
    path('register/', AdminStaffRegisterAPIView.as_view(), name='register'),
    path('register/<str:user_id>/', AdminStaffRegisterAPIView.as_view(), name='register'),
    path('login/', LoginAPIView.as_view(), name='login'),
    path('forgot-password/', ForgotPasswordAPIView.as_view(), name='forgot-password'),
    path('verify-otp/', VerifyOTPAPIView.as_view(), name='verify-otp') , 
    path('reset-password/', ResetPasswordAPIView.as_view(), name='reset-password'),  
    path('profile/', ProfileUpdateAPIView.as_view(), name='profile'), 
    path("student-profile/<int:student_id>/", StudentProfileByIdAPIView.as_view()),
    path('logout/', LogoutAPIView.as_view(), name='logout'),

    # ============ Role and permission Url ===========================
    path("roles/", RoleListCreateAPIView.as_view()),
    path("roles/<int:role_id>/", RoleUpdateAPIView.as_view()),
    path("permissions/", PermissionListCreateAPIView.as_view()),
    path("roles/<int:role_id>/permissions/", AssignPermissionsToRoleAPIView.as_view()),
    path("roles/<int:role_id>/permissions/list/", RolePermissionListAPIView.as_view()),
    
    path("admin-users/", AdminUserListAPIView.as_view(), name="admin-users"),
    path("only-students/", StudentListAPIView.as_view(), name="only-students"),
    path("all-users/", HandholdingUsersListAPIView.as_view(), name="all-users"),
    
    #====================== Dashboard Url ===========================
    path('dashboard/', AdminDashboardAPIView.as_view()),
    path('lead-stats/', LeadStatsAPIView.as_view(), name='lead-stats'),
    path('revenue-stats/', RevenueStatsAPIView.as_view(), name='revenue-stats'),
    
    
]