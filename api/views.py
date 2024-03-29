import subprocess
import json
import shlex
from uuid import uuid4
from base64 import b64encode

from django.shortcuts import render
from django.template import loader
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings

from .models import Tracks

from mutagen.id3 import ID3
from mutagen.mp3 import MP3
from base64 import b64encode

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
    audio = ID3(track_original_path)
    mp3_file = MP3(track_original_path)
    keys = audio.keys()
    
    title = ''
    if 'TIT2' in keys:
        title = audio.get('TIT2').text[0]
    
    artist = ''
    if 'TPE1' in keys:
        artist = audio.get('TPE1').text[0]
    
    album = ''
    if 'TALB' in keys:
        album = audio.get('TALB').text[0]
    
    apict = ''
    pic_format = ''
    if 'APIC:' in keys:
        apict = b64encode(audio.get('APIC:').data).decode('ASCII')
        pic_format = audio.get('APIC:').mime
    else:
        for k in keys:
            if k.startswith('APIC:'):
                APIC = audio.get(k)
                if APIC.mime:
                    apict = b64encode(APIC.data).decode('ASCII')
                    pic_format = APIC.mime
                    break

    track_uuid = str(uuid4())

    res = subprocess.run(f'ln -s "{track_original_path}" "{settings.BASE_DIR}/static/{track_uuid}.mp3"', shell=True, capture_output=True)
    print('stderr addTrack', res.stderr.decode(), res.stdout.decode())

    track.track_original_path = track_original_path
    track.track_uuid = track_uuid
    track.save()

    return JsonResponse(data={'success': True, 'track': track.__dict__, 'ID3': {
        'title': title,
        'artist': artist,
        'album': album,
        'picture': {'data': apict, 'format': pic_format},
        'duration': mp3_file.info.length
    }})


@csrf_exempt
def deleteTrack(request):
    if request.method != 'POST':
        return JsonResponse(data={'success': False, 'code': 'wrong_method'}, status=405, reason="Method Not Allowed")

    body_unicode = request.body.decode('utf-8')
    params = json.loads(body_unicode)
    track_uuid = params['track_uuid']
    try:
        track = Tracks.objects.get(track_uuid=track_uuid)
    except Tracks.DoesNotExist:
        return JsonResponse(data={'success': False, 'code': 'dose_not_exist'}, status=404, reason=f"Object or ressource with uuid {track_uuid} not found")

    print('Proceeding to delete file ', track_uuid)
    subprocess.run(f'rm -f "{settings.BASE_DIR}/static/{track_uuid}.mp3"', shell=True)
    print('Removed link ', track_uuid)
    track.delete()
    print('Deleted file ', track_uuid)
    
    return JsonResponse(data={'success': True, })


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
    
    # base_dir = shlex.quote(base_dir) #.replace(' ', '\ ').replace('(', '\(').replace(')', '\)').replace('&', '\&')

    res = subprocess.run(f'ls -p  "{base_dir}" | grep -v /| grep -i mp3', shell=True, capture_output=True)
    print('errors :', res.stderr.decode())
    res_str = res.stdout.decode().strip()
    file_list = []

    if len(res_str) > 0:
        file_list = res_str.split('\n')

    return JsonResponse(data={'success': True, 'base_dir': base_dir, 'dir_list': dir_list, 'file_list': file_list})


@csrf_exempt
def loadTrackList(request):
    if request.method != 'POST':
        return JsonResponse(data={'success': False, 'code': 'wrong_method'}, status=405, reason="Method Not Allowed")
    
    tracks = Tracks.objects.filter().all()
    tracklist = []
    nb_tracks = len(tracks)
    duration = 0
    for trk in tracks:
        audio = ID3(f'./static/{trk.track_uuid}.mp3')
        mp3_file = MP3(f'./static/{trk.track_uuid}.mp3')
        keys = audio.keys()
        
        title = ''
        if 'TIT2' in keys:
            title = audio.get('TIT2').text[0]
        artist = ''
        if 'TPE1' in keys:
            artist = audio.get('TPE1').text[0]
        album = ''
        if 'TALB' in keys:
            album = audio.get('TALB').text[0];
        apict = ''
        pic_format = ''
        if 'APIC:' in keys:
            apict = b64encode(audio.get('APIC:').data).decode('ASCII')
            pic_format = audio.get('APIC:').mime
        else:
            for k in keys:
                if k.startswith('APIC:'):
                    APIC = audio.get(k)
                    if APIC.mime:
                        apict = b64encode(APIC.data).decode('ASCII')
                        pic_format = APIC.mime
                        break
        duration += mp3_file.info.length
        tracklist.append({'track': trk.__dict__, 'ID3': {
            'title': title,
            'artist': artist,
            'album': album,
            'picture': {'data': apict, 'format': pic_format},
            'duration': mp3_file.info.length
        } })

    print('duration', duration)
    return JsonResponse(data={
        'success': True,
        'nb_tracks': nb_tracks,
        'total_duration': duration,
        'tracklist': tracklist,
    })


@csrf_exempt
def loadBGImages(request):

    img_dir = './static/imga/'
    res = subprocess.run(f'find -L "{img_dir}" -type f | grep -i --include=*.{{jpg,jpeg,png}} "" | sort -R', shell=True, capture_output=True, check=False)
    res_str = res.stdout.decode().strip()

    return JsonResponse(data={"success": True, 'img_list': [r.replace('./', '') for r in res_str.split('\n')]})


@csrf_exempt
def scanForMyTracks(request):
    base_dirs = '/mnt/ /home/enriaue/'
    shell_comand = "find " + base_dirs + " -type f -iname \"*.mp3\" -exec ls -l {} \;| awk '$5>1005128 {out = $5" "; for (i=9; i <= NF; i++) {out=out" "$i};  print  out}'" 

    res = subprocess.run(shell_comand, shell=True, capture_output=True)
    print('stderr', res.stderr.decode())
    
    res_str = res.stdout.decode().strip()

    traks_list = []

    if len(res_str) > 0:
        for track in res_str.split('\n'):
            #  track 8073963/mnt/sabrent/Music/4lieneticYoursftMadiLarson.mp3 ['8073963', 'mnt', 'sabrent', 'Music', '4lieneticYoursftMadiLarson.mp3']
            t = track.split('/')
            traks_list += [(int(t[0]), '/'.join(t[1:]))]
    
    print(traks_list)

    return JsonResponse(data={
        'success': True,
        'traks_list': traks_list
    })
