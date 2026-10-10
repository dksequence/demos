/* ==========================================================================
   STARTER GUN: REACTION SURVIVAL - GAME LOGIC (app.js)
   ========================================================================== */

// 1. Web Audio API 사운드 신디사이저 클래스
class SoundSynthesizer {
    constructor() {
        this.audioCtx = null;
    }

    init() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    // "제자리에" 비프음 합성 (800Hz, 120ms)
    playOnYourMarks() {
        this.init();
        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
        
        gainNode.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.12);
        
        osc.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.12);
    }

    // "차렷" 비프음 합성 (1000Hz, 150ms)
    playSet() {
        this.init();
        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, this.audioCtx.currentTime);
        
        gainNode.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.15);
        
        osc.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.15);
    }

    // 진짜 총성 합성 (White Noise + Lowpass Filter + 급격한 Decay Envelope)
    playGunshot() {
        this.init();
        const bufferSize = this.audioCtx.sampleRate * 1.5; // 1.5초 길이
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        
        // 화이트 노이즈 난수 채우기
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noiseNode = this.audioCtx.createBufferSource();
        noiseNode.buffer = buffer;
        
        // 총성 가공을 위한 필터 노드
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.audioCtx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, this.audioCtx.currentTime + 0.3);
        
        // 볼륨 인벨롭
        const gainNode = this.audioCtx.createGain();
        gainNode.gain.setValueAtTime(1.0, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.6); // 0.6초간 감소
        
        noiseNode.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        
        noiseNode.start();
        noiseNode.stop(this.audioCtx.currentTime + 0.7);
    }

    // 가짜 속임수 효과음 합성 ("띡" 하고 낮은 뭉툭한 비프음 또는 짧은 잡음)
    playFakeSound(type = 'beep') {
        this.init();
        if (type === 'beep') {
            const osc = this.audioCtx.createOscillator();
            const gainNode = this.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(350, this.audioCtx.currentTime); // 낮은 주파수
            gainNode.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);
            osc.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.1);
        } else {
            // 짧은 기계음 노이즈
            const bufferSize = this.audioCtx.sampleRate * 0.1;
            const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noiseNode = this.audioCtx.createBufferSource();
            noiseNode.buffer = buffer;
            const gainNode = this.audioCtx.createGain();
            gainNode.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.08);
            noiseNode.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);
            noiseNode.start();
            noiseNode.stop(this.audioCtx.currentTime + 0.1);
        }
    }
}

// 2. 게임 상태 및 변수 관리
const sound = new SoundSynthesizer();
let state = 'MENU'; // MENU, READY, SET, PLAYING, COOLDOWN(통과·실패 문구를 보여 주는 대기), RESULT

let stage = 1;
let lives = 3;
let bestStage = parseInt(localStorage.getItem('sg_best_stage') || '0');
let bestTime = parseFloat(localStorage.getItem('sg_best_time') || '0');

let tZero = 0; // 발포 절대 시각
let stageTimes = []; // 각 스테이지의 반응 시간 배열
let totalFouls = 0;

let currentTargetTime = 0.350; // 기본 1스테이지 제한 시간: 350ms
let triggerTimeoutId = null;
let prepTimeoutId = null;
let fakeTriggerTimeoutId = null;
let resetStatusTimeoutId = null;

let isPadPressed = false;
let fakeTriggerActive = false;
let currentFakeType = ''; // 'sound', 'light'

// DOM 요소 탐색
const screenMenu = document.getElementById('screen-menu');
const screenGame = document.getElementById('screen-game');
const screenResult = document.getElementById('screen-result');

const bestScoreDisplay = document.getElementById('best-score-display');
const bestTimeDisplay = document.getElementById('best-time-display');

const currentStageDisplay = document.getElementById('current-stage');
const livesBox = document.getElementById('lives-box');
const signalMessage = document.getElementById('signal-message');
const subMessage = document.getElementById('sub-message');

const touchPad = document.getElementById('touch-pad');
const padLabel = document.getElementById('pad-label');
const flashOverlay = document.getElementById('flash-overlay');
const gunModel = document.getElementById('gun-model');
const gunHammer = document.getElementById('gun-hammer');

