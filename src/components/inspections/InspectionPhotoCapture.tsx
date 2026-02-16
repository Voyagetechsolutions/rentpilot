'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Camera, X, Upload, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';

interface InspectionPhotoCaptureProps {
    itemId: string;
    photos: string[];
    onPhotosChange: (itemId: string, photos: string[]) => void;
    unitId?: string;
}

export function InspectionPhotoCapture({
    itemId,
    photos,
    onPhotosChange,
    unitId,
}: InspectionPhotoCaptureProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [capturedFile, setCapturedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const startCamera = async () => {
        setError(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false,
            });
            setStream(mediaStream);
            setCameraActive(true);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error('Camera access error:', err);
            setError('Could not access camera. Please use file upload instead.');
        }
    };

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
        setCameraActive(false);
    }, [stream]);

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], `inspection_${Date.now()}.jpg`, {
                            type: 'image/jpeg',
                        });
                        setCapturedFile(file);
                        setPreviewUrl(URL.createObjectURL(blob));
                        stopCamera();
                    }
                }, 'image/jpeg', 0.8);
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCapturedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const uploadPhoto = async () => {
        if (!capturedFile) return;

        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', capturedFile);
            formData.append('filename', `inspection_photo_${itemId}_${Date.now()}`);
            formData.append('docType', 'INSPECTION');
            if (unitId) {
                formData.append('unitId', unitId);
            }

            const response = await fetch('/api/documents', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            if (result.success) {
                const newPhotos = [...photos, result.data.fileUrl];
                onPhotosChange(itemId, newPhotos);
                resetCapture();
                setIsOpen(false);
            } else {
                setError(result.error || 'Failed to upload photo');
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError('Failed to upload photo. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const resetCapture = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setCapturedFile(null);
        setError(null);
    };

    const handleClose = () => {
        stopCamera();
        resetCapture();
        setIsOpen(false);
    };

    const handleDeletePhoto = (index: number) => {
        const newPhotos = photos.filter((_, i) => i !== index);
        onPhotosChange(itemId, newPhotos);
    };

    return (
        <div className="relative">
            {/* Camera Button with photo count */}
            <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsOpen(true)}
                className="relative"
            >
                <Camera className="w-4 h-4" />
                {photos.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {photos.length}
                    </span>
                )}
            </Button>

            {/* Photo Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold">Inspection Photos</h3>
                            <Button variant="secondary" size="sm" onClick={handleClose}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-4">
                            {/* Existing Photos */}
                            {photos.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium mb-2">
                                        Existing Photos ({photos.length})
                                    </h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        {photos.map((photo, index) => (
                                            <div key={index} className="relative group">
                                                <img
                                                    src={photo}
                                                    alt={`Inspection photo ${index + 1}`}
                                                    className="w-full h-24 object-cover rounded-lg"
                                                />
                                                <button
                                                    onClick={() => handleDeletePhoto(index)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Camera/Upload Section */}
                            <div className="border-t pt-4">
                                <h4 className="text-sm font-medium mb-2">Add New Photo</h4>

                                {error && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Preview */}
                                {previewUrl ? (
                                    <div className="space-y-4">
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="w-full max-h-64 object-contain rounded-lg border"
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                variant="secondary"
                                                onClick={resetCapture}
                                                className="flex-1"
                                            >
                                                Retake
                                            </Button>
                                            <Button
                                                onClick={uploadPhoto}
                                                disabled={uploading}
                                                className="flex-1"
                                            >
                                                {uploading ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="w-4 h-4" />
                                                        Save Photo
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ) : cameraActive ? (
                                    <div className="space-y-4">
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            className="w-full rounded-lg border"
                                        />
                                        <canvas ref={canvasRef} className="hidden" />
                                        <div className="flex gap-2">
                                            <Button
                                                variant="secondary"
                                                onClick={stopCamera}
                                                className="flex-1"
                                            >
                                                Cancel
                                            </Button>
                                            <Button onClick={capturePhoto} className="flex-1">
                                                <Camera className="w-4 h-4" />
                                                Capture
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <Button onClick={startCamera} className="w-full">
                                            <Camera className="w-4 h-4" />
                                            Use Camera
                                        </Button>
                                        <div className="relative">
                                            <Button
                                                variant="secondary"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-full"
                                            >
                                                <ImageIcon className="w-4 h-4" />
                                                Choose from Gallery
                                            </Button>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
