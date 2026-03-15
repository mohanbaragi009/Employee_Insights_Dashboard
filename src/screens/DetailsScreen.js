import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useEmployee } from '../context/EmployeeContext';

function getVal(obj, key) {
    return obj[key] ?? obj[key.toLowerCase()] ?? obj[key.toUpperCase()] ?? '';
}

function CameraSignatureCapture({ onAuditReady }) {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const canvasRef = useRef(null);
    const drawing = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });

    const [step, setStep] = useState('idle');
    const [photoDataUrl, setPhotoDataUrl] = useState(null);
    const [hasSig, setHasSig] = useState(false);
    const [cameraError, setCameraError] = useState('');

    const startCamera = async () => {
        setCameraError('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
            });
            streamRef.current = stream;
            setStep('camera');
        } catch (err) {
            setCameraError('Camera unavailable: ' + err.message);
        }
    };

    useEffect(() => {
        if (step === 'camera' && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [step]);

    const stopCamera = () => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    };

    const takePhoto = () => {
        const v = videoRef.current;
        const w = v.videoWidth || 640;
        const h = v.videoHeight || 480;
        const tmp = document.createElement('canvas');
        tmp.width = w; tmp.height = h;
        tmp.getContext('2d').drawImage(v, 0, 0, w, h);
        const url = tmp.toDataURL('image/jpeg', 0.92);
        setPhotoDataUrl(url);
        stopCamera();
        setStep('signing');
    };

    const retake = () => {
        setPhotoDataUrl(null);
        setHasSig(false);
        setStep('idle');
        const c = canvasRef.current;
        if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height);
    };

    useEffect(() => () => stopCamera(), []);

    const getPos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const src = e.touches ? e.touches[0] : e;
        return {
            x: (src.clientX - rect.left) * scaleX,
            y: (src.clientY - rect.top) * scaleY,
        };
    };

    const startDraw = useCallback(e => {
        e.preventDefault();
        if (step !== 'signing') return;
        drawing.current = true;
        lastPos.current = getPos(e);
    }, [step]);

    const draw = useCallback(e => {
        e.preventDefault();
        if (!drawing.current || step !== 'signing') return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = 'rgba(129, 140, 248, 0.95)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = '#818cf8';
        ctx.shadowBlur = 4;
        ctx.stroke();
        lastPos.current = pos;
        setHasSig(true);
    }, [step]);

    const stopDraw = useCallback(() => { drawing.current = false; }, []);

    const clearSignature = () => {
        const c = canvasRef.current;
        c.getContext('2d').clearRect(0, 0, c.width, c.height);
        setHasSig(false);
    };

    const generateAudit = useCallback(() => {
        const photoImg = new Image();
        photoImg.onload = () => {
            const W = photoImg.width || 640;
            const H = photoImg.height || 480;

            const merged = document.createElement('canvas');
            merged.width = W;
            merged.height = H;
            const ctx = merged.getContext('2d');

            ctx.drawImage(photoImg, 0, 0, W, H);

            const sigCanvas = canvasRef.current;
            ctx.drawImage(sigCanvas, 0, 0, W, H);

            ctx.fillStyle = 'rgba(0,0,0,0.45)';
            ctx.fillRect(0, H - 36, W, 36);
            ctx.fillStyle = '#a5b4fc';
            ctx.font = 'bold 13px Arial';
            ctx.textAlign = 'right';
            ctx.fillText('✔ IDENTITY VERIFIED — ' + new Date().toLocaleDateString('en-IN'), W - 12, H - 12);

            merged.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                onAuditReady(url, merged.toDataURL('image/png'));
                setStep('done');
            }, 'image/png');
        };
        photoImg.src = photoDataUrl;
    }, [photoDataUrl, onAuditReady]);

    const PHOTO_W = 640, PHOTO_H = 480;

    return (
        <div className="flex flex-col gap-4">
            {step === 'idle' && (
                <div className="flex flex-col items-center gap-4 py-8">
                    {cameraError && (
                        <p className="text-sm text-red-400 text-center">{cameraError}</p>
                    )}
                    <div className="rounded-2xl border border-dashed flex flex-col items-center gap-3 p-10"
                        style={{ borderColor: 'rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.04)' }}>
                        <svg className="w-14 h-14" style={{ color: '#6366f1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-sm text-gray-400 text-center max-w-xs">
                            Start your camera to capture a photo. Then sign directly over the photo using your mouse or touch.
                        </p>
                    </div>
                    <button id="start-camera-btn" onClick={startCamera} className="btn-primary px-8">
                        Start Camera
                    </button>
                </div>
            )}

            {step === 'camera' && (
                <div className="flex flex-col gap-3">
                    <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(99,102,241,0.3)', aspectRatio: '4/3' }}>
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className="w-40 h-40 border-2 rounded-full" style={{ borderColor: 'rgba(129,140,248,0.6)' }} />
                        </div>
                        <div className="absolute bottom-3 left-0 right-0 text-center">
                            <span className="text-xs px-3 py-1 rounded-full font-medium"
                                style={{ background: 'rgba(0,0,0,0.5)', color: '#a5b4fc' }}>
                                Position your face in the circle
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={retake} className="btn-ghost flex-1 text-sm">Cancel</button>
                        <button id="take-photo-btn" onClick={takePhoto} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            </svg>
                            Take Photo
                        </button>
                    </div>
                </div>
            )}

            {(step === 'signing' || step === 'done') && photoDataUrl && (
                <div className="flex flex-col gap-3">
                    <div className="relative rounded-xl overflow-hidden border select-none"
                        style={{ borderColor: 'rgba(99,102,241,0.4)' }}>
                        <img
                            src={photoDataUrl}
                            alt="Captured"
                            className="w-full block"
                            style={{ display: 'block' }}
                            draggable={false}
                        />
                        <canvas
                            ref={canvasRef}
                            width={PHOTO_W}
                            height={PHOTO_H}
                            className="absolute inset-0 w-full h-full touch-none"
                            style={{
                                cursor: step === 'signing' ? 'crosshair' : 'default',
                                pointerEvents: step === 'signing' ? 'auto' : 'none',
                            }}
                            onMouseDown={startDraw}
                            onMouseMove={draw}
                            onMouseUp={stopDraw}
                            onMouseLeave={stopDraw}
                            onTouchStart={startDraw}
                            onTouchMove={draw}
                            onTouchEnd={stopDraw}
                        />
                        {step === 'signing' && (
                            <div className="absolute bottom-3 left-0 right-0 pointer-events-none flex justify-center">
                                <span className="text-xs px-3 py-1 rounded-full font-medium"
                                    style={{ background: 'rgba(0,0,0,0.6)', color: '#a5b4fc' }}>
                                    ✍ Draw your signature directly on the photo
                                </span>
                            </div>
                        )}
                        {step === 'done' && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="px-6 py-3 rounded-xl font-bold text-white text-lg"
                                    style={{ background: 'rgba(16,185,129,0.2)', border: '2px solid rgba(16,185,129,0.6)' }}>
                                    ✓ Audit Image Generated
                                </div>
                            </div>
                        )}
                    </div>

                    {step === 'signing' && (
                        <div className="flex gap-2">
                            <button onClick={retake} className="btn-ghost flex-1 text-sm">Retake Photo</button>
                            <button onClick={clearSignature} className="btn-ghost flex-1 text-sm">Clear Signature</button>
                            <button
                                id="generate-audit-btn"
                                onClick={generateAudit}
                                disabled={!hasSig}
                                className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
                                style={{ opacity: hasSig ? 1 : 0.4, cursor: hasSig ? 'pointer' : 'not-allowed' }}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                Merge & Generate Audit
                            </button>
                        </div>
                    )}

                    {step === 'done' && (
                        <button onClick={retake} className="btn-ghost text-sm">Start Over</button>
                    )}
                </div>
            )}
        </div>
    );
}

