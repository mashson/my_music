import os
import base64
from mutagen import File as MutagenFile
from mutagen.id3 import ID3NoHeaderError
from PIL import Image
import io


class MetadataParser:
    """음악 파일의 메타데이터를 추출하는 클래스"""
    
    SUPPORTED_FORMATS = ['.mp3', '.wav', '.flac', '.m4a']
    
    @staticmethod
    def is_supported_file(filename):
        """지원되는 파일 형식인지 확인"""
        return any(filename.lower().endswith(ext) for ext in MetadataParser.SUPPORTED_FORMATS)
    
    @staticmethod
    def extract_metadata(file_path):
        """음악 파일에서 메타데이터 추출"""
        try:
            audio_file = MutagenFile(file_path)
            if audio_file is None:
                print(f"파일을 읽을 수 없습니다: {file_path}")
                return None
            
            metadata = {
                'title': '',
                'artist': '',
                'album': '',
                'year': '',
                'genre': '',
                'duration': 0,
                'track_number': '',
                'album_artist': '',
                'cover_art': None
            }
            
            # 기본 정보 추출
            if hasattr(audio_file, 'info'):
                metadata['duration'] = int(audio_file.info.length) if audio_file.info.length else 0
            
                # 파일명에서 기본 제목 추출
                filename = os.path.splitext(os.path.basename(file_path))[0]

                # UUID 패턴 체크 (정규식 사용)
                import re
                uuid_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                
                if not re.match(uuid_pattern, filename):
                    metadata['title'] = filename
                else:
                    # UUID인 경우 original_filename에서 추출 시도
                    # 이는 music_manager에서 설정됨
                    pass
            
            # 태그 정보 추출
            if hasattr(audio_file, 'tags') and audio_file.tags:
                tags = audio_file.tags
                print(f"사용 가능한 태그들: {list(tags.keys())}")
                
                # 제목 추출 (여러 형식 시도)
                title_keys = ['TIT2', 'TITLE', 'TIT1', 'TIT3']
                for key in title_keys:
                    if key in tags and tags[key]:
                        metadata['title'] = str(tags[key][0]).strip()
                        if metadata['title']:
                            print(f"제목 추출됨 ({key}): {metadata['title']}")
                            break
                
                # 아티스트 추출
                artist_keys = ['TPE1', 'ARTIST', 'TPE2', 'ALBUMARTIST']
                for key in artist_keys:
                    if key in tags and tags[key]:
                        metadata['artist'] = str(tags[key][0]).strip()
                        if metadata['artist']:
                            print(f"아티스트 추출됨 ({key}): {metadata['artist']}")
                            break
                
                # 앨범 추출
                album_keys = ['TALB', 'ALBUM']
                for key in album_keys:
                    if key in tags and tags[key]:
                        metadata['album'] = str(tags[key][0]).strip()
                        if metadata['album']:
                            print(f"앨범 추출됨 ({key}): {metadata['album']}")
                            break
                
                # 년도 추출
                year_keys = ['TDRC', 'DATE', 'TYER']
                for key in year_keys:
                    if key in tags and tags[key]:
                        year_value = str(tags[key][0]).strip()
                        if year_value and year_value.isdigit():
                            metadata['year'] = year_value
                            print(f"년도 추출됨 ({key}): {metadata['year']}")
                            break
                
                # 장르 추출
                genre_keys = ['TCON', 'GENRE']
                for key in genre_keys:
                    if key in tags and tags[key]:
                        metadata['genre'] = str(tags[key][0]).strip()
                        if metadata['genre']:
                            print(f"장르 추출됨 ({key}): {metadata['genre']}")
                            break
                
                # 트랙 번호 추출
                track_keys = ['TRCK', 'TRACKNUMBER', 'TRK']
                for key in track_keys:
                    if key in tags and tags[key]:
                        metadata['track_number'] = str(tags[key][0]).strip()
                        if metadata['track_number']:
                            print(f"트랙 번호 추출됨 ({key}): {metadata['track_number']}")
                            break
                
                # 앨범 아티스트 추출
                album_artist_keys = ['TPE2', 'ALBUMARTIST', 'ALBUM ARTIST']
                for key in album_artist_keys:
                    if key in tags and tags[key]:
                        metadata['album_artist'] = str(tags[key][0]).strip()
                        if metadata['album_artist']:
                            print(f"앨범 아티스트 추출됨 ({key}): {metadata['album_artist']}")
                            break
            
            # 기본값 설정
            if not metadata['title']:
                metadata['title'] = filename
            if not metadata['artist']:
                metadata['artist'] = 'Unknown Artist'
            if not metadata['album']:
                metadata['album'] = 'Unknown Album'
            if not metadata['album_artist']:
                metadata['album_artist'] = metadata['artist']
            
            # 앨범 커버 추출
            metadata['cover_art'] = MetadataParser.extract_cover_art(audio_file)
            
            print(f"최종 메타데이터: {metadata}")
            return metadata
            
        except Exception as e:
            print(f"메타데이터 추출 오류: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    @staticmethod
    def extract_cover_art(audio_file):
        """앨범 커버 아트 추출"""
        try:
            if hasattr(audio_file, 'tags') and audio_file.tags:
                # APIC 태그에서 커버 추출
                for key in audio_file.tags.keys():
                    if key.startswith('APIC'):
                        apic = audio_file.tags[key]
                        if apic.data:
                            # 이미지를 base64로 인코딩
                            image_data = base64.b64encode(apic.data).decode('utf-8')
                            return f"data:{apic.mime};base64,{image_data}"
                
                # 다른 형식의 커버 아트 시도
                for tag_name in ['COVERART', 'PICTURE']:
                    if tag_name in audio_file.tags:
                        cover_data = audio_file.tags[tag_name]
                        if isinstance(cover_data, bytes):
                            image_data = base64.b64encode(cover_data).decode('utf-8')
                            return f"data:image/jpeg;base64,{image_data}"
            
            return None
            
        except Exception as e:
            print(f"커버 아트 추출 오류: {e}")
            return None
    
    @staticmethod
    def format_duration(seconds):
        """초를 MM:SS 형식으로 변환"""
        if not seconds:
            return "0:00"
        
        minutes = int(seconds // 60)
        seconds = int(seconds % 60)
        return f"{minutes}:{seconds:02d}"
    
    @staticmethod
    def sanitize_filename(filename):
        """파일명에서 특수문자 제거"""
        import re
        # 허용되지 않는 문자들을 언더스코어로 대체
        sanitized = re.sub(r'[<>:"/\\|?*]', '_', filename)
        # 연속된 언더스코어를 하나로 통합
        sanitized = re.sub(r'_+', '_', sanitized)
        return sanitized.strip('_')
