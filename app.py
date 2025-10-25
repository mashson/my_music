from flask import Flask, request, jsonify, send_file, abort
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
from music_manager import MusicManager
from metadata_parser import MetadataParser

app = Flask(__name__)
CORS(app)  # CORS 허용

# 설정
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB 제한
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'flac', 'm4a'}

# MusicManager 인스턴스 생성
music_manager = MusicManager()

def allowed_file(filename):
    """허용된 파일 형식인지 확인"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    """메인 페이지"""
    return send_file('index.html')

@app.route('/css/<path:filename>')
def css_files(filename):
    """CSS 파일 서빙"""
    return send_file(f'css/{filename}')

@app.route('/js/<path:filename>')
def js_files(filename):
    """JavaScript 파일 서빙"""
    return send_file(f'js/{filename}')

@app.route('/api/albums', methods=['GET'])
def get_albums():
    """모든 앨범 목록 반환"""
    try:
        albums = music_manager.get_all_albums()
        response = jsonify({"success": True, "albums": albums})
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/tracks', methods=['GET'])
def get_tracks():
    """모든 트랙 목록 반환"""
    try:
        tracks = music_manager.get_all_tracks()
        response = jsonify({"success": True, "tracks": tracks})
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/albums/<album_id>/tracks', methods=['GET'])
def get_album_tracks(album_id):
    """특정 앨범의 트랙 목록 반환"""
    try:
        tracks = music_manager.get_album_tracks(album_id)
        return jsonify({"success": True, "tracks": tracks})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/tracks/<track_id>', methods=['GET'])
def get_track(track_id):
    """특정 트랙 정보 반환"""
    try:
        track = music_manager.get_track(track_id)
        if track:
            return jsonify({"success": True, "track": track})
        else:
            return jsonify({"success": False, "error": "트랙을 찾을 수 없습니다."}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/stream/<track_id>', methods=['GET'])
def stream_track(track_id):
    """음악 파일 스트리밍"""
    try:
        file_path = music_manager.get_file_path(track_id)
        if not file_path or not os.path.exists(file_path):
            abort(404)
        
        # Range 요청 지원 (부분 다운로드)
        range_header = request.headers.get('Range', None)
        if range_header:
            return send_file(file_path, as_attachment=False, conditional=True)
        else:
            return send_file(file_path, as_attachment=False)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """음악 파일 업로드"""
    try:
        if 'file' not in request.files:
            return jsonify({"success": False, "error": "파일이 선택되지 않았습니다."}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"success": False, "error": "파일이 선택되지 않았습니다."}), 400
        
        if not allowed_file(file.filename):
            return jsonify({"success": False, "error": "지원되지 않는 파일 형식입니다."}), 400
        
        # 파일명 보안 처리
        filename = secure_filename(file.filename)
        
        # MusicManager를 통해 파일 처리
        result = music_manager.add_track("", file)
        
        if result.get("success"):
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({"success": False, "error": f"업로드 중 오류가 발생했습니다: {str(e)}"}), 500

@app.route('/api/tracks/<track_id>', methods=['PUT'])
def update_track(track_id):
    """트랙 메타데이터 수정"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "요청 데이터가 없습니다."}), 400
        
        result = music_manager.update_track(track_id, data)
        
        if result.get("success"):
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({"success": False, "error": f"업데이트 중 오류가 발생했습니다: {str(e)}"}), 500

@app.route('/api/tracks/<track_id>', methods=['DELETE'])
def delete_track(track_id):
    """트랙 삭제"""
    try:
        result = music_manager.delete_track(track_id)
        
        if result.get("success"):
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({"success": False, "error": f"삭제 중 오류가 발생했습니다: {str(e)}"}), 500

@app.route('/api/search', methods=['GET'])
def search_tracks():
    """트랙 검색"""
    try:
        query = request.args.get('q', '')
        if not query:
            return jsonify({"success": False, "error": "검색어가 없습니다."}), 400
        
        results = music_manager.search_tracks(query)
        return jsonify({"success": True, "tracks": results})
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """헬스 체크"""
    return jsonify({"status": "healthy", "message": "Music Album API is running"})

@app.route('/api/refresh-metadata/<track_id>', methods=['POST'])
def refresh_track_metadata(track_id):
    """특정 트랙의 메타데이터 새로고침"""
    try:
        result = music_manager.refresh_metadata(track_id)
        if result.get("success"):
            return jsonify(result)
        else:
            return jsonify(result), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/refresh-all-metadata', methods=['POST'])
def refresh_all_metadata():
    """모든 트랙의 메타데이터 새로고침"""
    try:
        results = music_manager.refresh_all_metadata()
        return jsonify({"success": True, "results": results})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# 앨범 관리 API
@app.route('/api/albums', methods=['POST'])
def create_album():
    """새로운 앨범 생성"""
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        artist = data.get('artist', '').strip()
        year = data.get('year', '').strip()
        genre = data.get('genre', '').strip()
        
        if not name or not artist:
            return jsonify({"success": False, "error": "앨범명과 아티스트는 필수입니다."}), 400
        
        result = music_manager.create_album(name, artist, year, genre)
        if result.get('success'):
            return jsonify(result), 201
        else:
            return jsonify(result), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/albums/<album_id>', methods=['PUT'])
def update_album(album_id):
    """앨범 정보 업데이트"""
    try:
        data = request.get_json()
        updates = {}
        
        if 'name' in data:
            updates['name'] = data['name'].strip()
        if 'artist' in data:
            updates['artist'] = data['artist'].strip()
        if 'year' in data:
            updates['year'] = data['year'].strip()
        if 'genre' in data:
            updates['genre'] = data['genre'].strip()
        if 'cover_art' in data:
            updates['cover_art'] = data['cover_art']
        
        result = music_manager.update_album(album_id, updates)
        if result.get('success'):
            return jsonify(result)
        else:
            return jsonify(result), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/albums/<album_id>', methods=['DELETE'])
def delete_album(album_id):
    """앨범 삭제"""
    try:
        result = music_manager.delete_album(album_id)
        if result.get('success'):
            return jsonify(result)
        else:
            return jsonify(result), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({"success": False, "error": "요청한 리소스를 찾을 수 없습니다."}), 404

@app.errorhandler(413)
def too_large(error):
    return jsonify({"success": False, "error": "파일 크기가 너무 큽니다. (최대 100MB)"}), 413

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"success": False, "error": "서버 내부 오류가 발생했습니다."}), 500

if __name__ == '__main__':
    # 배포 환경에서 포트 설정
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