// 결과 화면 요소
const resultTitle = document.getElementById('result-title');
const finalStageDisplay = document.getElementById('final-stage');
const averageTimeDisplay = document.getElementById('average-time');
const foulCountDisplay = document.getElementById('foul-count');

// 모달 요소
const rulesModal = document.getElementById('rules-modal');

// 3. TTS 음성 합성
function speakVoice(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        // 2026-10-08: 영어 화면(i18n_inject)이면 영어 음성으로 — 판정 타이밍과는 무관(음성은 setTimeout 과 별개)
        const en = !!window.__dkLangEn;
        if (en) text = ({ '제자리에': 'On your marks', '차렷': 'Set' })[text] || text;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = en ? 'en-US' : 'ko-KR';
        utterance.rate = 1.1;
        window.speechSynthesis.speak(utterance);
    }
}

// 4. 화면 전환 처리
function switchScreen(newScreen) {
    [screenMenu, screenGame, screenResult].forEach(s => s.classList.remove('active'));
    newScreen.classList.add('active');
}

// 5. 최고 기록 렌더링
function updateBestRecords() {
    bestScoreDisplay.textContent = `${bestStage} Stage`;
    bestTimeDisplay.textContent = bestTime > 0 ? `${bestTime.toFixed(3)}s` : '0.000s';
}

// 6. 하트 라이프 바 렌더링
function renderLives() {
    const hearts = livesBox.querySelectorAll('.life-heart');
    hearts.forEach((heart, idx) => {
        if (idx < lives) {
            heart.classList.remove('life-lost');
        } else {
            heart.classList.add('life-lost');
        }
    });
}

// 7. 게임 오버 체크 및 결과 화면 노출
function checkGameOver() {
    if (lives <= 0) {
        state = 'RESULT';
        switchScreen(screenResult);
        
        resultTitle.textContent = "GAME OVER";
        resultTitle.className = "text-glow-red";
        
        finalStageDisplay.textContent = `${stage} Stage`;
        
        const validTimes = stageTimes.filter(t => t > 0);
        const avg = validTimes.length > 0 ? (validTimes.reduce((a, b) => a + b, 0) / validTimes.length) : 0;
        averageTimeDisplay.textContent = `${avg.toFixed(3)}s`;
        foulCountDisplay.textContent = `${totalFouls}회`;
        
        // 최고 기록 갱신 여부 저장
        if (stage > bestStage) {
            bestStage = stage;
            localStorage.setItem('sg_best_stage', bestStage);
            if (window.Rv) Rv.moment(); // 최고 스테이지 갱신 = 좋은 순간
        }
        
        if (avg > 0 && (bestTime === 0 || avg < bestTime)) {
            bestTime = avg;
            localStorage.setItem('sg_best_time', bestTime);
        }
        
        updateBestRecords();
    }
}