export default function DetailsScreen({ employee, onBack }) {
    const { saveAuditImage, auditImages } = useEmployee();
    const empId = getVal(employee, 'id');
    const [auditUrl, setAuditUrl] = useState(auditImages[empId] || null);

    const handleAuditReady = useCallback((blobUrl) => {
        setAuditUrl(blobUrl);
        saveAuditImage(empId, blobUrl);
    }, [empId, saveAuditImage]);

    return (
        <div className="flex flex-col gap-6 animate-fade-in items-center">
            <div className="flex items-center gap-4 w-full justify-between">
                <button id="back-to-grid-btn" onClick={onBack} className="btn-ghost flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to List
                </button>
                <div className="text-center">
                    <h1 className="text-xl font-bold text-white">Identity Verification</h1>
                    <p className="text-sm" style={{ color: '#6b7280' }}>
                        {getVal(employee, 'name')} · ID #{empId}
                    </p>
                </div>
                <div className="flex items-center gap-2 min-w-[100px] justify-end">
                    {auditUrl && (
                        <span className="flex items-center gap-2 text-sm font-medium"
                            style={{ color: '#34d399' }}>
                            <span className="w-2 h-2 rounded-full bg-green-400" style={{ animation: 'pulse 2s infinite' }} />
                            Verified
                        </span>
                    )}
                </div>
            </div>

            <div className="w-full max-w-2xl">
                <div className="glass-card p-5">
                    <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
                        <svg className="w-4 h-4" style={{ color: '#818cf8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        </svg>
                        Camera + Signature Overlay
                    </h3>
                    <p className="text-xs mb-4" style={{ color: '#6b7280' }}>
                        Sign directly on the photo
                    </p>
                    <CameraSignatureCapture onAuditReady={handleAuditReady} />
                </div>
            </div>

            {auditUrl && (
                <div className="glass-card p-6 animate-slide-up w-full max-w-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-400" style={{ animation: 'pulse 2s infinite' }} />
                            Audit Image
                        </h3>
                        <a
                            id="download-audit-btn"
                            href={auditUrl}
                            download={`audit_employee_${empId}.png`}
                            className="btn-ghost text-sm flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download PNG
                        </a>
                    </div>
                    <img
                        src={auditUrl}
                        alt="Audit showing merged signature"
                        className="w-full rounded-xl"
                        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                </div>
            )}
        </div>
    );
}
