from accounts.models import Role

def get_student_role():
    try:
        return Role.objects.get(name="student")
    except Role.DoesNotExist:
        raise Exception("Student role not found. Please create role first.")

