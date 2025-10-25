# 나만의 음악 앨범 책장

개인 음악 파일(mp3, wav, flac)을 웹에서 재생하고 관리할 수 있는 앨범 책장 웹사이트입니다.

## 주요 기능

### 🎵 음악 재생
- MP3, WAV, FLAC, M4A 파일 지원
- 앨범 커버 자동 추출 및 표시
- 재생/일시정지, 이전곡/다음곡
- 진행 바를 통한 탐색
- 볼륨 조절 및 음소거
- 셔플 및 반복 재생

### 📚 앨범 관리
- 앨범별 그리드 뷰
- 트랙 번호 순 정렬
- 앨범 정보 자동 추출 (제목, 아티스트, 년도, 장르)
- 앨범 커버 이미지 표시

### 🔍 검색 및 필터링
- 실시간 검색 (제목, 아티스트, 앨범, 장르)
- 검색 결과 하이라이트

### 📝 트랙 관리
- 음악 파일 업로드 (드래그 앤 드롭 지원)
- 트랙 메타데이터 편집
- 트랙 삭제
- 재생 큐 관리

### ⭐ 추가 기능
- 즐겨찾기 (로컬 스토리지 저장)
- 재생 히스토리 저장
- 키보드 단축키 지원
- 반응형 디자인

## 기술 스택

### 백엔드
- **Python Flask**: 웹 프레임워크
- **mutagen**: 음악 메타데이터 추출
- **Pillow**: 이미지 처리
- **Flask-CORS**: CORS 처리

### 프론트엔드
- **Vanilla JavaScript**: 순수 JavaScript
- **HTML5**: 마크업
- **CSS3**: 스타일링 및 애니메이션
- **Font Awesome**: 아이콘

## 설치 및 실행

### 1. 저장소 클론
```bash
git clone <repository-url>
cd my_music
```

### 2. Python 가상환경 생성 및 활성화
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. 의존성 설치
```bash
pip install -r requirements.txt
```

### 4. 애플리케이션 실행
```bash
python app.py
```

### 5. 웹 브라우저에서 접속
```
http://localhost:5000
```

## 프로젝트 구조

```
my_music/
├── app.py                 # Flask 메인 애플리케이션
├── music_manager.py       # 음악 파일 관리 로직
├── metadata_parser.py     # 메타데이터 추출 모듈
├── requirements.txt       # Python 의존성
├── music_metadata.json   # 메타데이터 저장 파일 (자동 생성)
├── uploads/              # 업로드된 음악 파일 저장소
├── index.html            # 메인 HTML 페이지
├── css/
│   └── style.css         # 스타일시트
├── js/
│   ├── api.js           # API 통신 모듈
│   ├── player.js        # 오디오 플레이어
│   └── app.js           # 메인 애플리케이션 로직
└── README.md            # 프로젝트 문서
```

## API 엔드포인트

### 앨범 관련
- `GET /api/albums` - 모든 앨범 목록
- `GET /api/albums/<album_id>/tracks` - 특정 앨범의 트랙 목록

### 트랙 관련
- `GET /api/tracks` - 모든 트랙 목록
- `GET /api/tracks/<track_id>` - 특정 트랙 정보
- `GET /api/stream/<track_id>` - 트랙 스트리밍
- `POST /api/upload` - 음악 파일 업로드
- `PUT /api/tracks/<track_id>` - 트랙 정보 수정
- `DELETE /api/tracks/<track_id>` - 트랙 삭제

### 기타
- `GET /api/search?q=<query>` - 트랙 검색
- `GET /api/health` - 헬스 체크

## 사용법

### 음악 파일 업로드
1. "음악 추가" 버튼 클릭
2. 파일 선택 또는 드래그 앤 드롭
3. 업로드 진행 상황 확인
4. 완료 후 자동으로 앨범에 추가

### 음악 재생
1. 앨범 카드 클릭하여 트랙 목록 보기
2. 트랙 클릭하여 재생
3. 하단 플레이어로 재생 제어

### 트랙 편집
1. 트랙 옆 편집 버튼 클릭
2. 메타데이터 수정
3. 저장 버튼 클릭

### 검색
- 상단 검색바에 키워드 입력
- 실시간으로 결과 표시

## 키보드 단축키

- `Space`: 재생/일시정지
- `←`: 10초 뒤로
- `→`: 10초 앞으로
- `↑`: 볼륨 증가
- `↓`: 볼륨 감소

## 배포

### 백엔드 배포 (Render/Railway/Fly.io)
1. GitHub 저장소 연결
2. 환경변수 설정
3. 자동 배포 설정

### 프론트엔드 배포 (GitHub Pages/Vercel/Netlify)
1. 정적 파일 업로드
2. 백엔드 API URL 설정
3. 도메인 연결

## 환경변수

```bash
FLASK_ENV=production
FLASK_DEBUG=False
MAX_CONTENT_LENGTH=104857600  # 100MB
```

## 라이선스

MIT License

## 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 문제 해결

### 일반적인 문제

**Q: 음악 파일이 재생되지 않아요**
A: 브라우저가 해당 오디오 형식을 지원하는지 확인하세요. MP3는 가장 호환성이 좋습니다.

**Q: 업로드가 실패해요**
A: 파일 크기가 100MB를 초과하지 않는지, 지원되는 형식인지 확인하세요.

**Q: 메타데이터가 제대로 표시되지 않아요**
A: 음악 파일에 메타데이터가 포함되어 있는지 확인하세요. 일부 파일은 메타데이터가 없을 수 있습니다.

## 향후 계획

- [ ] 사용자 인증 시스템
- [ ] 플레이리스트 기능
- [ ] 음악 추천 시스템
- [ ] 소셜 기능 (공유, 댓글)
- [ ] 모바일 앱 개발
- [ ] 클라우드 스토리지 연동
