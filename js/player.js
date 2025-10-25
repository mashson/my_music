// 오디오 플레이어 클래스
class AudioPlayer {
    constructor() {
        this.audio = document.getElementById('audioPlayer');
        this.currentTrack = null;
        this.isPlaying = false;
        this.trackList = [];
        this.currentIndex = 0;
        
        this.initializeElements();
        this.bindEvents();
        this.initialize();
    }

    initializeElements() {
        // 플레이어 요소들
        this.playBtn = document.getElementById('playBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.progressSlider = document.getElementById('progressSlider');
        this.progress = document.getElementById('progress');
        this.currentTimeEl = document.getElementById('currentTime');
        this.durationEl = document.getElementById('duration');
        this.trackTitleEl = document.getElementById('trackTitle');
        this.trackArtistEl = document.getElementById('trackArtist');
        this.albumArtEl = document.getElementById('albumArt');
        
        // 가수 모달 요소들
        this.singerModal = document.getElementById('singerModal');
        this.closeSingerModal = document.getElementById('closeSingerModal');
    }

    bindEvents() {
        // 플레이어 컨트롤 이벤트
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.prevBtn.addEventListener('click', () => this.previousTrack());
        this.nextBtn.addEventListener('click', () => this.nextTrack());
        
        // 프로그레스 바 이벤트
        this.progressSlider.addEventListener('input', (e) => this.seekTo(e.target.value));
        
        // 오디오 이벤트
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('ended', () => this.nextTrack());
        this.audio.addEventListener('error', (e) => this.onError(e));
        
        // 가수 모달 이벤트
        this.closeSingerModal.addEventListener('click', () => this.hideSingerModal());
        this.singerModal.addEventListener('click', (e) => {
            if (e.target === this.singerModal) {
                this.hideSingerModal();
            }
        });
    }

    initialize() {
        this.audio.preload = 'metadata';
        this.audio.crossOrigin = 'anonymous';
    }

    async loadMusicList() {
        try {
            const response = await fetch('/api/music');
            const data = await response.json();
            
            if (data.success) {
                this.trackList = data.music;
                this.renderMusicList();
                return true;
            } else {
                throw new Error(data.error || '음악 목록을 불러올 수 없습니다.');
            }
        } catch (error) {
            console.error('음악 목록 로드 오류:', error);
            this.showError('음악 목록을 불러오는 중 오류가 발생했습니다.');
            return false;
        }
    }

    renderMusicList() {
        const musicGrid = document.getElementById('musicGrid');
        
        if (this.trackList.length === 0) {
            musicGrid.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i>음악을 불러오는 중...</div>';
            return;
        }

        musicGrid.innerHTML = this.trackList.map((track, index) => `
            <div class="music-card" data-index="${index}" onclick="audioPlayer.playTrack(${index})">
                <div class="album-art">
                    ${track.image ? 
                        `<img src="/api/image/${track.image}" alt="${track.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                         <i class="fas fa-music" style="display:none;"></i>` :
                        '<i class="fas fa-music"></i>'
                    }
                </div>
                <div class="track-info">
                    <div class="track-title">${this.escapeHtml(track.title)}</div>
                    <div class="track-artist">
                        <img src="/api/singer-image/레이나.jpg" alt="레이나" class="singer-profile" onclick="event.stopPropagation(); audioPlayer.showSingerModal();" onerror="this.style.display='none';">
                        레이나
                    </div>
                </div>
                <div class="play-overlay">
                    <i class="fas fa-play"></i>
                </div>
            </div>
        `).join('');
    }

    playTrack(index) {
        if (index < 0 || index >= this.trackList.length) return;
        
        this.currentIndex = index;
        this.currentTrack = this.trackList[index];
        
        // 오디오 소스 설정
        this.audio.src = this.currentTrack.file_path;
        
        // UI 업데이트
        this.updatePlayerInfo();
        this.updateMusicCards();
        
        // 재생
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.updatePlayButton();
        }).catch(error => {
            console.error('재생 오류:', error);
            this.showError('재생 중 오류가 발생했습니다.');
        });
    }

    togglePlay() {
        if (!this.currentTrack) return;
        
        if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
        } else {
            this.audio.play().then(() => {
                this.isPlaying = true;
            }).catch(error => {
                console.error('재생 오류:', error);
                this.showError('재생 중 오류가 발생했습니다.');
            });
        }
        this.updatePlayButton();
    }

    previousTrack() {
        if (this.trackList.length === 0) return;
        
        this.currentIndex = (this.currentIndex - 1 + this.trackList.length) % this.trackList.length;
        this.playTrack(this.currentIndex);
    }

    nextTrack() {
        if (this.trackList.length === 0) return;
        
        this.currentIndex = (this.currentIndex + 1) % this.trackList.length;
        this.playTrack(this.currentIndex);
    }

    seekTo(percentage) {
        if (!this.audio.duration) return;
        
        const time = (percentage / 100) * this.audio.duration;
        this.audio.currentTime = time;
    }

    updateProgress() {
        if (!this.audio.duration) return;
        
        const percentage = (this.audio.currentTime / this.audio.duration) * 100;
        this.progress.style.width = percentage + '%';
        this.progressSlider.value = percentage;
        this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
    }

    updateDuration() {
        this.durationEl.textContent = this.formatTime(this.audio.duration);
    }

    updatePlayButton() {
        const icon = this.playBtn.querySelector('i');
        if (this.isPlaying) {
            icon.className = 'fas fa-pause';
        } else {
            icon.className = 'fas fa-play';
        }
    }

    updatePlayerInfo() {
        if (!this.currentTrack) return;
        
        this.trackTitleEl.textContent = this.currentTrack.title;
        this.trackArtistEl.innerHTML = `
            <img src="/api/singer-image/레이나.jpg" alt="레이나" class="singer-profile" onclick="audioPlayer.showSingerModal();" onerror="this.style.display='none';">
            레이나
        `;
        
        // 앨범 아트 업데이트
        if (this.currentTrack.image) {
            this.albumArtEl.innerHTML = `<img src="/api/image/${this.currentTrack.image}" alt="${this.currentTrack.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                        <i class="fas fa-music" style="display:none;"></i>`;
        } else {
            this.albumArtEl.innerHTML = '<i class="fas fa-music"></i>';
        }
    }

    updateMusicCards() {
        // 모든 카드에서 playing 클래스 제거
        document.querySelectorAll('.music-card').forEach(card => {
            card.classList.remove('playing');
        });
        
        // 현재 재생 중인 카드에 playing 클래스 추가
        const currentCard = document.querySelector(`[data-index="${this.currentIndex}"]`);
        if (currentCard) {
            currentCard.classList.add('playing');
        }
    }

    onError(event) {
        console.error('오디오 오류:', event);
        this.showError('재생 중 오류가 발생했습니다.');
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showSingerModal() {
        this.singerModal.classList.add('show');
    }

    hideSingerModal() {
        this.singerModal.classList.remove('show');
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

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

        document.body.appendChild(messageDiv);

        // 3초 후 자동 제거
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }
}

// 전역 오디오 플레이어 인스턴스
const audioPlayer = new AudioPlayer();

// 페이지 로드 시 음악 목록 로드
document.addEventListener('DOMContentLoaded', () => {
    audioPlayer.loadMusicList();
});