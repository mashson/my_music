// 유틸리티 함수들
const utils = {
    // 디바운스 함수
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // HTML 이스케이프
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // 시간 포맷팅
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    // 성공 메시지 표시
    showSuccess(message) {
        this.showMessage(message, 'success');
    },

    // 오류 메시지 표시
    showError(message) {
        this.showMessage(message, 'error');
    },

    // 메시지 표시
    showMessage(message, type) {
        // 기존 메시지 제거
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // 새 메시지 생성
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        
        // 스타일 적용
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            ${type === 'success' ? 'background: #28a745;' : 'background: #dc3545;'}
        `;

        document.body.appendChild(messageDiv);

        // 3초 후 자동 제거
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }
};

// 메인 애플리케이션 클래스
class MusicApp {
    constructor() {
        console.log('MusicApp 생성자 시작');
        this.currentView = 'albums'; // 'albums', 'tracks', 'search'
        this.currentAlbum = null;
        this.albums = [];
        this.tracks = [];
        this.searchResults = [];
        this.isLoading = false;
        
        console.log('MusicApp 속성 초기화 완료');
        this.initializeElements();
        console.log('요소 초기화 완료');
        this.bindEvents();
        console.log('이벤트 바인딩 완료');
        this.loadData();
        console.log('데이터 로드 시작');
    }

    initializeElements() {
        console.log('요소 초기화 시작');
        // 뷰 요소들
        this.albumView = document.getElementById('albumView');
        this.trackView = document.getElementById('trackView');
        this.searchResults = document.getElementById('searchResults');
        this.emptyState = document.getElementById('emptyState');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        
        console.log('뷰 요소들 초기화 완료');

        // 헤더 요소들
        this.searchInput = document.getElementById('searchInput');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.addAlbumBtn = document.getElementById('addAlbumBtn');
        this.viewToggleBtn = document.getElementById('viewToggleBtn');
        this.headerControls = document.querySelector('.header-controls');

        // 앨범 관련 요소들
        this.albumGrid = document.getElementById('albumGrid');
        this.albumCount = document.getElementById('albumCount');
        this.currentAlbumTitle = document.getElementById('currentAlbumTitle');
        this.backToAlbumsBtn = document.getElementById('backToAlbumsBtn');

        // 트랙 관련 요소들
        this.trackList = document.getElementById('trackList');
        this.searchTrackList = document.getElementById('searchTrackList');
        this.searchCount = document.getElementById('searchCount');

        // 업로드 모달 요소들
        this.uploadModal = document.getElementById('uploadModal');
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.selectFilesBtn = document.getElementById('selectFilesBtn');
        this.closeUploadModal = document.getElementById('closeUploadModal');
        this.uploadProgress = document.getElementById('uploadProgress');
        this.uploadStatus = document.getElementById('uploadStatus');
        this.uploadPercentage = document.getElementById('uploadPercentage');
        this.uploadProgressBar = document.getElementById('uploadProgressBar');
        this.uploadResults = document.getElementById('uploadResults');
        this.emptyStateUploadBtn = document.getElementById('emptyStateUploadBtn');

        // 편집 모달 요소들
        this.editModal = document.getElementById('editModal');
        this.editForm = document.getElementById('editForm');
        this.closeEditModal = document.getElementById('closeEditModal');
        this.cancelEditBtn = document.getElementById('cancelEditBtn');
        this.editTitle = document.getElementById('editTitle');
        this.editArtist = document.getElementById('editArtist');
        this.editAlbum = document.getElementById('editAlbum');
        this.editYear = document.getElementById('editYear');
        this.editGenre = document.getElementById('editGenre');
        this.editTrackNumber = document.getElementById('editTrackNumber');

        // 앨범 관리 모달 요소들
        this.addAlbumModal = document.getElementById('addAlbumModal');
        this.addAlbumForm = document.getElementById('addAlbumForm');
        this.closeAddAlbumModal = document.getElementById('closeAddAlbumModal');
        this.cancelAddAlbumBtn = document.getElementById('cancelAddAlbumBtn');
        this.addAlbumName = document.getElementById('addAlbumName');
        this.addAlbumArtist = document.getElementById('addAlbumArtist');
        this.addAlbumYear = document.getElementById('addAlbumYear');
        this.addAlbumGenre = document.getElementById('addAlbumGenre');

        this.editAlbumModal = document.getElementById('editAlbumModal');
        this.editAlbumForm = document.getElementById('editAlbumForm');
        this.closeEditAlbumModal = document.getElementById('closeEditAlbumModal');
        this.cancelEditAlbumBtn = document.getElementById('cancelEditAlbumBtn');
        this.editAlbumName = document.getElementById('editAlbumName');
        this.editAlbumArtist = document.getElementById('editAlbumArtist');
        this.editAlbumYear = document.getElementById('editAlbumYear');
        this.editAlbumGenre = document.getElementById('editAlbumGenre');
    }

    bindEvents() {
        // 검색 이벤트
        this.searchInput.addEventListener('input', utils.debounce((e) => {
            this.handleSearch(e.target.value);
        }, 300));

        // 업로드 이벤트
        this.uploadBtn.addEventListener('click', () => this.showUploadModal());
        this.emptyStateUploadBtn.addEventListener('click', () => this.showUploadModal());
        
        // 앨범 관리 이벤트
        this.addAlbumBtn.addEventListener('click', () => this.showAddAlbumModal());
        this.closeUploadModal.addEventListener('click', () => this.hideUploadModal());
        this.selectFilesBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));

        // 드래그 앤 드롭 이벤트
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });
        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });
        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            this.handleFileSelect(e.dataTransfer.files);
        });

        // 뷰 토글 이벤트
        this.viewToggleBtn.addEventListener('click', () => this.toggleView());
        this.backToAlbumsBtn.addEventListener('click', () => this.showAlbumsView());

        // 편집 모달 이벤트
        this.closeEditModal.addEventListener('click', () => this.hideEditModal());
        this.cancelEditBtn.addEventListener('click', () => this.hideEditModal());
        this.editForm.addEventListener('submit', (e) => this.handleEditSubmit(e));

        // 앨범 관리 모달 이벤트
        this.closeAddAlbumModal.addEventListener('click', () => this.hideAddAlbumModal());
        this.cancelAddAlbumBtn.addEventListener('click', () => this.hideAddAlbumModal());
        this.addAlbumForm.addEventListener('submit', (e) => this.handleAddAlbumSubmit(e));

        this.closeEditAlbumModal.addEventListener('click', () => this.hideEditAlbumModal());
        this.cancelEditAlbumBtn.addEventListener('click', () => this.hideEditAlbumModal());
        this.editAlbumForm.addEventListener('submit', (e) => this.handleEditAlbumSubmit(e));

        // 메타데이터 새로고침 버튼 추가
        this.addRefreshButton();

        // 모달 배경 클릭 이벤트
        this.uploadModal.addEventListener('click', (e) => {
            if (e.target === this.uploadModal) this.hideUploadModal();
        });
        this.editModal.addEventListener('click', (e) => {
            if (e.target === this.editModal) this.hideEditModal();
        });
        this.addAlbumModal.addEventListener('click', (e) => {
            if (e.target === this.addAlbumModal) this.hideAddAlbumModal();
        });
        this.editAlbumModal.addEventListener('click', (e) => {
            if (e.target === this.editAlbumModal) this.hideEditAlbumModal();
        });
    }

    // 데이터 로드
    async loadData() {
        try {
            console.log('데이터 로드 시작');
            this.showLoading(true);
            
            // 캐시 방지를 위한 타임스탬프 추가
            const timestamp = new Date().getTime();
            console.log('API 요청 시작:', timestamp);
            
            const [albumsResponse, tracksResponse] = await Promise.all([
                musicAPI.get(`/api/albums?t=${timestamp}`),
                musicAPI.get(`/api/tracks?t=${timestamp}`)
            ]);

            console.log('로드된 앨범 데이터:', albumsResponse);
            console.log('로드된 트랙 데이터:', tracksResponse);

            if (albumsResponse.success) {
                this.albums = albumsResponse.albums;
                console.log('앨범 렌더링 시작, 앨범 수:', this.albums.length);
                this.renderAlbums();
            } else {
                console.error('앨범 데이터 로드 실패:', albumsResponse);
            }

            if (tracksResponse.success) {
                this.tracks = tracksResponse.tracks;
                console.log('트랙 데이터 로드 완료, 트랙 수:', this.tracks.length);
            } else {
                console.error('트랙 데이터 로드 실패:', tracksResponse);
            }

            this.updateEmptyState();
            this.showLoading(false);
            console.log('데이터 로드 완료');

        } catch (error) {
            console.error('데이터 로드 오류:', error);
            utils.showError('데이터를 불러오는 중 오류가 발생했습니다.');
            this.showLoading(false);
        }
    }

    // 앨범 렌더링
    renderAlbums() {
        console.log('renderAlbums 호출됨, 앨범 수:', this.albums.length);
        this.albumGrid.innerHTML = '';
        this.albumCount.textContent = `${this.albums.length}개 앨범`;

        if (this.albums.length === 0) {
            console.log('앨범이 없어서 빈 상태 표시');
            this.showEmptyState();
            return;
        }

        console.log('앨범 카드 생성 시작');
        this.albums.forEach((album, index) => {
            console.log(`앨범 ${index + 1} 생성:`, album.name);
            const albumCard = this.createAlbumCard(album);
            this.albumGrid.appendChild(albumCard);
        });
        console.log('앨범 렌더링 완료');
    }

    // 앨범 카드 생성
    createAlbumCard(album) {
        const card = document.createElement('div');
        card.className = 'album-card';
        card.addEventListener('click', () => this.showAlbumTracks(album));

        const coverHtml = album.cover_art ? 
            `<img src="${album.cover_art}" alt="${album.name}">` : 
            '<i class="fas fa-music"></i>';

        card.innerHTML = `
            <div class="album-actions">
                <button class="album-action-btn edit-album" data-album-id="${album.id}" title="앨범 편집">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="album-action-btn delete-album" data-album-id="${album.id}" title="앨범 삭제">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="album-cover">
                ${coverHtml}
            </div>
            <div class="album-title">${utils.escapeHtml(album.name)}</div>
            <div class="album-artist">${utils.escapeHtml(album.artist)}</div>
            <div class="album-info">
                ${album.year ? `${album.year} • ` : ''}${album.track_count}곡
            </div>
        `;

        // 액션 버튼 이벤트 리스너 추가
        const editBtn = card.querySelector('.edit-album');
        const deleteBtn = card.querySelector('.delete-album');

        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.editAlbum(album.id);
        });

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteAlbum(album.id);
        });

        return card;
    }

    // 앨범 트랙 보기
    showAlbumTracks(album) {
        this.currentAlbum = album;
        this.currentAlbumTitle.textContent = album.name;
        this.renderAlbumTracks(album.tracks);
        this.showTracksView();
    }

    // 앨범 트랙 렌더링
    renderAlbumTracks(tracks) {
        this.trackList.innerHTML = '';

        tracks.forEach((track, index) => {
            const trackItem = this.createTrackItem(track, index + 1);
            this.trackList.appendChild(trackItem);
        });
    }

    // 트랙 아이템 생성
    createTrackItem(track, trackNumber = null) {
        const item = document.createElement('div');
        item.className = 'track-item';
        item.addEventListener('click', () => this.playTrack(track));

        const coverHtml = track.cover_art ? 
            `<img src="${track.cover_art}" alt="${track.title}">` : 
            '<i class="fas fa-music"></i>';

        const numberDisplay = trackNumber ? 
            `<div class="track-number">${trackNumber}</div>` : '';

        item.innerHTML = `
            ${numberDisplay}
            <div class="track-cover">
                ${coverHtml}
            </div>
            <div class="track-info">
                <div class="track-title">${utils.escapeHtml(track.title)}</div>
                <div class="track-artist">${utils.escapeHtml(track.artist)}</div>
            </div>
            <div class="track-duration">${utils.formatTime(track.duration)}</div>
            <div class="track-actions">
                <button class="track-action-btn add-to-queue" data-track-id="${track.id}" title="큐에 추가">
                    <i class="fas fa-plus"></i>
                </button>
                <button class="track-action-btn edit-track" data-track-id="${track.id}" title="편집">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="track-action-btn delete-track" data-track-id="${track.id}" title="삭제">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // 이벤트 리스너 추가
        const addToQueueBtn = item.querySelector('.add-to-queue');
        const editBtn = item.querySelector('.edit-track');
        const deleteBtn = item.querySelector('.delete-track');

        addToQueueBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.addToQueue(track.id);
        });

        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.editTrack(track.id);
        });

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteTrack(track.id);
        });

        return item;
    }

    // 트랙 재생
    playTrack(track) {
        audioPlayer.playTrack(track);
    }

    // 큐에 추가
    addToQueue(trackId) {
        const track = this.tracks.find(t => t.id === trackId);
        if (track) {
            audioPlayer.addToQueue(track);
        }
    }

    // 트랙 편집
    editTrack(trackId) {
        const track = this.tracks.find(t => t.id === trackId);
        if (!track) return;

        this.editTitle.value = track.title;
        this.editArtist.value = track.artist;
        this.editAlbum.value = track.album;
        this.editYear.value = track.year || '';
        this.editGenre.value = track.genre || '';
        this.editTrackNumber.value = track.track_number || '';

        this.editForm.dataset.trackId = trackId;
        this.showEditModal();
    }

    // 트랙 삭제
    async deleteTrack(trackId) {
        console.log('삭제 요청:', trackId);
        
        if (!confirm('정말로 이 트랙을 삭제하시겠습니까?')) return;

        try {
            console.log('삭제 API 호출 시작');
            const response = await musicAPI.deleteTrack(trackId);
            console.log('삭제 API 응답:', response);
            
            if (response.success) {
                utils.showSuccess('트랙이 삭제되었습니다.');
                this.loadData(); // 데이터 다시 로드
            } else {
                utils.showError(response.error || '삭제 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('삭제 오류:', error);
            utils.showError('삭제 중 오류가 발생했습니다.');
        }
    }

    // 검색 처리
    async handleSearch(query) {
        if (!query.trim()) {
            this.hideSearchResults();
            return;
        }

        try {
            const response = await musicAPI.searchTracks(query);
            if (response.success) {
                this.searchResults = response.tracks;
                this.renderSearchResults();
                this.showSearchResults();
            }
        } catch (error) {
            console.error('검색 오류:', error);
            utils.showError('검색 중 오류가 발생했습니다.');
        }
    }

    // 검색 결과 렌더링
    renderSearchResults() {
        this.searchTrackList.innerHTML = '';
        this.searchCount.textContent = `${this.searchResults.length}개 결과`;

        this.searchResults.forEach(track => {
            const trackItem = this.createTrackItem(track);
            this.searchTrackList.appendChild(trackItem);
        });
    }

    // 뷰 전환
    showAlbumsView() {
        this.currentView = 'albums';
        this.albumView.style.display = 'block';
        this.trackView.style.display = 'none';
        this.searchResults.style.display = 'none';
        this.viewToggleBtn.innerHTML = '<i class="fas fa-th"></i> 앨범 뷰';
    }

    showTracksView() {
        this.currentView = 'tracks';
        this.albumView.style.display = 'none';
        this.trackView.style.display = 'block';
        this.searchResults.style.display = 'none';
        this.viewToggleBtn.innerHTML = '<i class="fas fa-list"></i> 트랙 뷰';
    }

    showSearchResults() {
        this.currentView = 'search';
        this.albumView.style.display = 'none';
        this.trackView.style.display = 'none';
        this.searchResults.style.display = 'block';
    }

    hideSearchResults() {
        if (this.currentView === 'search') {
            this.showAlbumsView();
        }
    }

    toggleView() {
        if (this.currentView === 'albums') {
            this.showTracksView();
        } else {
            this.showAlbumsView();
        }
    }

    // 업로드 모달
    showUploadModal() {
        this.uploadModal.classList.add('show');
        this.resetUploadForm();
    }

    hideUploadModal() {
        this.uploadModal.classList.remove('show');
    }

    resetUploadForm() {
        this.fileInput.value = '';
        this.uploadProgress.style.display = 'none';
        this.uploadResults.style.display = 'none';
        this.uploadArea.style.display = 'block';
    }

    // 파일 선택 처리
    handleFileSelect(files) {
        if (files.length === 0) return;

        const validFiles = Array.from(files).filter(file => {
            const extension = file.name.split('.').pop().toLowerCase();
            return ['mp3', 'wav', 'flac', 'm4a'].includes(extension);
        });

        if (validFiles.length === 0) {
            utils.showError('지원되지 않는 파일 형식입니다.');
            return;
        }

        this.uploadFiles(validFiles);
    }

    // 파일 업로드
    async uploadFiles(files) {
        this.uploadArea.style.display = 'none';
        this.uploadProgress.style.display = 'block';
        this.uploadResults.style.display = 'none';

        const results = [];
        let completed = 0;

        for (const file of files) {
            try {
                this.uploadStatus.textContent = `업로드 중: ${file.name}`;
                
                const response = await musicAPI.uploadTrack(file, (progress) => {
                    this.uploadPercentage.textContent = `${Math.round(progress)}%`;
                    this.uploadProgressBar.style.width = `${progress}%`;
                });

                if (response.success) {
                    results.push({ success: true, track: response.track, file: file.name });
                } else {
                    results.push({ success: false, error: response.error, file: file.name });
                }
            } catch (error) {
                results.push({ success: false, error: error.message, file: file.name });
            }

            completed++;
            const overallProgress = (completed / files.length) * 100;
            this.uploadPercentage.textContent = `${Math.round(overallProgress)}%`;
            this.uploadProgressBar.style.width = `${overallProgress}%`;
        }

        this.showUploadResults(results);
    }

    // 업로드 결과 표시
    showUploadResults(results) {
        this.uploadProgress.style.display = 'none';
        this.uploadResults.style.display = 'block';

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        let html = `
            <div class="upload-summary">
                <h4>업로드 완료</h4>
                <p>성공: ${successCount}개, 실패: ${failCount}개</p>
            </div>
        `;

        results.forEach(result => {
            if (result.success) {
                html += `
                    <div class="upload-result success">
                        <i class="fas fa-check"></i>
                        <span>${result.file} - ${result.track.title}</span>
                    </div>
                `;
            } else {
                html += `
                    <div class="upload-result error">
                        <i class="fas fa-times"></i>
                        <span>${result.file} - ${result.error}</span>
                    </div>
                `;
            }
        });

        this.uploadResults.innerHTML = html;

        if (successCount > 0) {
            setTimeout(() => {
                this.loadData(); // 데이터 다시 로드
                this.hideUploadModal();
            }, 2000);
        }
    }

    // 편집 모달
    showEditModal() {
        this.editModal.classList.add('show');
    }

    hideEditModal() {
        this.editModal.classList.remove('show');
    }

    // 편집 폼 제출
    async handleEditSubmit(e) {
        e.preventDefault();
        
        const trackId = this.editForm.dataset.trackId;
        const updates = {
            title: this.editTitle.value,
            artist: this.editArtist.value,
            album: this.editAlbum.value,
            year: this.editYear.value,
            genre: this.editGenre.value,
            track_number: this.editTrackNumber.value
        };

        try {
            const response = await musicAPI.updateTrack(trackId, updates);
            if (response.success) {
                utils.showSuccess('트랙 정보가 업데이트되었습니다.');
                this.hideEditModal();
                this.loadData(); // 데이터 다시 로드
            } else {
                utils.showError(response.error || '업데이트 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('업데이트 오류:', error);
            utils.showError('업데이트 중 오류가 발생했습니다.');
        }
    }

    // 빈 상태 표시
    showEmptyState() {
        this.emptyState.style.display = 'block';
    }

    updateEmptyState() {
        const hasData = this.albums.length > 0 || this.tracks.length > 0;
        this.emptyState.style.display = hasData ? 'none' : 'block';
    }

    // 로딩 표시
    showLoading(show) {
        this.loadingIndicator.style.display = show ? 'flex' : 'none';
    }

    // 메타데이터 새로고침 버튼 추가
    addRefreshButton() {
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'btn btn-secondary';
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> 메타데이터 새로고침';
        refreshBtn.addEventListener('click', () => this.refreshAllMetadata());
        
        const forceRefreshBtn = document.createElement('button');
        forceRefreshBtn.className = 'btn btn-secondary';
        forceRefreshBtn.innerHTML = '<i class="fas fa-refresh"></i> 강제 새로고침';
        forceRefreshBtn.addEventListener('click', () => this.forceRefresh());
        
        // 헤더 컨트롤에 추가
        this.headerControls.appendChild(refreshBtn);
        this.headerControls.appendChild(forceRefreshBtn);
    }

    // 강제 새로고침
    forceRefresh() {
        console.log('강제 새로고침 시작');
        // 로컬 스토리지 클리어
        localStorage.clear();
        // 페이지 새로고침
        window.location.reload(true);
    }

    // 모든 메타데이터 새로고침
    async refreshAllMetadata() {
        if (!confirm('모든 트랙의 메타데이터를 다시 추출하시겠습니까?')) return;

        try {
            console.log('메타데이터 새로고침 시작');
            this.showLoading(true);
            
            // musicAPI 객체 확인
            if (typeof musicAPI === 'undefined') {
                console.error('musicAPI가 정의되지 않았습니다');
                utils.showError('API 객체를 찾을 수 없습니다.');
                return;
            }
            
            console.log('API 요청 시작');
            const response = await musicAPI.post('/api/refresh-all-metadata');
            console.log('API 응답:', response);
            
            if (response.success) {
                utils.showSuccess('메타데이터가 새로고침되었습니다.');
                this.loadData(); // 데이터 다시 로드
            } else {
                utils.showError(response.error || '메타데이터 새로고침 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('메타데이터 새로고침 오류:', error);
            utils.showError('메타데이터 새로고침 중 오류가 발생했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    // 앨범 관리 메서드들
    showAddAlbumModal() {
        this.addAlbumModal.classList.add('show');
        this.resetAddAlbumForm();
    }

    hideAddAlbumModal() {
        this.addAlbumModal.classList.remove('show');
    }

    resetAddAlbumForm() {
        this.addAlbumForm.reset();
    }

    async handleAddAlbumSubmit(e) {
        e.preventDefault();
        
        const albumData = {
            name: this.addAlbumName.value.trim(),
            artist: this.addAlbumArtist.value.trim(),
            year: this.addAlbumYear.value.trim(),
            genre: this.addAlbumGenre.value.trim()
        };

        if (!albumData.name || !albumData.artist) {
            utils.showError('앨범명과 아티스트는 필수입니다.');
            return;
        }

        try {
            const response = await musicAPI.createAlbum(albumData);
            if (response.success) {
                utils.showSuccess('앨범이 생성되었습니다.');
                this.hideAddAlbumModal();
                this.loadData(); // 데이터 다시 로드
            } else {
                utils.showError(response.error || '앨범 생성 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('앨범 생성 오류:', error);
            utils.showError('앨범 생성 중 오류가 발생했습니다.');
        }
    }

    editAlbum(albumId) {
        const album = this.albums.find(a => a.id === albumId);
        if (!album) return;

        this.editAlbumName.value = album.name;
        this.editAlbumArtist.value = album.artist;
        this.editAlbumYear.value = album.year || '';
        this.editAlbumGenre.value = album.genre || '';

        this.editAlbumForm.dataset.albumId = albumId;
        this.showEditAlbumModal();
    }

    showEditAlbumModal() {
        this.editAlbumModal.classList.add('show');
    }

    hideEditAlbumModal() {
        this.editAlbumModal.classList.remove('show');
    }

    async handleEditAlbumSubmit(e) {
        e.preventDefault();
        
        const albumId = this.editAlbumForm.dataset.albumId;
        const updates = {
            name: this.editAlbumName.value.trim(),
            artist: this.editAlbumArtist.value.trim(),
            year: this.editAlbumYear.value.trim(),
            genre: this.editAlbumGenre.value.trim()
        };

        if (!updates.name || !updates.artist) {
            utils.showError('앨범명과 아티스트는 필수입니다.');
            return;
        }

        try {
            const response = await musicAPI.updateAlbum(albumId, updates);
            if (response.success) {
                utils.showSuccess('앨범 정보가 업데이트되었습니다.');
                this.hideEditAlbumModal();
                this.loadData(); // 데이터 다시 로드
            } else {
                utils.showError(response.error || '앨범 업데이트 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('앨범 업데이트 오류:', error);
            utils.showError('앨범 업데이트 중 오류가 발생했습니다.');
        }
    }

    async deleteAlbum(albumId) {
        const album = this.albums.find(a => a.id === albumId);
        if (!album) return;

        if (album.track_count > 0) {
            utils.showError('트랙이 있는 앨범은 삭제할 수 없습니다. 먼저 모든 트랙을 삭제해주세요.');
            return;
        }

        if (!confirm(`"${album.name}" 앨범을 삭제하시겠습니까?`)) return;

        try {
            const response = await musicAPI.deleteAlbum(albumId);
            if (response.success) {
                utils.showSuccess('앨범이 삭제되었습니다.');
                this.loadData(); // 데이터 다시 로드
            } else {
                utils.showError(response.error || '앨범 삭제 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('앨범 삭제 오류:', error);
            utils.showError('앨범 삭제 중 오류가 발생했습니다.');
        }
    }
}

// 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('DOM 로드 완료, 앱 초기화 시작');
        
        // musicAPI가 정의되어 있는지 확인
        if (typeof musicAPI === 'undefined') {
            console.error('musicAPI가 정의되지 않았습니다. js/api.js 파일을 확인하세요.');
            return;
        }
        
        const musicApp = new MusicApp();
        console.log('MusicApp 인스턴스 생성 완료');
        
        audioPlayer.initialize();
        console.log('AudioPlayer 초기화 완료');
        
        // 전역 변수로 설정 (HTML에서 접근 가능하도록)
        window.musicApp = musicApp;
        window.audioPlayer = audioPlayer;
        console.log('전역 변수 설정 완료');
        
    } catch (error) {
        console.error('앱 초기화 오류:', error);
        console.error('오류 스택:', error.stack);
    }
});
