from django.shortcuts import render
from django.template import loader
from django.http import HttpResponse
# Create your views here.


def index(request):
    return HttpResponse(loader.get_template("tests1/index2.html").render({}, request))

