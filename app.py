from flask import Flask, send_file, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# 업로드 폴더 경로
UPLOAD_FOLDER = 'uploads'

@app.route('/')
def index():
    return send_file('index.html')

@app.route('/css/<path:filename>')
def css_files(filename):
    return send_file(f'css/{filename}')

@app.route('/js/<path:filename>')
def js_files(filename):
    return send_file(f'js/{filename}')

@app.route('/api/music')
def get_music_list():
    """음악 목록 반환"""
    try:
        music_list = []
        
        # album1 폴더에서 음악 파일들 찾기
        album_folder = os.path.join(UPLOAD_FOLDER, 'album1')
        
        if not os.path.exists(album_folder):
            return jsonify({
                'success': False,
                'error': 'album1 폴더를 찾을 수 없습니다.'
            }), 404
        
        for filename in os.listdir(album_folder):
            if filename.endswith(('.flac', '.wav', '.mp3')):
                # 파일명에서 번호와 제목 추출
                name_without_ext = os.path.splitext(filename)[0]
                
                # 번호 추출 (예: "01.햇살이 되어" -> "01", "햇살이 되어")
                if name_without_ext.startswith(('01.', '02.', '03.', '04.', '05.', '06.', '07.', '08.', '09.', '10.')):
                    # 번호와 제목 분리
                    parts = name_without_ext.split('.', 1)
                    if len(parts) == 2:
                        track_number = parts[0]
                        title = parts[1].strip()
                        # 순서 번호를 음악 이름에 포함
                        display_title = f"{track_number}. {title}"
                    else:
                        display_title = name_without_ext
                        track_number = "00"
                else:
                    display_title = name_without_ext
                    track_number = "00"
                
                # 해당하는 이미지 파일 찾기
                image_file = None
                for img_file in os.listdir(album_folder):
                    if img_file.startswith(name_without_ext.split('.')[0]) and img_file.endswith(('.jpg', '.jpeg', '.png')):
                        image_file = img_file
                        break
                
                music_info = {
                    'id': filename,
                    'title': display_title,
                    'track_number': track_number,
                    'filename': filename,
                    'image': image_file,
                    'file_path': f'/api/stream/{filename}'
                }
                music_list.append(music_info)
        
        # 트랙 번호순으로 정렬
        music_list.sort(key=lambda x: x['track_number'])
        
        return jsonify({
            'success': True,
            'music': music_list
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/stream/<filename>')
def stream_music(filename):
    """음악 파일 스트리밍"""
    try:
        file_path = os.path.join(UPLOAD_FOLDER, 'album1', filename)
        if os.path.exists(file_path):
            return send_file(file_path)
        else:
            return jsonify({'error': '파일을 찾을 수 없습니다.'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/singer-image/<filename>')
def get_singer_image(filename):
    """가수 이미지 파일 반환"""
    try:
        file_path = os.path.join(UPLOAD_FOLDER, 'singer', filename)
        if os.path.exists(file_path):
            return send_file(file_path)
        else:
            return jsonify({'error': '가수 이미지를 찾을 수 없습니다.'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # 배포 환경에서 포트 설정
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)