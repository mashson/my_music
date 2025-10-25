// API 통신을 위한 클래스
class MusicAPI {
    constructor(baseURL = '') {
        this.baseURL = baseURL;
    }

    // GET 요청 헬퍼
    async get(endpoint) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('GET 요청 오류:', error);
            throw error;
        }
    }

    // POST 요청 헬퍼
    async post(endpoint, data = null, isFormData = false) {
        try {
            const options = {
                method: 'POST',
            };

            if (data) {
                if (isFormData) {
                    options.body = data;
                } else {
                    options.headers = {
                        'Content-Type': 'application/json',
                    };
                    options.body = JSON.stringify(data);
                }
            }

            const response = await fetch(`${this.baseURL}${endpoint}`, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('POST 요청 오류:', error);
            throw error;
        }
    }

    // PUT 요청 헬퍼
    async put(endpoint, data) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('PUT 요청 오류:', error);
            throw error;
        }
    }

    // DELETE 요청 헬퍼
    async delete(endpoint) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('DELETE 요청 오류:', error);
            throw error;
        }
    }

    // 모든 앨범 목록 가져오기
    async getAlbums() {
        return await this.get('/api/albums');
    }

    // 모든 트랙 목록 가져오기
    async getTracks() {
        return await this.get('/api/tracks');
    }

    // 특정 앨범의 트랙 목록 가져오기
    async getAlbumTracks(albumId) {
        return await this.get(`/api/albums/${albumId}/tracks`);
    }

    // 특정 트랙 정보 가져오기
    async getTrack(trackId) {
        return await this.get(`/api/tracks/${trackId}`);
    }

    // 트랙 스트리밍 URL 생성
    getStreamURL(trackId) {
        return `${this.baseURL}/api/stream/${trackId}`;
    }

    // 음악 파일 업로드
    async uploadTrack(file, onProgress = null) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const xhr = new XMLHttpRequest();
            
            return new Promise((resolve, reject) => {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable && onProgress) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        onProgress(percentComplete);
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            resolve(response);
                        } catch (error) {
                            reject(new Error('응답 파싱 오류'));
                        }
                    } else {
                        reject(new Error(`업로드 실패: ${xhr.status}`));
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error('업로드 중 네트워크 오류'));
                });

                xhr.open('POST', `${this.baseURL}/api/upload`);
                xhr.send(formData);
            });
        } catch (error) {
            console.error('업로드 오류:', error);
            throw error;
        }
    }

    // 트랙 정보 업데이트
    async updateTrack(trackId, updates) {
        return await this.put(`/api/tracks/${trackId}`, updates);
    }

    // 트랙 삭제
    async deleteTrack(trackId) {
        return await this.delete(`/api/tracks/${trackId}`);
    }

    // 트랙 검색
    async searchTracks(query) {
        return await this.get(`/api/search?q=${encodeURIComponent(query)}`);
    }

    // 헬스 체크
    async healthCheck() {
        return await this.get('/api/health');
    }
}

// 전역 API 인스턴스 생성
const musicAPI = new MusicAPI();

// 전역 변수로 설정
window.musicAPI = musicAPI;

// 유틸리티 함수들
const utils = {
    // 시간을 MM:SS 형식으로 포맷
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    },

    // 파일 크기를 읽기 쉬운 형식으로 포맷
    formatFileSize(bytes) {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // 텍스트를 안전하게 이스케이프
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // 로컬 스토리지에 즐겨찾기 저장
    saveFavorites(favorites) {
        try {
            localStorage.setItem('musicFavorites', JSON.stringify(favorites));
        } catch (error) {
            console.error('즐겨찾기 저장 오류:', error);
        }
    },

    // 로컬 스토리지에서 즐겨찾기 로드
    loadFavorites() {
        try {
            const favorites = localStorage.getItem('musicFavorites');
            return favorites ? JSON.parse(favorites) : [];
        } catch (error) {
            console.error('즐겨찾기 로드 오류:', error);
            return [];
        }
    },

    // 로컬 스토리지에 재생 큐 저장
    saveQueue(queue) {
        try {
            localStorage.setItem('musicQueue', JSON.stringify(queue));
        } catch (error) {
            console.error('큐 저장 오류:', error);
        }
    },

    // 로컬 스토리지에서 재생 큐 로드
    loadQueue() {
        try {
            const queue = localStorage.getItem('musicQueue');
            return queue ? JSON.parse(queue) : [];
        } catch (error) {
            console.error('큐 로드 오류:', error);
            return [];
        }
    },

    // 로컬 스토리지에 현재 재생 위치 저장
    saveCurrentTrack(trackId, position = 0) {
        try {
            localStorage.setItem('currentTrack', JSON.stringify({ trackId, position }));
        } catch (error) {
            console.error('현재 트랙 저장 오류:', error);
        }
    },

    // 로컬 스토리지에서 현재 재생 위치 로드
    loadCurrentTrack() {
        try {
            const current = localStorage.getItem('currentTrack');
            return current ? JSON.parse(current) : null;
        } catch (error) {
            console.error('현재 트랙 로드 오류:', error);
            return null;
        }
    },

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

    // 썸네일 이미지 생성 (앨범 커버용)
    createThumbnail(imageData, size = 150) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = size;
                canvas.height = size;
                
                ctx.drawImage(img, 0, 0, size, size);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = () => resolve(null);
            img.src = imageData;
        });
    },

    // 에러 메시지 표시
    showError(message, duration = 3000) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4444;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 300);
        }, duration);
    },

    // 성공 메시지 표시
    showSuccess(message, duration = 3000) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #44ff44;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.parentNode.removeChild(successDiv);
                }
            }, 300);
        }, duration);
    },

    // 로딩 상태 표시/숨김
    showLoading(show = true) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = show ? 'flex' : 'none';
        }
    }
};

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    // 앨범 관리
    async createAlbum(albumData) {
        try {
            const response = await this.post('/api/albums', albumData);
            return response;
        } catch (error) {
            console.error('앨범 생성 오류:', error);
            throw error;
        }
    }

    async updateAlbum(albumId, updates) {
        try {
            const response = await this.put(`/api/albums/${albumId}`, updates);
            return response;
        } catch (error) {
            console.error('앨범 업데이트 오류:', error);
            throw error;
        }
    }

    async deleteAlbum(albumId) {
        try {
            const response = await this.delete(`/api/albums/${albumId}`);
            return response;
        } catch (error) {
            console.error('앨범 삭제 오류:', error);
            throw error;
        }
    }
}
