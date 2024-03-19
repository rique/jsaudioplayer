import subprocess
import json
from uuid import uuid4
from base64 import b64encode

from django.shortcuts import render
from django.template import loader
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings

from .models import Tracks

from mutagen.id3 import ID3


# Create your views here.


@csrf_exempt
def addTrack(request):
    if request.method != 'POST':
        return JsonResponse(data={'success': False, 'code': 'wrong_method'}, status=405, reason="Method Not Allowed")
    
    body_unicode = request.body.decode('utf-8')
    params = json.loads(body_unicode)

    track = Tracks()
    track.track_name = params['track_name']
    
    
    track_original_path = params['track_original_path']
    track_uuid = str(uuid4())

    subprocess.run(f'ln -s "{track_original_path}" "{settings.BASE_DIR}/static/{track_uuid}.mp3"', shell=True)

    track.track_original_path = track_original_path
    track.track_uuid = track_uuid
    track.save()

    return JsonResponse(data={'success': True, 'mp3': f"{track_uuid}.mp3"})



@csrf_exempt
def fileBrowser(request):
    if request.method != 'POST':
        return JsonResponse(data={'success': False, 'code': 'wrong_method'}, status=405, reason="Method Not Allowed")

    print('BASEDIR', settings.BASE_DIR)

    body_unicode = request.body.decode('utf-8')
    params = json.loads(body_unicode)
    base_dir = params['base_dir'] or '~'
    
    res = subprocess.run(f'cd "{base_dir}" && ls -d */', shell=True, capture_output=True)
    res_str = res.stdout.decode().strip()
    dir_list = [] if base_dir == '/' else ['..']
    
    if len(res_str) > 0:
        dir_list += res_str.split('\n')
    
    res = subprocess.run(f'cd "{base_dir}" && ls -p | grep -v /|grep mp3', shell=True, capture_output=True)
    res_str = res.stdout.decode().strip()
    file_list = []

    if len(res_str) > 0:
        file_list = res_str.split('\n')

    return JsonResponse(data={'base_dir': base_dir, 'dir_list': dir_list, 'file_list': file_list})


@csrf_exempt
def loadTrackList(request):
    if request.method != 'POST':
        return JsonResponse(data={'success': False, 'code': 'wrong_method'}, status=405, reason="Method Not Allowed")
    
    tracks = Tracks.objects.filter().all()
    tracklist = [trk.__dict__ for trk in tracks]

    return JsonResponse(data={
        'success': True,
        'tracklist': tracklist
    })
