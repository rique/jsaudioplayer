from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("lib-v2", views.libraryV2, name="libraryV2"),
]