// 8. 햅틱 진동 함수
function vibrateDevice(pattern) {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

// 9. 스테이지 빌드 및 대기 상태 개시
function setupStage() {
    // 2026-10-08: 이전 판의 예약 타이머가 새 판으로 넘어오지 않게 정리
    clearTimeout(prepTimeoutId);
    clearTimeout(triggerTimeoutId);
    clearTimeout(fakeTriggerTimeoutId);
    state = 'READY';
    isPadPressed = false;
    fakeTriggerActive = false;
    
    // 스테이지 수에 맞춰 난이도 계산
    currentTargetTime = Math.max(0.180, 0.350 - (stage - 1) * 0.015); // 스테이지별로 15ms씩 차감 (최소 180ms 제한)
    
    currentStageDisplay.textContent = stage;
    signalMessage.textContent = "터치 영역을 꾹 누르세요";
    signalMessage.className = "text-blue";
    subMessage.textContent = `목표 반응 속도: ${currentTargetTime.toFixed(3)}s 이내`;
    
    touchPad.className = "touch-pad-idle";
    padLabel.textContent = "PRESS & HOLD";
    
    // 해머 복구
    gunHammer.setAttribute('transform', 'rotate(0)');
    gunModel.className = 'gun-idle';
}

// 10. 스타터 건 게임 라이프사이클 함수들

// A. 플레이어가 터치 패드를 꾹 눌렀을 때 (READY)
function onPadPress(e) {
    if (e) e.preventDefault();
    if (state !== 'READY') return;
    
    sound.init(); // 오디오 맥락 생성 활성화
    isPadPressed = true;
    touchPad.className = "touch-pad-active";
    padLabel.textContent = "HOLDING...";
    
    signalMessage.textContent = "제자리에 (READY)";
    signalMessage.className = "text-pink";
    
    // 햅틱 미세 피드백
    vibrateDevice(30);
    
    // 1단계: "제자리에" 사운드 송출 (1.0초 후 "차렷"으로 전이)
    if ('speechSynthesis' in window) {
        speakVoice("제자리에");
    } else {
        sound.playOnYourMarks();
    }
    
    prepTimeoutId = setTimeout(() => {
        if (!isPadPressed) return;
        
        state = 'SET';
        signalMessage.textContent = "차렷 (SET)";
        signalMessage.className = "text-green";
        
        // 실린더 해머 젖히는 비주얼 효과
        gunHammer.setAttribute('transform', 'rotate(-30, 20, 25)');
        gunModel.className = 'gun-ready';
        
        if ('speechSynthesis' in window) {
            speakVoice("차렷");
        } else {
            sound.playSet();
        }
        
        // 2단계: 랜덤 딜레이 생성 (1.8초 ~ 4.5초)
        const randomDelay = 1800 + Math.random() * 2700;
        
        // 3단계: 속임수(Fake) 연출 결정 (3스테이지 이상부터 점진적으로 확률 업)
        const fakeProbability = Math.min(0.5, (stage - 2) * 0.1);
        const willFake = stage >= 3 && Math.random() < fakeProbability;
        
        if (willFake) {
            // 진짜 총소리 전 임의의 시점에 가짜 신호 작동
            const fakeDelay = 800 + Math.random() * (randomDelay - 1000);
            currentFakeType = Math.random() > 0.5 ? 'sound' : 'light';
            
            fakeTriggerTimeoutId = setTimeout(() => {
                if (!isPadPressed) return;
                fakeTriggerActive = true;
                
                if (currentFakeType === 'sound') {
                    // 가짜 쿵 소리
                    sound.playFakeSound(Math.random() > 0.5 ? 'beep' : 'noise');
                } else {
                    // 가짜 초록/블루 섬광
                    const fakeClass = Math.random() > 0.5 ? 'flash-active-fake-blue' : 'flash-active-fake-green';
                    flashOverlay.className = fakeClass;
                    setTimeout(() => flashOverlay.className = '', 100);
                }
                
                // 가짜 신호 송출 0.8초 후 강제로 진짜 발포 처리
                triggerTimeoutId = setTimeout(triggerRealGunshot, 800);
            }, fakeDelay);
            
        } else {
            // 가짜 신호 없이 스트레이트 발포
            triggerTimeoutId = setTimeout(triggerRealGunshot, randomDelay);
        }
        
    }, 1000);
}

// B. 진짜 총성 발포 (PLAYING)
function triggerRealGunshot() {
    if (!isPadPressed) return;
    
    state = 'PLAYING';
    signalMessage.textContent = "탕! (BANG!)";
    signalMessage.className = "text-red";
    
    // 진짜 섬광 및 소리 출력
    flashOverlay.className = 'flash-active-real';
    sound.playGunshot();
    vibrateDevice([150, 50, 80]); // 강력한 격발 반동
    
    // 권총 반동 애니메이션
    gunModel.className = 'gun-recoil';
    
    tZero = performance.now();
    
    setTimeout(() => {
        flashOverlay.className = '';
    }, 120);
}

// C. 플레이어가 터치 패드에서 손가락을 뗐을 때 (Release)
function onPadRelease(e) {
    if (e) e.preventDefault();
    // 2026-10-08: 통과·실패 문구가 떠 있는 대기 시간(COOLDOWN)에는 누름·뗌을 무시한다.
    // 이전에는 이 시간에 다시 누르면 앞 판의 총성 예약이 새 판에서 «차렷» 없이 먼저 울릴 수 있었다.
    if (state === 'COOLDOWN') { isPadPressed = false; touchPad.className = "touch-pad-idle"; padLabel.textContent = "PRESS & HOLD"; return; }
    isPadPressed = false;
    
    // 오디오 중단 방지
    clearTimeout(prepTimeoutId);
    clearTimeout(triggerTimeoutId);
    clearTimeout(fakeTriggerTimeoutId);
    
    // UI 원상 복구
    touchPad.className = "touch-pad-idle";
    padLabel.textContent = "PRESS & HOLD";
    
    const tRelease = performance.now();
    
    // 1. 차렷(SET) 중 미리 뗀 경우 ➡️ 부정출발 (FOUL). 속임수(가짜 신호)에 당해 뗀 경우는 별도 문구.
    if (state === 'SET') {
        if (fakeTriggerActive) {
            handleFoul("속임수에 당했습니다! (FOUL)");
        } else {
            handleFoul("부정출발! (FOUL)");
        }
    }
    // 2. 정상 격발 완료 후 뗀 경우 ➡️ 속도 판독
    else if (state === 'PLAYING') {
        const reactionTime = (tRelease - tZero) / 1000;
        stageTimes.push(reactionTime);
        
        if (reactionTime <= currentTargetTime) {
            // 통과!
            state = 'COOLDOWN';
            signalMessage.textContent = `통과! (${reactionTime.toFixed(3)}s)`;
            signalMessage.className = "text-green";
            vibrateDevice(80);
            
            stage++;
            
            resetStatusTimeoutId = setTimeout(() => {
                setupStage();
            }, 1500);
        } else {
            // 시간 초과 탈락!
            lives--;
            renderLives();
            vibrateDevice([300]);
            
            if (lives > 0) {
                state = 'COOLDOWN';
                signalMessage.textContent = `속도 초과! (${reactionTime.toFixed(3)}s)`;
                signalMessage.className = "text-red";
                
                resetStatusTimeoutId = setTimeout(() => {
                    setupStage();
                }, 2000);
            } else {
                checkGameOver();
            }
        }
    } else {
        // IDLE 상태나 READY 초기 진입 중 뗀 경우 단순 원복
        state = 'READY';
        signalMessage.textContent = "터치 영역을 꾹 누르세요";
        signalMessage.className = "text-blue";
    }
}

// 부정출발 처리 공통 함수
function handleFoul(msg) {
    state = 'COOLDOWN';
    lives--;
    totalFouls++;
    renderLives();
    vibrateDevice([100, 100, 100]); // 다중 햅틱 에러 진동
    
    signalMessage.textContent = msg;
    signalMessage.className = "text-red";
    
    if (lives > 0) {
        resetStatusTimeoutId = setTimeout(() => {
            setupStage();
        }, 2000);
    } else {
        checkGameOver();
    }
}

// 11. 이벤트 리스너 세팅 및 조립
function initGame() {
    // 최고 기록 렌더링
    updateBestRecords();
    
    // 시작 버튼
    document.getElementById('btn-start').addEventListener('click', () => {
        state = 'READY';
        stage = 1;
        lives = 3;
        totalFouls = 0;
        stageTimes = [];
        
        renderLives();
        setupStage();
        switchScreen(screenGame);
    });

    // 규칙 모달 열고 닫기
    document.getElementById('btn-info-modal').addEventListener('click', () => {
        rulesModal.classList.add('active');
    });
    document.getElementById('btn-close-modal').addEventListener('click', () => {
        rulesModal.classList.remove('active');
    });

    // 게임 오버 리스타트
    document.getElementById('btn-restart').addEventListener('click', () => {
        state = 'READY';
        stage = 1;
        lives = 3;
        totalFouls = 0;
        stageTimes = [];
        
        renderLives();
        setupStage();
        switchScreen(screenGame);
    });

    document.getElementById('btn-home').addEventListener('click', () => {
        switchScreen(screenMenu);
    });

    // 모바일/웹 크로스 플랫폼 터치 바인딩 (Pointer Event)
    touchPad.addEventListener('pointerdown', onPadPress);
    touchPad.addEventListener('pointerup', onPadRelease);
    touchPad.addEventListener('pointerleave', (e) => {
        // 패드를 터치한 채 영역을 벗어났을 때 릴리즈로 판정
        if (isPadPressed) {
            onPadRelease(e);
        }
    });
}

// 초기화 호출
window.addEventListener('DOMContentLoaded', initGame);
