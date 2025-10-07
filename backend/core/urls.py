from django.urls import path, include

urlpatterns = [
    path('api/', include('system.urls'))
]
