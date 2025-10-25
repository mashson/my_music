// 오디오 플레이어 클래스
class AudioPlayer {
    constructor() {
        this.audio = document.getElementById('audioElement');
        this.currentTrack = null;
        this.queue = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.isShuffled = false;
        this.isRepeated = false;
        this.volume = 0.7;
        this.favorites = utils.loadFavorites();
        
        this.initializeElements();
        this.bindEvents();
        this.loadSavedState();
    }

    initializeElements() {
        // 플레이어 컨트롤 요소들
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.shuffleBtn = document.getElementById('shuffleBtn');
        this.repeatBtn = document.getElementById('repeatBtn');
        this.muteBtn = document.getElementById('muteBtn');
        this.queueBtn = document.getElementById('queueBtn');
        this.favoriteBtn = document.getElementById('favoriteBtn');

        // 진행 바 요소들
        this.progressBar = document.getElementById('progressBar');
        this.progressSlider = document.getElementById('progressSlider');
        this.currentTimeEl = document.getElementById('currentTime');
        this.totalTimeEl = document.getElementById('totalTime');

        // 볼륨 요소들
        this.volumeSlider = document.getElementById('volumeSlider');

        // 트랙 정보 요소들
        this.playerCover = document.getElementById('playerCover');
        this.playerTitle = document.getElementById('playerTitle');
        this.playerArtist = document.getElementById('playerArtist');

        // 큐 모달
        this.queueModal = document.getElementById('queueModal');
        this.queueList = document.getElementById('queueList');
    }

