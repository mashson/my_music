from flask import Flask, render_template, send_file, jsonify
from flask_cors import CORS
import os
import json

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
        
        # uploads 폴더에서 음악 파일들 찾기
        for filename in os.listdir(UPLOAD_FOLDER):
            if filename.endswith(('.flac', '.wav', '.mp3')):
                # 파일명에서 번호와 제목 추출
                name_without_ext = os.path.splitext(filename)[0]
                
                # 번호 제거 (예: "01.햇살이 되어" -> "햇살이 되어")
                if name_without_ext.startswith(('01.', '02.', '03.', '04.', '05.', '06.')):
                    title = name_without_ext[3:].strip()  # 번호와 점 제거
                else:
                    title = name_without_ext
                
                # 해당하는 이미지 파일 찾기
                image_file = None
                for img_file in os.listdir(UPLOAD_FOLDER):
                    if img_file.startswith(name_without_ext.split('.')[0]) and img_file.endswith(('.jpg', '.jpeg', '.png')):
                        image_file = img_file
                        break
                
                music_info = {
                    'id': filename,
                    'title': title,
                    'filename': filename,
                    'image': image_file,
                    'file_path': f'/api/stream/{filename}'
                }
                music_list.append(music_info)
        
        # 제목순으로 정렬
        music_list.sort(key=lambda x: x['title'])
        
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
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        if os.path.exists(file_path):
            return send_file(file_path)
        else:
            return jsonify({'error': '파일을 찾을 수 없습니다.'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/image/<filename>')
def get_image(filename):
    """이미지 파일 반환"""
    try:
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        if os.path.exists(file_path):
            return send_file(file_path)
        else:
            return jsonify({'error': '이미지를 찾을 수 없습니다.'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # 배포 환경에서 포트 설정
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)