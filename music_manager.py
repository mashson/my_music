import os
import json
import shutil
import uuid
from datetime import datetime
from metadata_parser import MetadataParser


class MusicManager:
    """음악 파일 관리를 위한 클래스"""
    
    def __init__(self, upload_dir="uploads", metadata_file="music_metadata.json"):
        self.upload_dir = upload_dir
        self.metadata_file = metadata_file
        self.metadata = self.load_metadata()
        
        # uploads 디렉토리가 없으면 생성
        if not os.path.exists(self.upload_dir):
            os.makedirs(self.upload_dir)
    
    def load_metadata(self):
        """메타데이터 파일 로드"""
        try:
            if os.path.exists(self.metadata_file):
                with open(self.metadata_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return {"albums": {}, "tracks": {}}
        except Exception as e:
            print(f"메타데이터 로드 오류: {e}")
            return {"albums": {}, "tracks": {}}
    
    def save_metadata(self):
        """메타데이터 파일 저장"""
        try:
            with open(self.metadata_file, 'w', encoding='utf-8') as f:
                json.dump(self.metadata, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"메타데이터 저장 오류: {e}")
    
    def add_track(self, file_path, uploaded_file):
        """새로운 트랙 추가"""
        try:
            # 파일명 정리
            filename = MetadataParser.sanitize_filename(uploaded_file.filename)
            file_extension = os.path.splitext(filename)[1].lower()
            
            if not MetadataParser.is_supported_file(filename):
                return {"error": "지원되지 않는 파일 형식입니다."}
            
            # 고유 ID 생성
            track_id = str(uuid.uuid4())
            
            # 파일 저장
            safe_filename = f"{track_id}{file_extension}"
            file_path = os.path.join(self.upload_dir, safe_filename)
            uploaded_file.save(file_path)
            
            # 메타데이터 추출
            metadata = MetadataParser.extract_metadata(file_path)
            if not metadata:
                os.remove(file_path)  # 실패 시 파일 삭제
                return {"error": "메타데이터 추출에 실패했습니다."}
            
            # UUID인 경우 original_filename에서 제목 추출
            if metadata["title"] == track_id:  # UUID와 같으면 파일명에서 추출
                import re
                # "01.햇살이 되어 FLAC-Mastered-File-FLAC-24bit-48kHz.flac" -> "햇살이 되어"
                # "03.괜찮은 가을이야.wav" -> "괜찮은 가을이야"
                clean_name = re.sub(r'^\d+\.\s*', '', filename)  # "01. " 또는 "03. " 제거
                clean_name = re.sub(r'\s+FLAC.*$', '', clean_name)  # " FLAC..." 제거
                clean_name = re.sub(r'\.[^.]*$', '', clean_name)  # 확장자 제거
                metadata["title"] = clean_name.strip()
                print(f"업로드 시 파일명에서 제목 추출: {metadata['title']}")
            
            # 트랙 정보 생성
            track_info = {
                "id": track_id,
                "filename": safe_filename,
                "original_filename": filename,
                "title": metadata["title"] or os.path.splitext(filename)[0],
                "artist": metadata["artist"] or "Unknown Artist",
                "album": metadata["album"] or "Unknown Album",
                "year": metadata["year"] or "",
                "genre": metadata["genre"] or "",
                "duration": metadata["duration"],
                "track_number": metadata["track_number"] or "",
                "album_artist": metadata["album_artist"] or metadata["artist"] or "Unknown Artist",
                "cover_art": metadata["cover_art"],
                "file_size": os.path.getsize(file_path),
                "upload_date": datetime.now().isoformat(),
                "file_path": file_path
            }
            
            # 트랙 메타데이터에 추가
            self.metadata["tracks"][track_id] = track_info
            
            # 앨범 정보 업데이트
            album_key = f"{track_info['album']}|{track_info['album_artist']}"
            if album_key not in self.metadata["albums"]:
                self.metadata["albums"][album_key] = {
                    "id": album_key,
                    "name": track_info["album"],
                    "artist": track_info["album_artist"],
                    "year": track_info["year"],
                    "genre": track_info["genre"],
                    "cover_art": track_info["cover_art"],
                    "tracks": [],
                    "track_count": 0
                }
            
            # 앨범에 트랙 추가
            if track_id not in self.metadata["albums"][album_key]["tracks"]:
                self.metadata["albums"][album_key]["tracks"].append(track_id)
                self.metadata["albums"][album_key]["track_count"] = len(self.metadata["albums"][album_key]["tracks"])
            
            # 메타데이터 저장
            self.save_metadata()
            
            return {"success": True, "track": track_info}
            
        except Exception as e:
            print(f"트랙 추가 오류: {e}")
            return {"error": f"트랙 추가 중 오류가 발생했습니다: {str(e)}"}
    
    def get_all_tracks(self):
        """모든 트랙 목록 반환"""
        return list(self.metadata["tracks"].values())
    
    def get_track(self, track_id):
        """특정 트랙 정보 반환"""
        return self.metadata["tracks"].get(track_id)
    
    def get_all_albums(self):
        """모든 앨범 목록 반환"""
        albums = []
        for album_key, album_data in self.metadata["albums"].items():
            # 트랙 번호로 정렬
            album_tracks = []
            for track_id in album_data["tracks"]:
                track = self.metadata["tracks"].get(track_id)
                if track:
                    album_tracks.append(track)
            
            # 트랙 번호로 정렬
            album_tracks.sort(key=lambda x: int(x.get("track_number", "0")) if x.get("track_number", "0").isdigit() else 0)
            
            album_info = {
                "id": album_data["id"],
                "name": album_data["name"],
                "artist": album_data["artist"],
                "year": album_data["year"],
                "genre": album_data["genre"],
                "cover_art": album_data["cover_art"],
                "track_count": album_data["track_count"],
                "tracks": album_tracks
            }
            albums.append(album_info)
        
        # 앨범명으로 정렬
        albums.sort(key=lambda x: x["name"])
        return albums
    
    def get_album_tracks(self, album_id):
        """특정 앨범의 트랙 목록 반환"""
        album_data = self.metadata["albums"].get(album_id)
        if not album_data:
            return []
        
        tracks = []
        for track_id in album_data["tracks"]:
            track = self.metadata["tracks"].get(track_id)
            if track:
                tracks.append(track)
        
        # 트랙 번호로 정렬
        tracks.sort(key=lambda x: int(x.get("track_number", "0")) if x.get("track_number", "0").isdigit() else 0)
        return tracks
    
    def update_track(self, track_id, updates):
        """트랙 정보 업데이트"""
        try:
            if track_id not in self.metadata["tracks"]:
                return {"error": "트랙을 찾을 수 없습니다."}
            
            track = self.metadata["tracks"][track_id]
            
            # 업데이트 가능한 필드들
            updatable_fields = ["title", "artist", "album", "year", "genre", "track_number", "album_artist"]
            
            for field in updatable_fields:
                if field in updates:
                    track[field] = updates[field]
            
            # 앨범 정보가 변경된 경우 앨범 구조 업데이트
            if "album" in updates or "album_artist" in updates:
                old_album_key = f"{track.get('album', '')}|{track.get('album_artist', '')}"
                new_album_key = f"{updates.get('album', track.get('album', ''))}|{updates.get('album_artist', track.get('album_artist', ''))}"
                
                if old_album_key != new_album_key:
                    # 기존 앨범에서 트랙 제거
                    if old_album_key in self.metadata["albums"]:
                        if track_id in self.metadata["albums"][old_album_key]["tracks"]:
                            self.metadata["albums"][old_album_key]["tracks"].remove(track_id)
                            self.metadata["albums"][old_album_key]["track_count"] = len(self.metadata["albums"][old_album_key]["tracks"])
                            
                            # 빈 앨범 삭제
                            if self.metadata["albums"][old_album_key]["track_count"] == 0:
                                del self.metadata["albums"][old_album_key]
                    
                    # 새 앨범에 트랙 추가
                    if new_album_key not in self.metadata["albums"]:
                        self.metadata["albums"][new_album_key] = {
                            "id": new_album_key,
                            "name": updates.get("album", track.get("album", "")),
                            "artist": updates.get("album_artist", track.get("album_artist", "")),
                            "year": updates.get("year", track.get("year", "")),
                            "genre": updates.get("genre", track.get("genre", "")),
                            "cover_art": track.get("cover_art"),
                            "tracks": [],
                            "track_count": 0
                        }
                    
                    if track_id not in self.metadata["albums"][new_album_key]["tracks"]:
                        self.metadata["albums"][new_album_key]["tracks"].append(track_id)
                        self.metadata["albums"][new_album_key]["track_count"] = len(self.metadata["albums"][new_album_key]["tracks"])
            
            self.save_metadata()
            return {"success": True, "track": track}
            
        except Exception as e:
            print(f"트랙 업데이트 오류: {e}")
            return {"error": f"트랙 업데이트 중 오류가 발생했습니다: {str(e)}"}
    
    def delete_track(self, track_id):
        """트랙 삭제"""
        try:
            if track_id not in self.metadata["tracks"]:
                return {"error": "트랙을 찾을 수 없습니다."}
            
            track = self.metadata["tracks"][track_id]
            
            # 파일 삭제
            file_path = os.path.join(self.upload_dir, track["filename"])
            if os.path.exists(file_path):
                os.remove(file_path)
            
            # 앨범에서 트랙 제거
            album_key = f"{track['album']}|{track['album_artist']}"
            if album_key in self.metadata["albums"]:
                if track_id in self.metadata["albums"][album_key]["tracks"]:
                    self.metadata["albums"][album_key]["tracks"].remove(track_id)
                    self.metadata["albums"][album_key]["track_count"] = len(self.metadata["albums"][album_key]["tracks"])
                    
                    # 빈 앨범 삭제
                    if self.metadata["albums"][album_key]["track_count"] == 0:
                        del self.metadata["albums"][album_key]
            
            # 트랙 메타데이터에서 제거
            del self.metadata["tracks"][track_id]
            
            self.save_metadata()
            return {"success": True}
            
        except Exception as e:
            print(f"트랙 삭제 오류: {e}")
            return {"error": f"트랙 삭제 중 오류가 발생했습니다: {str(e)}"}
    
    def search_tracks(self, query):
        """트랙 검색"""
        query = query.lower()
        results = []
        
        for track in self.metadata["tracks"].values():
            if (query in track["title"].lower() or 
                query in track["artist"].lower() or 
                query in track["album"].lower() or 
                query in track["genre"].lower()):
                results.append(track)
        
        return results
    
    def get_file_path(self, track_id):
        """트랙의 실제 파일 경로 반환"""
        track = self.metadata["tracks"].get(track_id)
        if track:
            return os.path.join(self.upload_dir, track["filename"])
        return None
    
    def refresh_metadata(self, track_id):
        """특정 트랙의 메타데이터를 다시 추출"""
        try:
            track = self.metadata["tracks"].get(track_id)
            if not track:
                return {"error": "트랙을 찾을 수 없습니다."}
            
            file_path = os.path.join(self.upload_dir, track["filename"])
            if not os.path.exists(file_path):
                return {"error": "파일을 찾을 수 없습니다."}
            
            # 메타데이터 다시 추출
            from metadata_parser import MetadataParser
            new_metadata = MetadataParser.extract_metadata(file_path)
            if not new_metadata:
                return {"error": "메타데이터 추출에 실패했습니다."}
            
                # 파일명에서 제목 추출 (UUID인 경우)
                import re
                uuid_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                
                if re.match(uuid_pattern, track["title"]):
                    # original_filename에서 제목 추출
                    original_name = track.get("original_filename", "")
                    if original_name:
                        # "01.햇살이 되어 FLAC-Mastered-File-FLAC-24bit-48kHz.flac" -> "햇살이 되어"
                        # "03.괜찮은 가을이야.wav" -> "괜찮은 가을이야"
                        # 번호와 점 제거, 확장자 제거
                        clean_name = re.sub(r'^\d+\.\s*', '', original_name)  # "01. " 또는 "03. " 제거
                        clean_name = re.sub(r'\s+FLAC.*$', '', clean_name)  # " FLAC..." 제거
                        clean_name = re.sub(r'\.[^.]*$', '', clean_name)  # 확장자 제거
                        new_metadata["title"] = clean_name.strip()
                        print(f"파일명에서 제목 추출: {new_metadata['title']}")
            
            # 트랙 정보 업데이트
            track["title"] = new_metadata["title"]
            track["artist"] = new_metadata["artist"]
            track["album"] = new_metadata["album"]
            track["year"] = new_metadata["year"]
            track["genre"] = new_metadata["genre"]
            track["track_number"] = new_metadata["track_number"]
            track["album_artist"] = new_metadata["album_artist"]
            track["cover_art"] = new_metadata["cover_art"]
            
            # 앨범 정보 업데이트
            album_key = f"{track['album']}|{track['album_artist']}"
            if album_key not in self.metadata["albums"]:
                self.metadata["albums"][album_key] = {
                    "id": album_key,
                    "name": track["album"],
                    "artist": track["album_artist"],
                    "year": track["year"],
                    "genre": track["genre"],
                    "cover_art": track["cover_art"],
                    "tracks": [],
                    "track_count": 0
                }
            
            # 기존 앨범에서 트랙 제거
            old_album_key = f"{track.get('album', 'Unknown Album')}|{track.get('album_artist', 'Unknown Artist')}"
            if old_album_key in self.metadata["albums"] and old_album_key != album_key:
                if track_id in self.metadata["albums"][old_album_key]["tracks"]:
                    self.metadata["albums"][old_album_key]["tracks"].remove(track_id)
                    self.metadata["albums"][old_album_key]["track_count"] = len(self.metadata["albums"][old_album_key]["tracks"])
                    
                    if self.metadata["albums"][old_album_key]["track_count"] == 0:
                        del self.metadata["albums"][old_album_key]
            
            # 새 앨범에 트랙 추가
            if track_id not in self.metadata["albums"][album_key]["tracks"]:
                self.metadata["albums"][album_key]["tracks"].append(track_id)
                self.metadata["albums"][album_key]["track_count"] = len(self.metadata["albums"][album_key]["tracks"])
            
            self.save_metadata()
            return {"success": True, "track": track}
            
        except Exception as e:
            print(f"메타데이터 새로고침 오류: {e}")
            return {"error": f"메타데이터 새로고침 중 오류가 발생했습니다: {str(e)}"}
    
    def refresh_all_metadata(self):
        """모든 트랙의 메타데이터를 다시 추출"""
        results = []
        for track_id in list(self.metadata["tracks"].keys()):
            result = self.refresh_metadata(track_id)
            results.append({"track_id": track_id, "result": result})
        return results
    
    def create_album(self, name, artist, year="", genre="", cover_art=None):
        """새로운 앨범 생성"""
        try:
            album_key = f"{name}|{artist}"
            
            # 이미 존재하는 앨범인지 확인
            if album_key in self.metadata["albums"]:
                return {"error": "이미 존재하는 앨범입니다."}
            
            # 새 앨범 생성
            self.metadata["albums"][album_key] = {
                "id": album_key,
                "name": name,
                "artist": artist,
                "year": year,
                "genre": genre,
                "cover_art": cover_art,
                "tracks": [],
                "track_count": 0
            }
            
            self.save_metadata()
            return {"success": True, "album": self.metadata["albums"][album_key]}
            
        except Exception as e:
            print(f"앨범 생성 오류: {e}")
            return {"error": f"앨범 생성 중 오류가 발생했습니다: {str(e)}"}
    
    def update_album(self, album_id, updates):
        """앨범 정보 업데이트"""
        try:
            album = self.metadata["albums"].get(album_id)
            if not album:
                return {"error": "앨범을 찾을 수 없습니다."}
            
            # 업데이트할 필드들
            if "name" in updates:
                album["name"] = updates["name"]
            if "artist" in updates:
                album["artist"] = updates["artist"]
            if "year" in updates:
                album["year"] = updates["year"]
            if "genre" in updates:
                album["genre"] = updates["genre"]
            if "cover_art" in updates:
                album["cover_art"] = updates["cover_art"]
            
            # 앨범 키가 변경된 경우 (이름이나 아티스트가 변경된 경우)
            new_album_key = f"{album['name']}|{album['artist']}"
            if new_album_key != album_id:
                # 새 키로 앨범 이동
                self.metadata["albums"][new_album_key] = album
                album["id"] = new_album_key
                del self.metadata["albums"][album_id]
                
                # 해당 앨범의 모든 트랙들의 앨범 정보도 업데이트
                for track_id in album["tracks"]:
                    track = self.metadata["tracks"].get(track_id)
                    if track:
                        track["album"] = album["name"]
                        track["album_artist"] = album["artist"]
            
            self.save_metadata()
            return {"success": True, "album": album}
            
        except Exception as e:
            print(f"앨범 업데이트 오류: {e}")
            return {"error": f"앨범 업데이트 중 오류가 발생했습니다: {str(e)}"}
    
    def delete_album(self, album_id):
        """앨범 삭제 (트랙이 있는 경우 삭제 불가)"""
        try:
            album = self.metadata["albums"].get(album_id)
            if not album:
                return {"error": "앨범을 찾을 수 없습니다."}
            
            # 트랙이 있는 경우 삭제 불가
            if album["track_count"] > 0:
                return {"error": "트랙이 있는 앨범은 삭제할 수 없습니다. 먼저 모든 트랙을 삭제해주세요."}
            
            # 앨범 삭제
            del self.metadata["albums"][album_id]
            self.save_metadata()
            
            return {"success": True}
            
        except Exception as e:
            print(f"앨범 삭제 오류: {e}")
            return {"error": f"앨범 삭제 중 오류가 발생했습니다: {str(e)}"}