    bindEvents() {
        // 플레이어 컨트롤 이벤트
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.prevBtn.addEventListener('click', () => this.previousTrack());
        this.nextBtn.addEventListener('click', () => this.nextTrack());
        this.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        this.repeatBtn.addEventListener('click', () => this.toggleRepeat());
        this.muteBtn.addEventListener('click', () => this.toggleMute());
        this.queueBtn.addEventListener('click', () => this.showQueue());
        this.favoriteBtn.addEventListener('click', () => this.toggleFavorite());

        // 진행 바 이벤트
        this.progressSlider.addEventListener('input', (e) => this.seekTo(e.target.value));
        this.progressSlider.addEventListener('change', (e) => this.seekTo(e.target.value));

        // 볼륨 이벤트
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value / 100));

        // 오디오 이벤트
        this.audio.addEventListener('loadedmetadata', () => this.onLoadedMetadata());
        this.audio.addEventListener('timeupdate', () => this.onTimeUpdate());
        this.audio.addEventListener('ended', () => this.onTrackEnded());
        this.audio.addEventListener('error', (e) => this.onError(e));

        // 큐 모달 이벤트
        document.getElementById('closeQueueModal').addEventListener('click', () => this.hideQueue());
        this.queueModal.addEventListener('click', (e) => {
            if (e.target === this.queueModal) this.hideQueue();
        });

        // 키보드 단축키
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    // 트랙 재생
    async playTrack(track, addToQueue = true) {
        try {
            if (!track) {
                console.error('트랙이 없습니다');
                return;
            }

            console.log('재생 시작:', track.title);
            this.currentTrack = track;
            
            if (addToQueue && !this.queue.some(t => t.id === track.id)) {
                this.queue.push(track);
                this.currentIndex = this.queue.length - 1;
            }

            const streamURL = musicAPI.getStreamURL(track.id);
            console.log('스트림 URL:', streamURL);
            
            // 기존 오디오 정리
            this.audio.pause();
            this.audio.src = '';
            
            // 새 오디오 로드
            this.audio.src = streamURL;
            this.audio.load();
            
            // 재생 시도
            const playPromise = this.audio.play();
            
            if (playPromise !== undefined) {
                await playPromise;
            }
            
            this.isPlaying = true;
            this.updatePlayPauseButton();
            this.updateTrackInfo();
            this.updateQueue();
            this.saveCurrentState();
            
            utils.showSuccess(`${track.title} 재생 시작`);
            
        } catch (error) {
            console.error('재생 오류:', error);
            console.error('오디오 상태:', {
                src: this.audio.src,
                readyState: this.audio.readyState,
                error: this.audio.error
            });
            utils.showError('재생 중 오류가 발생했습니다.');
        }
    }

    // 재생/일시정지 토글
    async togglePlayPause() {
        try {
            if (!this.currentTrack) return;

            if (this.isPlaying) {
                this.audio.pause();
                this.isPlaying = false;
            } else {
                await this.audio.play();
                this.isPlaying = true;
            }
            
            this.updatePlayPauseButton();
            this.saveCurrentState();
            
        } catch (error) {
            console.error('재생/일시정지 오류:', error);
            utils.showError('재생 중 오류가 발생했습니다.');
        }
    }

    // 이전 트랙
    previousTrack() {
        if (this.queue.length === 0) return;
        
        this.currentIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.queue.length - 1;
        const track = this.queue[this.currentIndex];
        this.playTrack(track, false);
    }

    // 다음 트랙
    nextTrack() {
        if (this.queue.length === 0) return;
        
        if (this.isShuffled) {
            this.currentIndex = Math.floor(Math.random() * this.queue.length);
        } else {
            this.currentIndex = this.currentIndex < this.queue.length - 1 ? this.currentIndex + 1 : 0;
        }
        
        const track = this.queue[this.currentIndex];
        this.playTrack(track, false);
    }

    // 셔플 토글
    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        this.shuffleBtn.classList.toggle('active', this.isShuffled);
        this.shuffleBtn.querySelector('i').style.color = this.isShuffled ? '#667eea' : '#666';
    }

    // 반복 토글
    toggleRepeat() {
        this.isRepeated = !this.isRepeated;
        this.repeatBtn.classList.toggle('active', this.isRepeated);
        this.repeatBtn.querySelector('i').style.color = this.isRepeated ? '#667eea' : '#666';
    }

    // 음소거 토글
    toggleMute() {
        if (this.audio.muted) {
            this.audio.muted = false;
            this.volumeSlider.value = this.volume * 100;
            this.muteBtn.querySelector('i').className = 'fas fa-volume-up';
        } else {
            this.audio.muted = true;
            this.muteBtn.querySelector('i').className = 'fas fa-volume-mute';
        }
    }

    // 볼륨 설정
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.audio.volume = this.volume;
        this.volumeSlider.value = this.volume * 100;
        
        if (this.volume === 0) {
            this.muteBtn.querySelector('i').className = 'fas fa-volume-mute';
        } else if (this.volume < 0.5) {
            this.muteBtn.querySelector('i').className = 'fas fa-volume-down';
        } else {
            this.muteBtn.querySelector('i').className = 'fas fa-volume-up';
        }
    }

    // 특정 위치로 이동
    seekTo(percentage) {
        if (!this.audio.duration) return;
        
        const time = (percentage / 100) * this.audio.duration;
        this.audio.currentTime = time;
    }

    // 즐겨찾기 토글
    toggleFavorite() {
        if (!this.currentTrack) return;
        
        const trackId = this.currentTrack.id;
        const index = this.favorites.indexOf(trackId);
        
        if (index > -1) {
            this.favorites.splice(index, 1);
            this.favoriteBtn.querySelector('i').className = 'far fa-heart';
            utils.showSuccess('즐겨찾기에서 제거되었습니다.');
        } else {
            this.favorites.push(trackId);
            this.favoriteBtn.querySelector('i').className = 'fas fa-heart';
            utils.showSuccess('즐겨찾기에 추가되었습니다.');
        }
        
        utils.saveFavorites(this.favorites);
    }

    // 큐에 트랙 추가
    addToQueue(track) {
        if (!this.queue.some(t => t.id === track.id)) {
            this.queue.push(track);
            this.updateQueue();
            utils.showSuccess(`${track.title}이(가) 큐에 추가되었습니다.`);
        }
    }

    // 큐에서 트랙 제거
    removeFromQueue(trackId) {
        const index = this.queue.findIndex(t => t.id === trackId);
        if (index > -1) {
            this.queue.splice(index, 1);
            
            if (index < this.currentIndex) {
                this.currentIndex--;
            } else if (index === this.currentIndex && this.queue.length > 0) {
                this.currentIndex = this.currentIndex >= this.queue.length ? this.queue.length - 1 : this.currentIndex;
            }
            
            this.updateQueue();
        }
    }

    // 큐 표시
    showQueue() {
        this.updateQueue();
        this.queueModal.classList.add('show');
    }

    // 큐 숨김
    hideQueue() {
        this.queueModal.classList.remove('show');
    }

    // 큐 업데이트
    updateQueue() {
        this.queueList.innerHTML = '';
        
        this.queue.forEach((track, index) => {
            const queueItem = document.createElement('div');
            queueItem.className = `queue-item ${index === this.currentIndex ? 'playing' : ''}`;
            
            queueItem.innerHTML = `
                <div class="track-cover">
                    ${track.cover_art ? 
                        `<img src="${track.cover_art}" alt="${track.title}">` : 
                        '<i class="fas fa-music"></i>'
                    }
                </div>
                <div class="track-info">
                    <div class="track-title">${utils.escapeHtml(track.title)}</div>
                    <div class="track-artist">${utils.escapeHtml(track.artist)}</div>
                </div>
                <div class="track-duration">${utils.formatTime(track.duration)}</div>
                <div class="track-actions">
                    <button class="track-action-btn" onclick="audioPlayer.removeFromQueue('${track.id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            queueItem.addEventListener('click', () => {
                this.currentIndex = index;
                this.playTrack(track, false);
            });
            
            this.queueList.appendChild(queueItem);
        });
        
        utils.saveQueue(this.queue);
    }

    // 오디오 이벤트 핸들러들
    onLoadedMetadata() {
        this.totalTimeEl.textContent = utils.formatTime(this.audio.duration);
        this.progressSlider.max = 100;
    }

    onTimeUpdate() {
        if (this.audio.duration) {
            const percentage = (this.audio.currentTime / this.audio.duration) * 100;
            this.progressBar.style.width = `${percentage}%`;
            this.progressSlider.value = percentage;
            this.currentTimeEl.textContent = utils.formatTime(this.audio.currentTime);
        }
    }

    onTrackEnded() {
        if (this.isRepeated) {
            this.audio.currentTime = 0;
            this.audio.play();
        } else {
            this.nextTrack();
        }
    }

    onError(error) {
        console.error('오디오 오류:', error);
        console.error('오디오 요소:', this.audio);
        console.error('현재 트랙:', this.currentTrack);
        
        // 더 구체적인 오류 메시지
        let errorMessage = '재생 중 오류가 발생했습니다.';
        
        if (this.audio.error) {
            switch (this.audio.error.code) {
                case 1:
                    errorMessage = '재생이 중단되었습니다.';
                    break;
                case 2:
                    errorMessage = '네트워크 오류가 발생했습니다.';
                    break;
                case 3:
                    errorMessage = '파일 형식을 지원하지 않습니다.';
                    break;
                case 4:
                    errorMessage = '파일을 찾을 수 없습니다.';
                    break;
                default:
                    errorMessage = `재생 오류 (코드: ${this.audio.error.code})`;
            }
        }
        
        utils.showError(errorMessage);
        
        // 재생 상태 초기화
        this.isPlaying = false;
        this.updatePlayPauseButton();
    }

    // UI 업데이트 메서드들
    updatePlayPauseButton() {
        const icon = this.playPauseBtn.querySelector('i');
        if (this.isPlaying) {
            icon.className = 'fas fa-pause';
        } else {
            icon.className = 'fas fa-play';
        }
        
        this.playPauseBtn.disabled = !this.currentTrack;
        this.prevBtn.disabled = this.queue.length <= 1;
        this.nextBtn.disabled = this.queue.length <= 1;
    }

    updateTrackInfo() {
        if (!this.currentTrack) {
            this.playerTitle.textContent = '재생할 음악을 선택하세요';
            this.playerArtist.textContent = '아티스트';
            this.playerCover.innerHTML = '<i class="fas fa-music"></i>';
            return;
        }

        this.playerTitle.textContent = this.currentTrack.title;
        this.playerArtist.textContent = this.currentTrack.artist;
        
        if (this.currentTrack.cover_art) {
            this.playerCover.innerHTML = `<img src="${this.currentTrack.cover_art}" alt="${this.currentTrack.title}">`;
        } else {
            this.playerCover.innerHTML = '<i class="fas fa-music"></i>';
        }

        // 즐겨찾기 버튼 상태 업데이트
        const isFavorite = this.favorites.includes(this.currentTrack.id);
        this.favoriteBtn.querySelector('i').className = isFavorite ? 'fas fa-heart' : 'far fa-heart';
    }

    // 키보드 단축키 처리
    handleKeyboard(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.seekTo(Math.max(0, (this.audio.currentTime - 10) / this.audio.duration * 100));
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.seekTo(Math.min(100, (this.audio.currentTime + 10) / this.audio.duration * 100));
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.setVolume(Math.min(1, this.volume + 0.1));
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.setVolume(Math.max(0, this.volume - 0.1));
                break;
        }
    }

    // 상태 저장/로드
    saveCurrentState() {
        if (this.currentTrack) {
            utils.saveCurrentTrack(this.currentTrack.id, this.audio.currentTime);
        }
    }

    async loadSavedState() {
        const saved = utils.loadCurrentTrack();
        if (saved) {
            try {
                const response = await musicAPI.getTrack(saved.trackId);
                if (response.success) {
                    this.playTrack(response.track, false);
                    if (saved.position > 0) {
                        this.audio.currentTime = saved.position;
                    }
                }
            } catch (error) {
                console.error('저장된 상태 로드 오류:', error);
            }
        }
        
        const savedQueue = utils.loadQueue();
        if (savedQueue.length > 0) {
            this.queue = savedQueue;
            this.updateQueue();
        }
    }

    // 플레이어 초기화
    initialize() {
        this.audio.volume = this.volume;
        this.volumeSlider.value = this.volume * 100;
        this.updatePlayPauseButton();
        this.updateTrackInfo();
        
        // 오디오 요소 초기화
        this.audio.preload = 'metadata';
        this.audio.crossOrigin = 'anonymous';
        
        console.log('오디오 플레이어 초기화 완료');
    }
}

// 전역 플레이어 인스턴스 생성
const audioPlayer = new AudioPlayer();
